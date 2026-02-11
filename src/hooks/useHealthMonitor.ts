import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { runHealthChecks, HealthCheckResult } from '@/services/healthCheckService';

interface SystemHealth {
    id: string;
    project_id: string;
    service_name: string;
    service_type: string;
    status: 'operational' | 'degraded' | 'error';
    last_check_at: string;
    error_message: string | null;
    metadata: Record<string, unknown> | null;
}

interface SystemAlert {
    id: string;
    service_id: string;
    title: string;
    description: string | null;
    severity: 'info' | 'warning' | 'critical';
    is_resolved: boolean;
    created_at: string;
}

interface UseHealthMonitorResult {
    services: SystemHealth[];
    alerts: SystemAlert[];
    loading: boolean;
    refreshing: boolean;
    lastCheckTime: Date | null;
    refresh: () => Promise<void>;
    runChecks: () => Promise<void>;
}

const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useHealthMonitor(projectId: string): UseHealthMonitorResult {
    const [services, setServices] = useState<SystemHealth[]>([]);
    const [alerts, setAlerts] = useState<SystemAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastCheckTimeRef = useRef<Date | null>(null);
    const runningRef = useRef(false);

    // Keep ref in sync
    useEffect(() => {
        lastCheckTimeRef.current = lastCheckTime;
    }, [lastCheckTime]);

    const fetchHealthData = useCallback(async () => {
        try {
            const { data: healthData } = await supabase
                .from('system_health')
                .select('*')
                .eq('project_id', projectId)
                .order('service_name');

            if (healthData) {
                setServices(healthData as unknown as SystemHealth[]);
            }

            const { data: alertsData } = await supabase
                .from('system_alerts')
                .select('*')
                .eq('is_resolved', false)
                .order('created_at', { ascending: false });

            if (alertsData) {
                setAlerts(alertsData as unknown as SystemAlert[]);
            }
        } catch (error) {
            console.error('[useHealthMonitor] Error fetching health data:', error);
        }
    }, [projectId]);

    const runChecks = useCallback(async () => {
        if (runningRef.current) return;
        runningRef.current = true;
        try {
            setRefreshing(true);
            await runHealthChecks(projectId);
            await fetchHealthData();
            setLastCheckTime(new Date());
        } catch (error) {
            console.error('[useHealthMonitor] Error running health checks:', error);
        } finally {
            setRefreshing(false);
            runningRef.current = false;
        }
    }, [projectId, fetchHealthData]);

    const refresh = useCallback(async () => {
        setRefreshing(true);
        await fetchHealthData();
        setRefreshing(false);
    }, [fetchHealthData]);

    // Initial load — runs once per projectId
    useEffect(() => {
        let mounted = true;

        const initialize = async () => {
            setLoading(true);
            await fetchHealthData();
            if (mounted) setLoading(false);
            await runChecks();
        };

        initialize();

        return () => { mounted = false; };
    }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Periodic health checks
    useEffect(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        intervalRef.current = setInterval(() => {
            runChecks();
        }, HEALTH_CHECK_INTERVAL);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [runChecks]);

    // Realtime subscriptions
    useEffect(() => {
        const channel = supabase
            .channel('health-monitor-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'system_health', filter: `project_id=eq.${projectId}` },
                () => {
                    fetchHealthData();
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'system_alerts' },
                () => {
                    fetchHealthData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [projectId, fetchHealthData]);

    // Run health check when tab becomes visible (uses ref to avoid dep on lastCheckTime)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                const last = lastCheckTimeRef.current;
                if (!last || Date.now() - last.getTime() > 60000) {
                    runChecks();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [runChecks]);

    return {
        services,
        alerts,
        loading,
        refreshing,
        lastCheckTime,
        refresh,
        runChecks,
    };
}
