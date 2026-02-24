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
  lqr: number | null;
  cpql: number | null;
  visits: number;
  cpv: number | null;
  paid: number;
  cac: number | null;
  revenue: number;
  romi: number | null;
}

const QUALIFIED_STATUSES = ['qualified', 'visit_completed', 'proposal', 'purchased'];
const VISIT_STATUSES = ['visit_completed', 'qualified', 'proposal', 'purchased'];
const PAID_STATUSES = ['purchased'];

const normalizePlatform = (value: string | null) => (value || '').toLowerCase();

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
      const [accountsRes, statsRes, leadsRes] = await Promise.all([
        supabase
          .from('ad_accounts')
          .select('id, ad_account_id, ad_account_name, selected_ad_account_name, status, platform')
          .eq('project_id', projectId),
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

      setAccounts(metaAccounts as MetaAdAccount[]);
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

  const { rows, totals, hasAccounts } = useMemo(() => {
    const accountInfo = new Map<string, { name: string; status: string | null }>();
    accounts.forEach((account) => {
      const accountId = account.ad_account_id || account.id;
      if (!accountId) return;
      const name = account.selected_ad_account_name || account.ad_account_name || account.ad_account_id || 'Meta Account';
      accountInfo.set(accountId, { name, status: account.status });
    });

    const campaignToAccount = new Map<string, string>();
    marketingStats.forEach((stat) => {
      if (stat.campaign_id && stat.ad_account_id) {
        campaignToAccount.set(stat.campaign_id, stat.ad_account_id);
      }
    });

    const statsByAccount = new Map<string, { spend: number; leadsMeta: number }>();
    marketingStats.forEach((stat) => {
      const accountId = stat.ad_account_id || (stat.campaign_id ? campaignToAccount.get(stat.campaign_id) : null);
      if (!accountId) return;
      const current = statsByAccount.get(accountId) || { spend: 0, leadsMeta: 0 };
      current.spend += Number(stat.spend || 0);
      current.leadsMeta += Number(stat.leads || 0);
      statsByAccount.set(accountId, current);
    });

    const leadsByAccount = new Map<string, { total: number; qualified: number; visits: number; paid: number; revenue: number }>();
    leads.forEach((lead) => {
      const accountId = lead.fb_ad_account_id || (lead.fb_campaign_id ? campaignToAccount.get(lead.fb_campaign_id) : null);
      if (!accountId) return;

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

    const accountIds = new Set<string>([
      ...accountInfo.keys(),
      ...statsByAccount.keys(),
      ...leadsByAccount.keys(),
    ]);

    const rows = Array.from(accountIds).map((accountId) => {
      const info = accountInfo.get(accountId);
      const stats = statsByAccount.get(accountId) || { spend: 0, leadsMeta: 0 };
      const crm = leadsByAccount.get(accountId) || { total: 0, qualified: 0, visits: 0, paid: 0, revenue: 0 };

      const spend = stats.spend * KZT_RATE;
      const totalLeads = stats.leadsMeta > 0 ? Math.max(stats.leadsMeta, crm.total) : crm.total;
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
        lqr,
        cpql,
        visits: crm.visits,
        cpv,
        paid: crm.paid,
        cac,
        revenue: crm.revenue,
        romi,
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
    };

    return { rows, totals: totalsComputed, hasAccounts: accountInfo.size > 0 };
  }, [accounts, marketingStats, leads]);

  return {
    rows,
    totals,
    hasAccounts,
    loading,
    error,
    refetch: fetchData,
  };
};
