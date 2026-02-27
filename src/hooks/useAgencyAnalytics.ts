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

    // Fetch Aggregated Metrics from the SQL View
    const { data: viewData, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
        queryKey: ['agency-metrics-view', projectId],
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

    // Format metrics to the expected interface
    const metrics: AgencyMetrics[] = useMemo(() => {
        if (!viewData) return [];

        return viewData.map((row: any) => {
            const baseLeads = Math.max(Number(row.meta_leads) || 0, Number(row.crm_leads) || 0);
            const qualifiedLeads = Number(row.qualified_leads) || 0;
            const lqr = baseLeads > 0 ? (qualifiedLeads / baseLeads) * 100 : 0;

            return {
                accountId: row.account_id || '',
                accountName: row.account_name || 'Неизвестный кабинет',
                status: true, // Configs in clients_config are assumed active by default
                spend: Number(row.spend) || 0,
                metaLeads: Number(row.meta_leads) || 0,
                crmLeads: Number(row.crm_leads) || 0,
                qualifiedLeads: qualifiedLeads,
                visits: Number(row.visits) || 0,
                paidCustomers: Number(row.sales) || 0,
                revenue: Number(row.revenue) || 0,
                cpl: Number(row.cpl) || 0,
                lqr: lqr,
                cpql: Number(row.cpql) || 0,
                cpv: Number(row.cpv) || 0,
                cac: Number(row.cac) || 0,
                romi: Number(row.romi) || 0,
            };
        });
    }, [viewData]);

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
    const connectAccount = useCallback(async (accountId: string, accountName: string, accessToken: string) => {
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
                    fb_token: accessToken
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
        isLoading: metricsLoading,
        syncing,
        triggerSync,
        connectAccount,
        refetchAll: () => {
            refetchMetrics();
        }
    };
};
