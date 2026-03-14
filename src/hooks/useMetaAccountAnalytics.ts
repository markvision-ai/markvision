import { useCallback, useEffect, useMemo, useState } from 'react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { KZT_RATE } from '@/constants/ads';

interface DateRange {
  from: Date;
  to: Date;
}

interface MetaAdAccount {
  id: string;
  ad_account_id: string | null;
  ad_account_name: string | null;
  selected_ad_account_name: string | null;
  status: string | null;
  platform: string | null;
}

interface MarketingStatRecord {
  ad_account_id: string | null;
  campaign_id: string | null;
  spend: number | null;
  clicks: number | null;
  impressions: number | null;
  leads: number | null;
  date: string;
}

interface LeadRecord {
  id: string;
  status: string | null;
  created_at: string | null;
  revenue: number | null;
  deal_amount: number | null;
  payment_status: string | null;
  fb_ad_account_id: string | null;
  fb_campaign_id: string | null;
}

export interface MetaAccountAnalyticsRow {
  accountId: string;
  accountName: string;
  spend: number;
  leads: number;
  leadsMeta: number;
  leadsCrm: number;
  qualifiedLeads: number;
  cpl: number | null;
  lqr: number | null;
  cpql: number | null;
  visits: number;
  cpv: number | null;
  paid: number;
  cac: number | null;
  revenue: number;
  romi: number | null;
  currency: string;
}

export interface MetaTotals {
  spend: number;
  leads: number;
  qualified: number;
  visits: number;
  paid: number;
  revenue: number;
  lqr: number | null;
  cpql: number | null;
  cpv: number | null;
  cac: number | null;
  romi: number | null;
  currency: string;
}

const QUALIFIED_STATUSES = ['qualified', 'visit_completed', 'proposal', 'purchased'];
const VISIT_STATUSES = ['visit_completed', 'qualified', 'proposal', 'purchased'];
const PAID_STATUSES = ['purchased'];

const normalizePlatform = (value: string | null) => (value || '').toLowerCase();
// Meta returns ad_account_id as 'act_XXXXXXXX' but our DB stores them without 'act_' prefix (and vice versa).
// Normalize both sides to be without prefix for comparison.
const normalizeAccountId = (id: string | null | undefined): string =>
  (id || '').replace(/^act_/, '');

