import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface AgencyMetrics {
    accountId: string;
    accountName: string;
    status: boolean;
    spend: number;
    metaLeads: number;
    crmLeads: number;
    qualifiedLeads: number;
    visits: number;
    paidCustomers: number;
    revenue: number;

    // Calculated
    cpl: number;
    lqr: number; // Percent
    cpql: number;
    cpv: number;
    cac: number;
    romi: number; // Percent
}

export const useAgencyAnalytics = (projectId: string | null, dateRange: { from?: Date; to?: Date }) => {
    const [syncing, setSyncing] = useState(false);

    // 1. Get all connected agency accounts
    const { data: accounts, isLoading: accountsLoading, refetch: refetchAccounts } = useQuery({
        queryKey: ['agency-accounts', projectId],
        queryFn: async () => {
            if (!projectId) return [];
            const { data, error } = await supabase
                .from('connected_ad_accounts')
                .select('*')
                .eq('project_id', projectId);

            if (error) throw error;
            return data || [];
        },
        enabled: !!projectId,
    });

    // 2. Fetch Aggregated Leads/Revenue from CRM
    const { data: crmData, isLoading: crmLoading, refetch: refetchCrm } = useQuery({
        queryKey: ['agency-crm-data', projectId, dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
        queryFn: async () => {
            if (!projectId) return [];

            let query = supabase
                .from('leads')
                .select('fb_ad_account_id, status, revenue, created_at')
                .eq('project_id', projectId)
                .not('fb_ad_account_id', 'is', null);

            if (dateRange?.from) {
                query = query.gte('created_at', dateRange.from.toISOString());
            }
            if (dateRange?.to) {
                // Add 1 day to include the entire 'to' date
                const endDate = new Date(dateRange.to);
                endDate.setDate(endDate.getDate() + 1);
                query = query.lt('created_at', endDate.toISOString());
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        },
        enabled: !!projectId,
    });

    // 3. Fetch Ad Performance Logs (Spend & Meta Leads)
    const { data: adData, isLoading: adLoading, refetch: refetchAds } = useQuery({
        queryKey: ['agency-ad-data', projectId, dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
        queryFn: async () => {
            if (!projectId) return [];

            // We look at campaign level aggregations or ad level, depending on what we saved.
            // Usually ads-manager saves 'campaign' level logs or 'ad' level.
            // Let's assume we sum spend per account. However, ad_performance_logs only has entity_id.
            // Easiest is to fetch all marketing_stats or ad_insights which are tied to ad_account_id if available.
            // Alternatively, we can use `ad_insights` table which has `ad_account_id` and `spend` natively if it was properly populated,
            // or we can use `marketing_stats` which has `ad_account_id`, `spend`, `leads`.

            let query = supabase
                .from('marketing_stats')
                .select('ad_account_id, spend, leads, date')
                .eq('project_id', projectId)
                .eq('source', 'facebook');

            if (dateRange?.from) {
                query = query.gte('date', dateRange.from.toISOString().split('T')[0]);
            }
            if (dateRange?.to) {
                query = query.lte('date', dateRange.to.toISOString().split('T')[0]);
            }

            const { data, error } = await query;
            if (error) {
                console.error('Marketing stats query error:', error);
                return [];
            }
            return data || [];
        },
        enabled: !!projectId,
    });

    // 4. Force Edge Function Meta Sync
    const triggerSync = useCallback(async () => {
        if (!projectId) return;
        setSyncing(true);
        try {
            // For each connected account, ideally we trigger sync or we trigger one global sync.
            // Our sync-meta-ads checks integrations, pixel, projects_meta_token.
            const dateFrom = dateRange?.from ? dateRange.from.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            const dateTo = dateRange?.to ? dateRange.to.toISOString().split('T')[0] : dateFrom;

            const { data, error } = await supabase.functions.invoke('ads-manager', {
                body: {
                    action: 'sync_metrics',
                    payload: {
                        projectId,
                        date_range: { since: dateFrom, until: dateTo }
                    }
                }
            });

            if (error) throw error;

            toast.success('Данные из Meta Ads успешно синхронизированы!');
            // Refetch stats
            refetchAds();
        } catch (e: any) {
            console.error('Meta sync failed:', e);
            // Don't show critical toast here to avoid spamming user if Meta token is invalid
            toast.error(`Ошибка синхронизации: ${e.message}`);
        } finally {
            setSyncing(false);
        }
    }, [projectId, dateRange, refetchAds]);

    // Connect Account (Manual entry)
    const connectAccount = useCallback(async (accountId: string, accountName: string, accessToken: string) => {
        if (!projectId) return;
        try {
            // 1. Check if account already exists
            const { data: existingAccount } = await supabase
                .from('ad_accounts')
                .select('id')
                .eq('project_id', projectId)
                .eq('platform', 'facebook')
                .eq('ad_account_id', accountId)
                .maybeSingle();

            let result;
            if (existingAccount) {
                // Update
                result = await supabase
                    .from('ad_accounts')
                    .update({
                        ad_account_name: accountName,
                        selected_ad_account_name: accountName,
                        access_token: accessToken,
                        status: 'active',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingAccount.id);
            } else {
                // Insert
                result = await supabase
                    .from('ad_accounts')
                    .insert({
                        project_id: projectId,
                        platform: 'facebook',
                        ad_account_id: accountId,
                        ad_account_name: accountName,
                        selected_ad_account_name: accountName,
                        access_token: accessToken,
                        status: 'active',
                        updated_at: new Date().toISOString()
                    });
            }

            if (result.error) throw result.error;
            toast.success('Рекламный кабинет успешно подключен!');
            refetchAccounts();
        } catch (e: any) {
            toast.error(`Ошибка подключения: ${e.message}`);
        }
    }, [projectId, refetchAccounts]);

    // 5. Aggregate metrics
    const metrics: AgencyMetrics[] = useMemo(() => {
        if (!accounts) return [];

        return accounts.map(acc => {
            // Ad Stats (Spend, Leads from Meta)
            const accountAdData = (adData || []).filter(ad =>
                // fallback matching by formatting id if needed e.g. "act_1234" vs "1234"
                ad.ad_account_id === acc.fb_ad_account_id ||
                ad.ad_account_id === acc.fb_ad_account_id?.replace('act_', '') ||
                `act_${ad.ad_account_id}` === acc.fb_ad_account_id
            );

            const totalSpend = accountAdData.reduce((sum, item) => sum + (Number(item.spend) || 0), 0);
            const metaLeads = accountAdData.reduce((sum, item) => sum + (Number(item.leads) || 0), 0);

            // CRM Stats
            const accountCrmData = (crmData || []).filter(lead => lead.fb_ad_account_id === acc.fb_ad_account_id);

            const crmLeads = accountCrmData.length;

            // Status mapping based on prompt: 'Новый', 'Квалифицирован', 'Визит', 'Оплатил' (or paid/success/visit equivalents)
            // Usually in MarkVision: 
            // Qualified = 'qualified', 'hot', 'warm', 'visit', 'paid'
            // Visit = 'visit', 'show_up', 'paid'
            // Paid = 'paid', 'success'
            const qualifiedStatuses = ['qualified', 'hot', 'warm', 'Квалифицирован', 'Визит', 'Оплатил', 'visit', 'paid', 'success'];
            const visitStatuses = ['visit', 'show_up', 'Визит', 'Оплатил', 'paid', 'success'];
            const paidStatuses = ['paid', 'success', 'Оплатил'];

            const qualifiedLeads = accountCrmData.filter(l => qualifiedStatuses.includes(l.status?.toLowerCase() || '')).length;
            const visits = accountCrmData.filter(l => visitStatuses.includes(l.status?.toLowerCase() || '')).length;
            const paidCustomers = accountCrmData.filter(l => paidStatuses.includes(l.status?.toLowerCase() || '')).length;

            const revenue = accountCrmData.reduce((sum, item) => sum + (Number(item.revenue) || 0), 0);

            const resolvedLeadsCount = Math.max(metaLeads, crmLeads); // Usually we use max or exact meta
            const baseLeads = resolvedLeadsCount > 0 ? resolvedLeadsCount : 0;

            // Formulas
            const cpl = baseLeads > 0 ? totalSpend / baseLeads : 0;
            const lqr = baseLeads > 0 ? (qualifiedLeads / baseLeads) * 100 : 0;
            const cpql = qualifiedLeads > 0 ? totalSpend / qualifiedLeads : 0;
            const cpv = visits > 0 ? totalSpend / visits : 0;
            const cac = paidCustomers > 0 ? totalSpend / paidCustomers : 0;
            const romi = totalSpend > 0 ? ((revenue - totalSpend) / totalSpend) * 100 : 0;

            return {
                accountId: acc.fb_ad_account_id || '',
                accountName: acc.account_name || 'Неизвестный кабинет',
                status: acc.status || false,
                spend: totalSpend,
                metaLeads,
                crmLeads,
                qualifiedLeads,
                visits,
                paidCustomers,
                revenue,
                cpl,
                lqr,
                cpql,
                cpv,
                cac,
                romi,
            };
        });
    }, [accounts, adData, crmData]);

    const isLoading = accountsLoading || crmLoading || adLoading;

    return {
        metrics,
        isLoading,
        syncing,
        triggerSync,
        connectAccount,
        refetchAll: () => {
            refetchAccounts();
            refetchCrm();
            refetchAds();
        }
    };
};
