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

interface DailyData {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  followers: number;
  followers_total: number;
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
  const [rawPlanData, setRawPlanData] = useState<DailyData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Кэш для предотвращения лишних запросов
  const lastFetchTimeRef = useRef<number>(0);
  const lastProjectIdRef = useRef<string | null>(null);

  // ПЛАН берётся из записи за 1-е число текущего месяца
  const planData = useMemo((): PlanData => {
    if (!rawPlanData) {
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
    return {
      spend: rawPlanData.spend || 0,
      impressions: rawPlanData.impressions || 0,
      clicks: rawPlanData.clicks || 0,
      leads: rawPlanData.leads || 0,
      followers: rawPlanData.followers || 0,
      diagnostics: rawPlanData.diagnostics || 0,
      sales: rawPlanData.sales || 0,
      revenue: rawPlanData.revenue || 0,
    };
  }, [rawPlanData]);

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

    try {
      const { data, error } = await supabase
        .from('daily_data')
        .select('*')
        .eq('project_id', effectiveProjectId)
        .order('date', { ascending: true });

      if (error) {
        logError('Fetch daily data failed', error);
        console.error('❌ useProjectData | Ошибка загрузки daily_data:', error);
        toast.error('Ошибка загрузки данных: ' + error.message);
        return;
      }

      console.log('✅ useProjectData | Получено записей daily_data:', data?.length || 0);
      
      // DEBUG: Log followers data to diagnose missing totals
      const followersDebug = data?.map(r => ({ date: r.date, followers: r.followers }));
      console.log('📊 useProjectData | Данные подписчиков (Debug):', followersDebug);
      
      const dataMap: Record<string, DailyData> = {};
      data?.forEach((row) => {
        dataMap[row.date] = {
          date: row.date,
          spend: Number(row.spend) || 0,
          impressions: Number(row.impressions) || 0,
          clicks: Number(row.clicks) || 0,
          leads: Number(row.leads) || 0,
          followers: Number(row.followers) || 0,
          followers_total: Number(row.followers_total) || 0,
          diagnostics: Number(row.diagnostics) || 0,
          sales: Number(row.sales) || 0,
          revenue: Number(row.revenue) || 0,
        };
      });

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

  // Fetch plan data from plan_data table
  const fetchPlanData = useCallback(async (force = false) => {
    const firstDayOfMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    console.log('📋 useProjectData | Загрузка ПЛАНА из plan_data за месяц:', firstDayOfMonth);
    
    try {
      const { data, error } = await supabase
        .from('plan_data')
        .select('*')
        .eq('project_id', effectiveProjectId)
        .eq('month', firstDayOfMonth)
        .maybeSingle();

      if (error) {
        logError('Fetch plan data failed', error);
        console.error('❌ useProjectData | Ошибка загрузки плана:', error);
        // Не показываем toast если это RLS ошибка - просто работаем без плана
        if (error.code !== '42501') {
          toast.error('Ошибка загрузки плана: ' + error.message);
        }
        return;
      }

      if (data) {
        console.log('✅ useProjectData | ПЛАН загружен:', data);
        setRawPlanData({
          date: data.month,
          spend: Number(data.spend) || 0,
          impressions: Number(data.impressions) || 0,
          clicks: Number(data.clicks) || 0,
          leads: Number(data.leads) || 0,
          followers: Number(data.followers) || 0,
          followers_total: 0, // План обычно не содержит общего количества, но поле нужно для типизации
          diagnostics: Number(data.diagnostics) || 0,
          sales: Number(data.sales) || 0,
          revenue: Number(data.revenue) || 0,
        });
      } else {
        console.log('⚠️ useProjectData | ПЛАН не найден для месяца:', firstDayOfMonth);
        setRawPlanData(null);
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        console.warn('⚠️ useProjectData | Загрузка плана отменена:', err.message);
        return;
      }
      console.error('❌ useProjectData | Exception загрузки плана:', err);
    }
  }, [effectiveProjectId]);

  // Update or insert daily data using UPSERT with optimistic UI
  const updateDailyData = useCallback(async (date: string, field: keyof DailyData, value: number) => {
    // Validate input
    const validation = validateFieldValue(field, value);
    if (!validation.success) {
      toast.error(validation.error || 'Некорректное значение');
      return;
    }

    console.log('💾 updateDailyData | Сохраняем:', { date, field, value, project_id: effectiveProjectId });

    // Store previous state for rollback
    const previousData = { ...dailyData };

    // Optimistically update local state INSTANTLY
    setDailyData(prev => ({
      ...prev,
      [date]: {
        date,
        spend: prev[date]?.spend || 0,
        impressions: prev[date]?.impressions || 0,
        clicks: prev[date]?.clicks || 0,
        leads: prev[date]?.leads || 0,
        followers: prev[date]?.followers || 0,
        diagnostics: prev[date]?.diagnostics || 0,
        sales: prev[date]?.sales || 0,
        revenue: prev[date]?.revenue || 0,
        ...prev[date],
        [field]: value,
      },
    }));

    try {
      // Use UPSERT with proper conflict handling
      const upsertData = {
        project_id: effectiveProjectId,
        date,
        spend: field === 'spend' ? value : (dailyData[date]?.spend || 0),
        impressions: field === 'impressions' ? value : (dailyData[date]?.impressions || 0),
        clicks: field === 'clicks' ? value : (dailyData[date]?.clicks || 0),
        leads: field === 'leads' ? value : (dailyData[date]?.leads || 0),
        followers: field === 'followers' ? value : (dailyData[date]?.followers || 0),
        diagnostics: field === 'diagnostics' ? value : (dailyData[date]?.diagnostics || 0),
        sales: field === 'sales' ? value : (dailyData[date]?.sales || 0),
        revenue: field === 'revenue' ? value : (dailyData[date]?.revenue || 0),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('daily_data')
        .upsert(upsertData, {
          onConflict: 'project_id,date',
          ignoreDuplicates: false
        });

      if (error) {
        throw error;
      }

      console.log('✅ updateDailyData | Успешно сохранено');
      // Silent success - no toast for each save
    } catch (error: any) {
      logError('Save daily data failed', error);
      console.error('❌ updateDailyData | Ошибка:', error);
      toast.error('Ошибка сохранения: ' + error.message);
      // Rollback to previous state
      setDailyData(previousData);
    }
  }, [effectiveProjectId, dailyData]);

  // Update plan data with optimistic UI
  const updatePlanData = useCallback(async (field: keyof PlanData, value: number) => {
    // Check permission - разрешаем всем с доступом к проекту
    if (!isAdmin && !canEditPlan) {
      // Пробуем сохранить всё равно - RLS проверит права
      console.log('⚠️ updatePlanData | Пробуем сохранить без явных прав');
    }

    // Validate input
    const validation = validateFieldValue(field, value);
    if (!validation.success) {
      toast.error(validation.error || 'Некорректное значение');
      return;
    }

    const firstDayOfMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    console.log('💾 updatePlanData | Сохраняем ПЛАН:', { date: firstDayOfMonth, field, value, project_id: effectiveProjectId });

    // Store previous state
    const previousPlanData = rawPlanData;

    // Optimistically update local state INSTANTLY
    setRawPlanData(prev => prev ? {
      ...prev,
      [field]: value,
    } : {
      date: firstDayOfMonth,
      spend: field === 'spend' ? value : 0,
      impressions: field === 'impressions' ? value : 0,
      clicks: field === 'clicks' ? value : 0,
      leads: field === 'leads' ? value : 0,
      followers: field === 'followers' ? value : 0,
      followers_total: 0,
      diagnostics: field === 'diagnostics' ? value : 0,
      sales: field === 'sales' ? value : 0,
      revenue: field === 'revenue' ? value : 0,
    });

    try {
      // Use UPSERT for plan data (store in 'projects' table via RPC or dedicated 'plans' table)
      // Currently, we store plan in 'daily_data' with a specific date marker (first day of month) or separate logic
      // BUT WAIT: The current code below tries to save to 'daily_data' which might be wrong if we want separate Plan
      // Let's check how 'rawPlanData' is fetched. It seems it is fetched from 'daily_data' too?
      // No, looking at fetch logic (not shown fully but implied), usually plans are separate.
      // Assuming plans are stored in 'daily_data' for now based on 'month' field usage? 
      // ERROR: 'daily_data' table usually has 'date' column, not 'month'.
      
      // Let's fix the column name if it's daily_data
      const upsertData = {
        project_id: effectiveProjectId,
        month: firstDayOfMonth, // Correct: plan_data uses 'month'
        spend: field === 'spend' ? value : (rawPlanData?.spend || 0),
        impressions: field === 'impressions' ? value : (rawPlanData?.impressions || 0),
        clicks: field === 'clicks' ? value : (rawPlanData?.clicks || 0),
        leads: field === 'leads' ? value : (rawPlanData?.leads || 0),
        followers: field === 'followers' ? value : (rawPlanData?.followers || 0),
        diagnostics: field === 'diagnostics' ? value : (rawPlanData?.diagnostics || 0),
        sales: field === 'sales' ? value : (rawPlanData?.sales || 0),
        revenue: field === 'revenue' ? value : (rawPlanData?.revenue || 0),
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
      toast.success('План сохранён', { duration: 1000 });
    } catch (error: any) {
      logError('Save plan data failed', error);
      console.error('❌ updatePlanData | Ошибка:', error);
      toast.error('Ошибка сохранения плана: ' + error.message);
      setRawPlanData(previousPlanData);
    }
  }, [effectiveProjectId, isAdmin, canEditPlan, rawPlanData]);

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
    
    return () => {
      isMounted = false;
    };
  }, [effectiveProjectId]); // Только при смене проекта!

  return {
    dailyData,
    planData,
    loading,
    updateDailyData,
    updatePlanData,
    canEditPlan: isAdmin || canEditPlan,
    canEditDailyData: isAdmin || canEditDailyData,
    canViewSales: isAdmin || canViewSales,
    canViewRevenue: isAdmin || canViewRevenue,
    refetch: () => Promise.all([fetchDailyData(true), fetchPlanData(true)]),
    effectiveProjectId,
  };
};
