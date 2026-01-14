import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth } from 'date-fns';
import { toast } from 'sonner';
import { validateFieldValue, logError } from '@/lib/validation';
import { useAuth } from './useAuth';
import { usePermissions } from './usePermissions';

// Жёстко закодированный project_id для использования по умолчанию
const DEFAULT_PROJECT_ID = '64c94e87-630c-470e-8ab1-8f7c8c835efa';

interface DailyData {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  diagnostics: number;
  sales: number;
  revenue: number;
}

interface PlanData {
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
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

  // ПЛАН берётся из записи за 1-е число текущего месяца
  const planData = useMemo((): PlanData => {
    if (!rawPlanData) {
      return {
        spend: 0,
        impressions: 0,
        clicks: 0,
        leads: 0,
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
      diagnostics: rawPlanData.diagnostics || 0,
      sales: rawPlanData.sales || 0,
      revenue: rawPlanData.revenue || 0,
    };
  }, [rawPlanData]);

  // Fetch daily data
  const fetchDailyData = useCallback(async () => {
    if (import.meta.env.DEV) console.log('📊 useProjectData | Загрузка daily_data для project_id:', effectiveProjectId);

    const { data, error } = await supabase
      .from('daily_data')
      .select('*')
      .eq('project_id', effectiveProjectId)
      .order('date', { ascending: true });

    if (error) {
      logError('Fetch daily data failed', error);
      console.error('❌ useProjectData | Ошибка загрузки daily_data:', error);
      return;
    }

    if (import.meta.env.DEV) console.log('✅ useProjectData | Получено записей daily_data:', data?.length || 0);

    const dataMap: Record<string, DailyData> = {};
    data?.forEach((row) => {
      dataMap[row.date] = {
        date: row.date,
        spend: Number(row.spend) || 0,
        impressions: row.impressions || 0,
        clicks: row.clicks || 0,
        leads: row.leads || 0,
        diagnostics: row.diagnostics || 0,
        sales: row.sales || 0,
        revenue: Number(row.revenue) || 0,
      };
    });

    setDailyData(dataMap);
  }, [effectiveProjectId]);

  // Fetch plan data - берём данные за 1-е число текущего месяца
  const fetchPlanData = useCallback(async () => {
    const firstDayOfMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    if (import.meta.env.DEV) console.log('📋 useProjectData | Загрузка ПЛАНА из daily_data за дату:', firstDayOfMonth);
    
    const { data, error } = await supabase
      .from('daily_data')
      .select('*')
      .eq('project_id', effectiveProjectId)
      .eq('date', firstDayOfMonth)
      .maybeSingle();

    if (error) {
      logError('Fetch plan data failed', error);
      console.error('❌ useProjectData | Ошибка загрузки плана:', error);
      return;
    }

    if (data) {
      if (import.meta.env.DEV) console.log('✅ useProjectData | ПЛАН загружен:', data);
      setRawPlanData({
        date: data.date,
        spend: Number(data.spend) || 0,
        impressions: data.impressions || 0,
        clicks: data.clicks || 0,
        leads: data.leads || 0,
        diagnostics: data.diagnostics || 0,
        sales: data.sales || 0,
        revenue: Number(data.revenue) || 0,
      });
    } else {
      if (import.meta.env.DEV) console.log('⚠️ useProjectData | ПЛАН не найден для даты:', firstDayOfMonth);
      setRawPlanData(null);
    }
  }, [effectiveProjectId]);

  // Update or insert daily data using UPSERT
  const updateDailyData = useCallback(async (date: string, field: keyof DailyData, value: number) => {
    // Validate input
    const validation = validateFieldValue(field, value);
    if (!validation.success) {
      toast.error(validation.error || 'Некорректное значение');
      return;
    }

    if (import.meta.env.DEV) console.log('💾 updateDailyData | Сохраняем:', { date, field, value, project_id: effectiveProjectId });

    // Optimistically update local state
    setDailyData(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        date,
        [field]: value,
      },
    }));

    // Use UPSERT to avoid separate check+insert/update
    const { error } = await supabase
      .from('daily_data')
      .upsert(
        {
          project_id: effectiveProjectId,
          date,
          [field]: value,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'project_id,date',
          ignoreDuplicates: false,
        }
      );

    if (error) {
      logError('Upsert daily data failed', error);
      console.error('❌ updateDailyData | Ошибка:', error);
      toast.error('Ошибка сохранения данных: ' + error.message);
      fetchDailyData(); // Revert on error
    } else {
      if (import.meta.env.DEV) console.log('✅ updateDailyData | Успешно сохранено');
    }
  }, [effectiveProjectId, fetchDailyData]);

  // Update plan data using UPSERT (обновляем запись за 1-е число месяца)
  const updatePlanData = useCallback(async (field: keyof PlanData, value: number) => {
    // Check permission
    if (!isAdmin && !canEditPlan) {
      toast.error('У вас нет прав на изменение плановых данных');
      return;
    }

    // Validate input
    const validation = validateFieldValue(field, value);
    if (!validation.success) {
      toast.error(validation.error || 'Некорректное значение');
      return;
    }

    const firstDayOfMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    if (import.meta.env.DEV) console.log('💾 updatePlanData | Сохраняем ПЛАН:', { date: firstDayOfMonth, field, value, project_id: effectiveProjectId });

    // Optimistically update local state
    setRawPlanData(prev => prev ? {
      ...prev,
      [field]: value,
    } : {
      date: firstDayOfMonth,
      spend: field === 'spend' ? value : 0,
      impressions: field === 'impressions' ? value : 0,
      clicks: field === 'clicks' ? value : 0,
      leads: field === 'leads' ? value : 0,
      diagnostics: field === 'diagnostics' ? value : 0,
      sales: field === 'sales' ? value : 0,
      revenue: field === 'revenue' ? value : 0,
    });

    // Use UPSERT
    const { error } = await supabase
      .from('daily_data')
      .upsert(
        {
          project_id: effectiveProjectId,
          date: firstDayOfMonth,
          [field]: value,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'project_id,date',
          ignoreDuplicates: false,
        }
      );

    if (error) {
      logError('Upsert plan data failed', error);
      console.error('❌ updatePlanData | Ошибка:', error);
      toast.error('Ошибка сохранения плана: ' + error.message);
      fetchPlanData();
    } else {
      if (import.meta.env.DEV) console.log('✅ updatePlanData | ПЛАН успешно сохранён');
    }
  }, [effectiveProjectId, isAdmin, canEditPlan, fetchPlanData]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (import.meta.env.DEV) console.log('🔄 useProjectData | Начинаем загрузку данных для project_id:', effectiveProjectId);
      await Promise.all([fetchDailyData(), fetchPlanData()]);
      setLoading(false);
    };

    loadData();
  }, [effectiveProjectId, fetchDailyData, fetchPlanData]);

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
    refetch: () => Promise.all([fetchDailyData(), fetchPlanData()]),
    effectiveProjectId,
  };
};
