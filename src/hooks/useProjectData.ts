// @ts-nocheck
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth } from 'date-fns';
import { toast } from 'sonner';
import { validateFieldValue, logError } from '@/lib/validation';
import { useAuth } from './useAuth';
import { usePermissions } from './usePermissions';

// Stale time (5 minutes) — data won't be re-fetched more often
const STALE_TIME = 5 * 60 * 1000;

export interface DailyData {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  followers: number;
  followers_total: number;
  ig_followers_new?: number;
  new_followers?: number;
  visits: number;
  sales: number;
  revenue: number;
}

export interface PlanData {
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  followers: number;
  visits: number;
  sales: number;
  revenue: number;
}

export const useProjectData = (projectId: string | null) => {
  const { isAdmin } = useAuth();
  const effectiveProjectId = projectId;

  const { canEditPlan, canEditDailyData, canViewSales, canViewRevenue } = usePermissions(effectiveProjectId);
  const [dailyData, setDailyData] = useState<Record<string, DailyData>>({});
  const [plansMap, setPlansMap] = useState<Record<string, PlanData>>({});
  const [loading, setLoading] = useState(true);

  // Cache & guards
  const lastFetchTimeRef = useRef<number>(0);
  const lastProjectIdRef = useRef<string | null>(null);
  const fetchingDailyRef = useRef(false);
  const fetchingPlanRef = useRef(false);
  const realtimeThrottleRef = useRef<number>(0);

  // Stable refs for mutable state used in useCallback (avoids re-creating callbacks)
  const plansMapRef = useRef(plansMap);
  plansMapRef.current = plansMap;
  const dailyDataRef = useRef(dailyData);
  dailyDataRef.current = dailyData;

  const planData = useMemo((): PlanData => {
    const currentMonthKey = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const currentPlan = plansMap[currentMonthKey];

    if (!currentPlan) {
      return {
        spend: 0, impressions: 0, clicks: 0, leads: 0,
        followers: 0, visits: 0, sales: 0, revenue: 0,
      };
    }
    return currentPlan;
  }, [plansMap]);

  // Fetch daily data — NO auto-sync, read-only from Supabase tables
  const fetchDailyData = useCallback(async (force = false) => {
    if (!effectiveProjectId) {
      setDailyData({});
      setLoading(false);
      return;
    }

    // Guard: prevent concurrent fetches
    if (fetchingDailyRef.current) return;

    const now = Date.now();
    const isSameProject = lastProjectIdRef.current === effectiveProjectId;
    const isStale = now - lastFetchTimeRef.current > STALE_TIME;

    // Skip if data is fresh and project hasn't changed
    if (!force && isSameProject && !isStale) {
      return;
    }

    fetchingDailyRef.current = true;

    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');

      // Read from Supabase only — no Meta API calls from UI
      const [dailyResult, adsResult] = await Promise.all([
        supabase
          .from('daily_data')
          .select('*')
          .eq('project_id', effectiveProjectId)
          .order('date', { ascending: true }),

        supabase
          .from('ad_performance_logs')
          .select('*')
          .eq('project_id', effectiveProjectId)
          .eq('date_start', todayStr)
      ]);

      const { data, error } = dailyResult;
      const { data: adsLogs, error: adsError } = adsResult;

      if (adsError) {
        console.error('[useProjectData] Error fetching ads logs:', adsError);
      }

      if (error) {
        if (error.code === '20' || error.message?.includes('AbortError') || error.message?.includes('aborted')) {
          return;
        }
        logError('Fetch daily data failed', error);
        toast.error('Ошибка загрузки данных: ' + error.message);
        return;
      }

      const dataMap: Record<string, DailyData> = {};

      // 1. Process standard daily_data
      data?.forEach((row) => {
        const followersDelta = Number(row.ig_followers_new) || Number(row.new_followers) || Number(row.followers) || 0;

        dataMap[row.date] = {
          date: row.date,
          spend: Number(row.spend) || 0,
          impressions: Number(row.impressions) || 0,
          clicks: Number(row.clicks) || 0,
          leads: Number(row.leads) || 0,
          followers: followersDelta,
          followers_total: Number(row.followers_total) || 0,
          ig_followers_new: Number(row.ig_followers_new) || 0,
          new_followers: Number(row.new_followers) || 0,
          visits: Number(row.visits) || Number(row.diagnostics) || 0,
          sales: Number(row.sales) || 0,
          revenue: Number(row.revenue) || 0,
        };
      });

      // 2. Merge real-time ads data for today (read-only from DB)
      if (adsLogs && adsLogs.length > 0) {
        const uniqueLogs: Record<string, any> = {};
        adsLogs.forEach((item: any) => {
            const key = `${item.entity_id}_${item.date_start}`;
            const currentSpend = Number(item.spend) || 0;
            const existingSpend = uniqueLogs[key] ? (Number(uniqueLogs[key].spend) || 0) : -1;

            if (!uniqueLogs[key] || currentSpend >= existingSpend) {
                uniqueLogs[key] = item;
            }
        });

        let todaySpend = 0;
        let todayImpressions = 0;
        let todayClicks = 0;
        let todayLeads = 0;

        Object.values(uniqueLogs).forEach((log: any) => {
          todaySpend += Number(log.spend) || 0;
          todayImpressions += Number(log.impressions) || 0;
          todayClicks += Number(log.clicks) || 0;
          todayLeads += Number(log.leads) || 0;
        });

        if (!dataMap[todayStr]) {
           dataMap[todayStr] = {
             date: todayStr,
             spend: 0, impressions: 0, clicks: 0, leads: 0,
             followers: 0, followers_total: 0, visits: 0,
             sales: 0, revenue: 0, ig_followers_new: 0, new_followers: 0
           };
        }

        dataMap[todayStr].spend = todaySpend;
        dataMap[todayStr].impressions = todayImpressions;
        dataMap[todayStr].clicks = todayClicks;
        dataMap[todayStr].leads = Math.max(dataMap[todayStr].leads, todayLeads);
      }

      setDailyData(dataMap);
      lastFetchTimeRef.current = now;
      lastProjectIdRef.current = effectiveProjectId;
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        return;
      }
      console.error('[useProjectData] Exception fetching daily data:', err);
      toast.error('Критическая ошибка загрузки данных');
    } finally {
      fetchingDailyRef.current = false;
    }
  }, [effectiveProjectId]);

  // Fetch ALL plan data
  const fetchPlanData = useCallback(async (force = false) => {
    if (!effectiveProjectId) {
      setPlansMap({});
      setLoading(false);
      return;
    }

    // Guard: prevent concurrent fetches
    if (fetchingPlanRef.current) return;
    fetchingPlanRef.current = true;

    try {
      const { data, error } = await supabase
        .from('plan_data')
        .select('*')
        .eq('project_id', effectiveProjectId);

      if (error) {
        if (error.code === '20' || error.message?.includes('AbortError') || error.message?.includes('aborted')) {
          return;
        }
        logError('Fetch plan data failed', error);
        if (error.code !== '42501') {
          toast.error('Ошибка загрузки плана: ' + error.message);
        }
        return;
      }

      if (data) {
        const newPlansMap: Record<string, PlanData> = {};

        data.forEach(plan => {
          if (plan.month) {
            newPlansMap[plan.month] = {
              spend: Number(plan.spend) || 0,
              impressions: Number(plan.impressions) || 0,
              clicks: Number(plan.clicks) || 0,
              leads: Number(plan.leads) || 0,
              followers: Number(plan.followers) || 0,
              visits: Number(plan.visits) || Number(plan.diagnostics) || 0,
              sales: Number(plan.sales) || 0,
              revenue: Number(plan.revenue) || 0,
            };
          }
        });

        setPlansMap(newPlansMap);
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        return;
      }
      console.error('[useProjectData] Exception fetching plan data:', err);
    } finally {
      fetchingPlanRef.current = false;
    }
  }, [effectiveProjectId]);

  // Update plan data with optimistic UI and month support
  const updatePlanData = useCallback(async (field: keyof PlanData, value: number, month?: string) => {
    if (!effectiveProjectId) {
      toast.error('Сначала выберите проект');
      return;
    }

    const validation = validateFieldValue(field, value);
    if (!validation.success) {
      toast.error(validation.error || 'Некорректное значение');
      return;
    }

    const targetMonth = month || format(startOfMonth(new Date()), 'yyyy-MM-dd');

    const previousPlansMap = { ...plansMapRef.current };

    setPlansMap(prev => {
      const existingPlan = prev[targetMonth] || {
        spend: 0, impressions: 0, clicks: 0, leads: 0, followers: 0, visits: 0, sales: 0, revenue: 0
      };

      return {
        ...prev,
        [targetMonth]: {
          ...existingPlan,
          [field]: value
        }
      };
    });

    try {
      const currentPlan = plansMapRef.current[targetMonth] || {
        spend: 0, impressions: 0, clicks: 0, leads: 0, followers: 0, visits: 0, sales: 0, revenue: 0
      };

      const upsertData = {
        project_id: effectiveProjectId,
        month: targetMonth,
        spend: field === 'spend' ? value : currentPlan.spend,
        impressions: field === 'impressions' ? value : currentPlan.impressions,
        clicks: field === 'clicks' ? value : currentPlan.clicks,
        leads: field === 'leads' ? value : currentPlan.leads,
        followers: field === 'followers' ? value : currentPlan.followers,
        visits: field === 'visits' ? value : currentPlan.visits,
        sales: field === 'sales' ? value : currentPlan.sales,
        revenue: field === 'revenue' ? value : currentPlan.revenue,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('plan_data')
        .upsert(upsertData, {
          onConflict: 'project_id,month',
          ignoreDuplicates: false
        });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      logError('Save plan data failed', error);
      console.error('[useProjectData] Error saving plan:', error);
      toast.error('Ошибка сохранения плана: ' + error.message);
      setPlansMap(previousPlansMap);
    }
  }, [effectiveProjectId, isAdmin, canEditPlan]);

  // Update daily data with optimistic UI
  const updateDailyData = useCallback(async (date: string, field: keyof DailyData, value: number) => {
    if (!effectiveProjectId) {
      toast.error('Сначала выберите проект');
      return;
    }

    const validation = validateFieldValue(field, value);
    if (!validation.success) {
      toast.error(validation.error || 'Некорректное значение');
      return;
    }

    const previousDailyData = { ...dailyDataRef.current };

    setDailyData(prev => {
      const existingData = prev[date] || {
        date: date,
        spend: 0, impressions: 0, clicks: 0, leads: 0, followers: 0, followers_total: 0,
        visits: 0, sales: 0, revenue: 0, ig_followers_new: 0, new_followers: 0
      };

      return {
        ...prev,
        [date]: {
          ...existingData,
          [field]: value
        }
      };
    });

    try {
      const currentData = dailyDataRef.current[date] || {
        date: date,
        spend: 0, impressions: 0, clicks: 0, leads: 0, followers: 0, followers_total: 0,
        visits: 0, sales: 0, revenue: 0, ig_followers_new: 0, new_followers: 0
      };

      const dataToSave = {
        ...currentData,
        [field]: value
      };

      const upsertPayload = {
        project_id: effectiveProjectId,
        date: date,
        spend: dataToSave.spend,
        impressions: dataToSave.impressions,
        clicks: dataToSave.clicks,
        leads: dataToSave.leads,
        followers: dataToSave.followers,
        followers_total: dataToSave.followers_total,
        diagnostics: dataToSave.visits,
        sales: dataToSave.sales,
        revenue: dataToSave.revenue,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('daily_data')
        .upsert(upsertPayload, {
          onConflict: 'project_id,date',
          ignoreDuplicates: false
        });

      if (error) throw error;

    } catch (error: any) {
      logError('Save daily data failed', error);
      console.error('[useProjectData] Error saving daily data:', error);
      toast.error('Ошибка сохранения данных: ' + error.message);
      setDailyData(previousDailyData);
    }
  }, [effectiveProjectId, isAdmin, canEditDailyData]);


  // Single load effect — runs once per projectId change
  useEffect(() => {
    if (!effectiveProjectId) {
      setDailyData({});
      setPlansMap({});
      setLoading(false);
      lastProjectIdRef.current = null;
      lastFetchTimeRef.current = 0;
      return;
    }
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      console.log('[useProjectData] Loading data for project:', effectiveProjectId);

      // Reset guards for new project
      fetchingDailyRef.current = false;
      fetchingPlanRef.current = false;

      try {
        await Promise.all([fetchDailyData(true), fetchPlanData(true)]);
        if (isMounted) {
          console.log('[useProjectData] Load complete');
        }
      } catch (err) {
        console.error('[useProjectData] Load error:', err);
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    loadData();

    // Subscribe to ad_performance_logs changes (read-only, throttled)
    const channel = supabase
      .channel(`project-data-ads-${effectiveProjectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ad_performance_logs',
          filter: `project_id=eq.${effectiveProjectId}`
        },
        () => {
           // Throttle realtime refreshes to max once per 30 seconds
           const now = Date.now();
           if (now - realtimeThrottleRef.current < 30000) return;
           realtimeThrottleRef.current = now;
           fetchDailyData(true);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [effectiveProjectId]); // Only on project change

  return {
    dailyData,
    planData,
    loading,
    updateDailyData,
    updatePlanData,
    plansMap,
    canEditPlan: isAdmin || canEditPlan,
    canEditDailyData: isAdmin || canEditDailyData,
    canViewSales: isAdmin || canViewSales,
    canViewRevenue: isAdmin || canViewRevenue,
    refetch: async () => {
      fetchingDailyRef.current = false;
      fetchingPlanRef.current = false;
      await Promise.all([fetchDailyData(true), fetchPlanData(true)]);
    },
    effectiveProjectId,
  };
};