export const useMetaAccountAnalytics = (projectId: string | null, dateRange: DateRange | null) => {
  const [accounts, setAccounts] = useState<MetaAdAccount[]>([]);
  const [marketingStats, setMarketingStats] = useState<MarketingStatRecord[]>([]);
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId || !dateRange?.from || !dateRange?.to) {
      setAccounts([]);
      setMarketingStats([]);
      setLeads([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const fromDate = format(startOfDay(dateRange.from), 'yyyy-MM-dd');
    const toDate = format(endOfDay(dateRange.to), 'yyyy-MM-dd');
    const fromDateTime = format(startOfDay(dateRange.from), "yyyy-MM-dd'T'HH:mm:ssXXX");
    const toDateTime = format(endOfDay(dateRange.to), "yyyy-MM-dd'T'HH:mm:ssXXX");

    try {
      const [accountsRes, personalConfigsRes, statsRes, leadsRes] = await Promise.all([
        supabase
          .from('ad_accounts')
          .select('id, ad_account_id, ad_account_name, selected_ad_account_name, status, platform')
          .eq('project_id', projectId),
        // Also load personal accounts from clients_config (account_type = 'personal')
        supabase
          .from('clients_config')
          .select('ad_account_id, client_name')
          .eq('project_id', projectId)
          .eq('account_type', 'personal'),
        (supabase as any)
          .from('marketing_stats')
          .select('ad_account_id, campaign_id, spend, clicks, impressions, leads, date')
          .eq('project_id', projectId)
          .in('source', ['facebook', 'meta'])
          .gte('date', fromDate)
          .lte('date', toDate),
        supabase
          .from('leads')
          .select('id, status, created_at, revenue, deal_amount, payment_status, fb_ad_account_id, fb_campaign_id')
          .eq('project_id', projectId)
          .gte('created_at', fromDateTime)
          .lte('created_at', toDateTime),
      ]);

      if (accountsRes.error) {
        throw accountsRes.error;
      }

      if (statsRes.error && statsRes.error.message) {
        setMarketingStats([]);
      } else {
        setMarketingStats((statsRes.data || []) as MarketingStatRecord[]);
      }

      if (leadsRes.error) {
        throw leadsRes.error;
      }

      const metaAccounts = (accountsRes.data || []).filter((account) => {
        const platform = normalizePlatform(account.platform);
        return !platform || platform.includes('facebook') || platform.includes('meta');
      });

      // Merge personal accounts from clients_config (account_type='personal') into metaAccounts
      const personalConfigs = (personalConfigsRes.data || []) as Array<{ ad_account_id: string; client_name: string | null }>;
      const existingIds = new Set(metaAccounts.map(a => normalizeAccountId(a.ad_account_id)));
      const extraAccounts: MetaAdAccount[] = personalConfigs
        .filter(c => c.ad_account_id && !existingIds.has(normalizeAccountId(c.ad_account_id)))
        .map(c => ({
          id: c.ad_account_id,
          ad_account_id: c.ad_account_id,
          ad_account_name: c.client_name,
          selected_ad_account_name: c.client_name,
          status: 'ACTIVE',
          platform: 'facebook',
        }));

      setAccounts([...metaAccounts, ...extraAccounts] as MetaAdAccount[]);
      setLeads((leadsRes.data || []) as LeadRecord[]);
    } catch (fetchError: any) {
      setError(fetchError?.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [projectId, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const { rows, totals, hasAccounts, currency } = useMemo(() => {
    const accountInfo = new Map<string, { name: string; status: string | null; currency: string | null }>();
    let detectedCurrency = 'KZT'; // Data from Meta API is stored in KZT (already converted)

    accounts.forEach((account) => {
      // Normalize: strip 'act_' prefix so 'act_123' and '123' map to the same account
      const accountId = normalizeAccountId(account.ad_account_id || account.id);
      if (!accountId) return;
      const name = account.selected_ad_account_name || account.ad_account_name || account.ad_account_id || 'Meta Account';

      // If we see a currency in the account status, we should ideally use it.
      // But useMetaAccountAnalytics doesn't fetch account_status yet. 
      // Let's assume some currency detection logic or at least keep the property.
      accountInfo.set(accountId, { name, status: account.status, currency: null });
    });

    const campaignToAccount = new Map<string, string>();
    marketingStats.forEach((stat) => {
      if (stat.campaign_id && stat.ad_account_id) {
        campaignToAccount.set(stat.campaign_id, stat.ad_account_id);
      }
    });

    const statsByAccount = new Map<string, { spend: number; leadsMeta: number }>();
    marketingStats.forEach((stat) => {
      // Normalize account ID from stats (Meta stores as 'act_XXXX')
      const accountId = normalizeAccountId(stat.ad_account_id || (stat.campaign_id ? campaignToAccount.get(stat.campaign_id) : null));
      if (!accountId) return;
      const current = statsByAccount.get(accountId) || { spend: 0, leadsMeta: 0 };
      current.spend += Number(stat.spend || 0);
      current.leadsMeta += Number(stat.leads || 0);
      statsByAccount.set(accountId, current);
    });

    const leadsByAccount = new Map<string, { total: number; qualified: number; visits: number; paid: number; revenue: number }>();
    leads.forEach((lead) => {
      // Normalize account ID; if lead has no account attribution, group under unattributed
      const rawId = lead.fb_ad_account_id || (lead.fb_campaign_id ? campaignToAccount.get(lead.fb_campaign_id) : null);
      const accountId = rawId ? normalizeAccountId(rawId) : '__unattributed__';

      const current = leadsByAccount.get(accountId) || { total: 0, qualified: 0, visits: 0, paid: 0, revenue: 0 };
      current.total += 1;

      if (QUALIFIED_STATUSES.includes(lead.status || '')) {
        current.qualified += 1;
      }
      if (VISIT_STATUSES.includes(lead.status || '')) {
        current.visits += 1;
      }
      const isPaid = PAID_STATUSES.includes(lead.status || '') || lead.payment_status === 'paid' || (lead.revenue || lead.deal_amount || 0) > 0;
      if (isPaid) {
        current.paid += 1;
      }

      current.revenue += Number(lead.revenue ?? lead.deal_amount ?? 0);
      leadsByAccount.set(accountId, current);
    });

    // Only show accounts explicitly connected to this project (from ad_accounts).
    // Agency clients live in clients_config and are shown in AgencyAccountsDashboard only.
    const accountIds = new Set<string>(accountInfo.keys());

    const rows = Array.from(accountIds).map((accountId) => {
      const info = accountInfo.get(accountId);
      const stats = statsByAccount.get(accountId) || { spend: 0, leadsMeta: 0 };
      const crm = leadsByAccount.get(accountId) || { total: 0, qualified: 0, visits: 0, paid: 0, revenue: 0 };

      const spendRaw = stats.spend;
      // Currency is already KZT (synced from Meta with KZT conversion applied server-side)
      const spend = spendRaw;

      // Use leadsMeta as the primary source of truth (from Meta API).
      // leadsCrm is shown separately for comparison — don't merge them with Math.max.
      const totalLeads = stats.leadsMeta > 0 ? stats.leadsMeta : crm.total;
      const cpl = totalLeads > 0 ? spend / totalLeads : null;
      const lqr = totalLeads > 0 ? (crm.qualified / totalLeads) * 100 : null;
      const cpql = crm.qualified > 0 ? spend / crm.qualified : null;
      const cpv = crm.visits > 0 ? spend / crm.visits : null;
      const cac = crm.paid > 0 ? spend / crm.paid : null;
      const romi = spend > 0 ? ((crm.revenue - spend) / spend) * 100 : null;

      return {
        accountId,
        accountName: info?.name || accountId,
        spend,
        leads: totalLeads,
        leadsMeta: stats.leadsMeta,
        leadsCrm: crm.total,
        qualifiedLeads: crm.qualified,
        cpl,
        lqr,
        cpql,
        visits: crm.visits,
        cpv,
        paid: crm.paid,
        cac,
        revenue: crm.revenue,
        romi,
        currency: detectedCurrency
      } as MetaAccountAnalyticsRow;
    }).sort((a, b) => b.spend - a.spend || b.leads - a.leads);


    const totals = rows.reduce(
      (acc, row) => {
        acc.spend += row.spend;
        acc.leads += row.leads;
        acc.qualified += row.qualifiedLeads;
        acc.visits += row.visits;
        acc.paid += row.paid;
        acc.revenue += row.revenue;
        return acc;
      },
      { spend: 0, leads: 0, qualified: 0, visits: 0, paid: 0, revenue: 0 }
    );

    const totalsComputed = {
      ...totals,
      lqr: totals.leads > 0 ? (totals.qualified / totals.leads) * 100 : null,
      cpql: totals.qualified > 0 ? totals.spend / totals.qualified : null,
      cpv: totals.visits > 0 ? totals.spend / totals.visits : null,
      cac: totals.paid > 0 ? totals.spend / totals.paid : null,
      romi: totals.spend > 0 ? ((totals.revenue - totals.spend) / totals.spend) * 100 : null,
      currency: detectedCurrency
    };

    return { rows, totals: totalsComputed, hasAccounts: accountInfo.size > 0, currency: detectedCurrency };
  }, [accounts, marketingStats, leads]);

  return {
    rows,
    totals,
    hasAccounts,
    currency,
    loading,
    error,
    refetch: fetchData,
  };
};
