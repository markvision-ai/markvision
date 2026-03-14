import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
    const queryClient = useQueryClient();

    // Fetch actual configuration to ensure we show accounts even without metrics
    const { data: configs, isLoading: configsLoading } = useQuery({
        queryKey: ['clients-config', projectId],
        queryFn: async () => {
            if (!projectId) return [];
            const { data, error } = await supabase
                .from('clients_config')
                .select('id, ad_account_id, client_name, account_type')
                .eq('project_id', projectId)
                .in('account_type', ['agency', null] as any);
            if (error) throw error;
            // Show only agency accounts (or legacy accounts without type)
            return (data || []).filter((r: any) => !r.account_type || r.account_type === 'agency');
        },
        enabled: !!projectId,
    });

    // Fetch Aggregated Metrics from the SQL View
    const { data: viewData, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
        queryKey: ['agency-metrics-view', projectId, dateRange?.from?.toISOString()],
        queryFn: async () => {
            if (!projectId) return [];

            // Note: dateRange filtering isn't implemented in the pure view yet since it's global, 
            let query = (supabase as any)
                .from('agency_metrics_view')
                .select('*')
                .eq('project_id', projectId);

            if (dateRange?.from) {
                const year = dateRange.from.getFullYear();
                const month = String(dateRange.from.getMonth() + 1).padStart(2, '0');
                const monthStr = `${year}-${month}-01`;
                query = query.eq('month_start', monthStr);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
        },
        enabled: !!projectId,
    });

    // Realtime subscription to clients_config
    useEffect(() => {
        if (!projectId) return;

        const channel = supabase.channel('clients_config_updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'clients_config',
                },
                (payload) => {
                    console.log('Realtime clients_config update received!', payload);
                    // Invalidate and refetch metrics
                    queryClient.invalidateQueries({ queryKey: ['agency-metrics-view', projectId] });
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Successfully subscribed to clients_config realtime changes');
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [projectId, queryClient]);

    // Format metrics to the expected interface, merging config with metrics
    const metrics: AgencyMetrics[] = useMemo(() => {
        if (import.meta.env.DEV) {
            console.log('📊 DATA DEBUG:', {
                projectId,
                configsCount: configs?.length,
                viewDataCount: viewData?.length,
                dateFrom: dateRange?.from?.toISOString()
            });
        }

        if (!configs) return [];

        return configs.map((config: any) => {
            // Find metrics for this specific account in the view results
            const row = viewData?.find((r: any) => r.account_id === config.ad_account_id);

            // Calculation Logic:
            // We use metaLeads as the primary source for ad performance (CPL),
            // but for business metrics (LQR, Sales), we rely on CRM data.
            const metaLeads = row ? Number(row.meta_leads) || 0 : 0;
            const crmLeadsArr = row ? Number(row.crm_leads) || 0 : 0;
            const qualifiedLeads = row ? Number(row.qualified_leads) || 0 : 0;

            // LQR should ideally be based on Meta Leads if we talk about Ads Quality,
            // or based on total CRM leads if we talk about CRM quality.
            // Using Meta Leads as denominator for Marketing funnel context.
            const lqr = metaLeads > 0 ? (qualifiedLeads / metaLeads) * 100 : 0;

            return {
                accountId: config.ad_account_id || '',
                accountName: config.client_name || 'Неизвестный кабинет',
                status: true,
                spend: row ? Number(row.spend) || 0 : 0,
                metaLeads: metaLeads,
                crmLeads: crmLeadsArr,
                qualifiedLeads: qualifiedLeads,
                visits: row ? Number(row.visits) || 0 : 0,
                paidCustomers: row ? Number(row.sales) || 0 : 0,
                revenue: row ? Number(row.revenue) || 0 : 0,
                cpl: row ? Number(row.cpl) || 0 : 0,
                lqr: lqr,
                cpql: row ? Number(row.cpql) || 0 : 0,
                cpv: row ? Number(row.cpv) || 0 : 0,
                cac: row ? Number(row.cac) || 0 : 0,
                romi: row ? Number(row.romi) || 0 : 0,
            };
        });
    }, [configs, viewData, projectId, dateRange?.from]);

    // Force Edge Function Meta Sync
    const triggerSync = useCallback(async () => {
        if (!projectId) return;
        setSyncing(true);
        try {
            // Trigger our new dedicated edge function
            const { data, error } = await supabase.functions.invoke('sync-agency-spend', {
                body: {} // Project filtering can be inside if required, but currently it syncs all active configs
            });

            if (error) throw error;

            toast.success('Расходы из Meta Ads успешно синхронизированы!');
            refetchMetrics();
        } catch (e: any) {
            console.error('Meta sync failed:', e);
            toast.error(`Ошибка синхронизации: ${e.message}`);
        } finally {
            setSyncing(false);
        }
    }, [projectId, refetchMetrics]);

    // Connect Account (Manual entry into clients_config)
    const connectAccount = useCallback(async (accountId: string, accountName: string, accessToken: string, accountType: 'personal' | 'agency' = 'agency') => {
        if (!projectId) return;
        try {
            // Use upsert to handle both insert and update automatically based on ad_account_id.
            // This prevents "duplicate key" errors by letting the database handle the conflict.
            const result = await (supabase as any)
                .from('clients_config')
                .upsert({
                    project_id: projectId,
                    ad_account_id: accountId,
                    client_name: accountName,
                    fb_token: accessToken,
                    account_type: accountType
                }, {
                    onConflict: 'ad_account_id'
                });

            if (result.error) throw result.error;
            toast.success('Рекламный кабинет успешно подключен!');
            refetchMetrics();
        } catch (e: any) {
            toast.error(`Ошибка подключения: ${e.message}`);
        }
    }, [projectId, refetchMetrics]);

    return {
        metrics,
        isLoading: metricsLoading || configsLoading,
        syncing,
        triggerSync,
        connectAccount,
        refetchAll: () => {
            refetchMetrics();
        }
    };
};
