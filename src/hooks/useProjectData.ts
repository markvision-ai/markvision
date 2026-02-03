// @ts-nocheck
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase, FALLBACK_PROJECT_ID } from '@/integrations/supabase/client';
import { format, startOfMonth } from 'date-fns';
import { toast } from 'sonner';
import { validateFieldValue, logError } from '@/lib/validation';
import { useAuth } from './useAuth';
import { usePermissions } from './usePermissions';

// Жёстко закодированный project_id для использования по умолчанию
const DEFAULT_PROJECT_ID = FALLBACK_PROJECT_ID;

// Время устаревания данных (5 минут) - данные не будут перезапрашиваться чаще
const STALE_TIME = 5 * 60 * 1000;

export interface DailyData {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  followers: number;
  followers_total: number;
  ig_followers_new?: number; // Added for compatibility
  new_followers?: number;    // Added for compatibility
  diagnostics: number;
  sales: number;
  revenue: number;
}

interface PlanData {
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  followers: number;
  diagnostics: number;
  sales: number;
  revenue: number;
}

export const useProjectData = (projectId: string | null) => {
  const { isAdmin } = useAuth();
  // Используем переданный projectId или DEFAULT_PROJECT_ID
  const effectiveProjectId = projectId || DEFAULT_PROJECT_ID;
  
  const { canEditPlan, canEditDailyData, canViewSales, canViewRevenue } = usePermissions(effectiveProjectId);
  const [dailyData, setDailyData] = useState<Record<string, DailyData>>({});
  const [plansMap, setPlansMap] = useState<Record<string, PlanData>>({});
  const [loading, setLoading] = useState(true);
  
  // Кэш для предотвращения лишних запросов
  const lastFetchTimeRef = useRef<number>(0);
  const lastProjectIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ПЛАН берётся из записи за 1-е число текущего месяца (или из plansMap)
  const planData = useMemo((): PlanData => {
    const currentMonthKey = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const currentPlan = plansMap[currentMonthKey];
    
    if (!currentPlan) {
      return {
        spend: 0,
        impressions: 0,
        clicks: 0,
        leads: 0,
        followers: 0,
        diagnostics: 0,
        sales: 0,
        revenue: 0,
      };
    }
    return currentPlan;
  }, [plansMap]);

  // Fetch daily data with better caching
  const fetchDailyData = useCallback(async (force = false) => {
    const now = Date.now();
    const isSameProject = lastProjectIdRef.current === effectiveProjectId;
    const isStale = now - lastFetchTimeRef.current > STALE_TIME;
    
    // Пропускаем запрос если данные свежие и проект не изменился
    if (!force && isSameProject && !isStale && Object.keys(dailyData).length > 0) {
      console.log('📊 useProjectData | Данные свежие, пропускаем запрос');
      return;
    }

    console.log('📊 useProjectData | Загрузка daily_data для project_id:', effectiveProjectId);

    // Cancel previous request if any
    // We don't abort anymore to avoid console errors
    // if (abortControllerRef.current) {
    //    abortControllerRef.current.abort();
    // }
    // abortControllerRef.current = new AbortController();
    // const signal = abortControllerRef.current.signal;

    try {
      // Use local date to match UI expectation (ActiveAdsManager uses format(new Date(), 'yyyy-MM-dd'))
      const todayStr = format(new Date(), 'yyyy-MM-dd');

      // AUTO-SYNC META ADS: Trigger sync if not done recently (shared logic with ActiveAdsManager)
      // This ensures Main Dashboard has fresh data even if user hasn't visited Ads Manager
      const lastSyncKey = `ads_sync_${effectiveProjectId}_${todayStr}`;
      const lastSyncTime = sessionStorage.getItem(lastSyncKey);
      const nowMs = Date.now();
      
      // Sync if not synced in last 5 minutes (300000ms)
      if (!lastSyncTime || (nowMs - parseInt(lastSyncTime)) > 300000) {
        console.log('🔄 useProjectData | Triggering Auto-Sync for Meta Ads...');
        sessionStorage.setItem(lastSyncKey, nowMs.toString());
        
        // Fire and forget - the realtime subscription will catch the updates
        supabase.functions.invoke('ads-manager', {
          body: { 
            action: 'sync_metrics', 
            payload: { 
              projectId: effectiveProjectId,
              date_range: { since: todayStr, until: todayStr } 
            } 
          }
        }).then(({ data, error }) => {
           if (error || data?.error) {
             console.warn('⚠️ useProjectData | Auto-sync failed or rate limited:', error || data?.error);
             // If failed, clear storage so we retry next time (or maybe keep it to avoid spamming?)
             // Better to keep it for at least a minute to avoid loop
           } else {
             console.log('✅ useProjectData | Auto-sync initiated successfully');
           }
        });
      }

      // Parallel fetch: Daily Data + Real-time Ad Logs for Today
      console.log(`📊 useProjectData | Fetching ads data for todayStr: ${todayStr}, project: ${effectiveProjectId}`);
      const [dailyResult, adsResult] = await Promise.all([
        supabase
          .from('daily_data')
          .select('*')
          .eq('project_id', effectiveProjectId)
          .order('date', { ascending: true }),
        
        // Fetch ad logs for today to ensure real-time spend/metrics visibility
        supabase
          .from('ad_performance_logs')
          .select('*')
          .eq('project_id', effectiveProjectId)
          .eq('date_start', todayStr)
      ]);

      const { data, error } = dailyResult;
      const { data: adsLogs, error: adsError } = adsResult;

      if (adsError) {
        console.error('❌ useProjectData | Error fetching ads logs:', adsError);
      } else {
        console.log(`✅ useProjectData | Fetched ${adsLogs?.length || 0} ads logs for today`);
        if (adsLogs?.length) {
            console.log('🔍 First ad log sample:', adsLogs[0]);
        }
      }

      if (error) {
        // Suppress Abort/Cancel errors
        if (error.code === '20' || error.message?.includes('AbortError') || error.message?.includes('aborted')) {
          console.warn('⚠️ useProjectData | Запрос daily_data отменен (AbortError)');
          return;
        }

        logError('Fetch daily data failed', error);
        console.error('❌ useProjectData | Ошибка загрузки daily_data:', error);
        toast.error('Ошибка загрузки данных: ' + error.message);
        return;
      }

      console.log('✅ useProjectData | Получено записей daily_data:', data?.length || 0);
      
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
          diagnostics: Number(row.diagnostics) || 0,
          sales: Number(row.sales) || 0,
          revenue: Number(row.revenue) || 0,
        };
      });

      // 2. Process & Merge Real-time Ads Data for Today
      if (adsLogs && adsLogs.length > 0) {
        console.log(`📊 useProjectData | Merging ${adsLogs.length} ad logs for today (${todayStr})`);
        
        // Deduplicate logs (logic from ActiveAdsManager)
        const uniqueLogs: Record<string, any> = {};
        adsLogs.forEach((item: any) => {
            const key = `${item.entity_id}_${item.date_start}`;
            const currentSpend = Number(item.spend) || 0;
            const existingSpend = uniqueLogs[key] ? (Number(uniqueLogs[key].spend) || 0) : -1;
            
            if (!uniqueLogs[key] || currentSpend >= existingSpend) {
                uniqueLogs[key] = item;
            }
        });

        // Calculate totals
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

        // Initialize today's entry if missing
        if (!dataMap[todayStr]) {
           dataMap[todayStr] = {
             date: todayStr,
             spend: 0,
             impressions: 0,
             clicks: 0,
             leads: 0,
             followers: 0,
             followers_total: 0,
             diagnostics: 0,
             sales: 0,
             revenue: 0,
             ig_followers_new: 0,
             new_followers: 0
           };
        }

        // Overwrite with real-time aggregated values
        // We assume ad_performance_logs is the source of truth for today's Ad metrics
        dataMap[todayStr].spend = todaySpend;
        dataMap[todayStr].impressions = todayImpressions;
        dataMap[todayStr].clicks = todayClicks;
        // Merge leads: Use MAX(CRM Leads, Ad Leads) to avoid undercounting if CRM is slow, 
        // or overcounting if Ad API is duplicating. 
        // Usually, CRM leads (from daily_data) are more reliable for business logic, 
        // but for "Ads Management" context, ad logs are used.
        // Let's use logic from CampaignFunnelChart: MAX(Meta Logs, CRM Leads)
        dataMap[todayStr].leads = Math.max(dataMap[todayStr].leads, todayLeads);
        
        console.log('✅ useProjectData | Updated today with real-time ads data:', { todaySpend, todayImpressions, todayClicks, todayLeads });
      }

      setDailyData(dataMap);
      lastFetchTimeRef.current = now;
      lastProjectIdRef.current = effectiveProjectId;
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        console.warn('⚠️ useProjectData | Запрос отменен:', err.message);
        return;
      }
      console.error('❌ useProjectData | Exception:', err);
      toast.error('Критическая ошибка загрузки данных');
    }
  }, [effectiveProjectId]);

  // Fetch ALL plan data
  const fetchPlanData = useCallback(async (force = false) => {
    console.log('📋 useProjectData | Загрузка ВСЕХ планов из plan_data');
    
    const signal = abortControllerRef.current?.signal;

    try {
      const { data, error } = await supabase
        .from('plan_data')
        .select('*')
        .eq('project_id', effectiveProjectId)
        .abortSignal(signal || undefined);

      if (error) {
        if (error.code === '20' || error.message?.includes('AbortError') || error.message?.includes('aborted')) {
          console.warn('⚠️ useProjectData | Запрос plan_data отменен (AbortError)');
          return;
        }

        logError('Fetch plan data failed', error);
        console.error('❌ useProjectData | Ошибка загрузки плана:', error);
        if (error.code !== '42501') {
          toast.error('Ошибка загрузки плана: ' + error.message);
        }
        return;
      }

      if (data) {
        console.log('✅ useProjectData | Планы загружены:', data.length);
        const newPlansMap: Record<string, PlanData> = {};
        
        data.forEach(plan => {
          if (plan.month) {
            newPlansMap[plan.month] = {
              spend: Number(plan.spend) || 0,
              impressions: Number(plan.impressions) || 0,
              clicks: Number(plan.clicks) || 0,
              leads: Number(plan.leads) || 0,
              followers: Number(plan.followers) || 0,
              diagnostics: Number(plan.diagnostics) || 0,
              sales: Number(plan.sales) || 0,
              revenue: Number(plan.revenue) || 0,
            };
          }
        });
        
        setPlansMap(newPlansMap);
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        console.warn('⚠️ useProjectData | Загрузка плана отменена:', err.message);
        return;
      }
      console.error('❌ useProjectData | Exception загрузки плана:', err);
    }
  }, [effectiveProjectId]);

  // Update plan data with optimistic UI and month support
  const updatePlanData = useCallback(async (field: keyof PlanData, value: number, month?: string) => {
    if (!isAdmin && !canEditPlan) {
      console.log('⚠️ updatePlanData | Пробуем сохранить без явных прав');
    }

    const validation = validateFieldValue(field, value);
    if (!validation.success) {
      toast.error(validation.error || 'Некорректное значение');
      return;
    }

    const targetMonth = month || format(startOfMonth(new Date()), 'yyyy-MM-dd');
    
    console.log('💾 updatePlanData | Сохраняем ПЛАН:', { date: targetMonth, field, value, project_id: effectiveProjectId });

    const previousPlansMap = { ...plansMap };

    setPlansMap(prev => {
      const existingPlan = prev[targetMonth] || {
        spend: 0, impressions: 0, clicks: 0, leads: 0, followers: 0, diagnostics: 0, sales: 0, revenue: 0
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
      const currentPlan = plansMap[targetMonth] || {
        spend: 0, impressions: 0, clicks: 0, leads: 0, followers: 0, diagnostics: 0, sales: 0, revenue: 0
      };

      const upsertData = {
        project_id: effectiveProjectId,
        month: targetMonth,
        spend: field === 'spend' ? value : currentPlan.spend,
        impressions: field === 'impressions' ? value : currentPlan.impressions,
        clicks: field === 'clicks' ? value : currentPlan.clicks,
        leads: field === 'leads' ? value : currentPlan.leads,
        followers: field === 'followers' ? value : currentPlan.followers,
        diagnostics: field === 'diagnostics' ? value : currentPlan.diagnostics,
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

      console.log('✅ updatePlanData | ПЛАН успешно сохранён');
    } catch (error: any) {
      logError('Save plan data failed', error);
      console.error('❌ updatePlanData | Ошибка:', error);
      toast.error('Ошибка сохранения плана: ' + error.message);
      setPlansMap(previousPlansMap);
    }
  }, [effectiveProjectId, isAdmin, canEditPlan, plansMap]);

  // Update daily data with optimistic UI
  const updateDailyData = useCallback(async (date: string, field: keyof DailyData, value: number) => {
    if (!isAdmin && !canEditDailyData) {
       console.log('⚠️ updateDailyData | Пробуем сохранить без явных прав');
    }

    const validation = validateFieldValue(field, value);
    if (!validation.success) {
      toast.error(validation.error || 'Некорректное значение');
      return;
    }

    console.log('💾 updateDailyData | Сохраняем ФАКТ:', { date, field, value, project_id: effectiveProjectId });

    const previousDailyData = { ...dailyData };

    setDailyData(prev => {
      const existingData = prev[date] || {
        date: date,
        spend: 0, impressions: 0, clicks: 0, leads: 0, followers: 0, followers_total: 0,
        diagnostics: 0, sales: 0, revenue: 0, ig_followers_new: 0, new_followers: 0
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
      const currentData = dailyData[date] || {
        date: date,
        spend: 0, impressions: 0, clicks: 0, leads: 0, followers: 0, followers_total: 0,
        diagnostics: 0, sales: 0, revenue: 0, ig_followers_new: 0, new_followers: 0
      };
      
      // Merge current data with new value for the payload
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
        diagnostics: dataToSave.diagnostics,
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

      console.log('✅ updateDailyData | ФАКТ успешно сохранён');

    } catch (error: any) {
      logError('Save daily data failed', error);
      console.error('❌ updateDailyData | Ошибка:', error);
      toast.error('Ошибка сохранения данных: ' + error.message);
      setDailyData(previousDailyData);
    }
  }, [effectiveProjectId, isAdmin, canEditDailyData, dailyData]);


  // Оптимизированный useEffect - загрузка только при смене проекта
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      // Проверяем, изменился ли проект
      if (lastProjectIdRef.current === effectiveProjectId && !loading) {
        return;
      }
      
      setLoading(true);
      console.log('🔄 useProjectData | Начинаем загрузку данных для project_id:', effectiveProjectId);
      
      try {
        await Promise.all([fetchDailyData(true), fetchPlanData(true)]);
        if (isMounted) {
          console.log('✅ useProjectData | Загрузка завершена');
        }
      } catch (err) {
        console.error('❌ useProjectData | Ошибка загрузки:', err);
      }
      
      if (isMounted) {
        setLoading(false);
      }
    };

    loadData();

    // Subscribe to ad_performance_logs changes to auto-refresh when Ads Manager syncs
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
        (payload) => {
           console.log('🔔 useProjectData | Realtime update from ad_performance_logs:', payload.eventType);
           // Refresh daily data (which includes ads merge logic)
           fetchDailyData(true);
        }
      )
      .subscribe();
    
    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [effectiveProjectId]); // Только при смене проекта!

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
      await Promise.all([fetchDailyData(true), fetchPlanData(true)]);
    },
    effectiveProjectId,
  };
};
