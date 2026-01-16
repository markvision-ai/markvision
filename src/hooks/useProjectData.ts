import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, FALLBACK_PROJECT_ID } from '@/lib/externalSupabase';
import { format, startOfMonth } from 'date-fns';
import { toast } from 'sonner';
import { validateFieldValue, logError } from '@/lib/validation';
import { useAuth } from './useAuth';
import { usePermissions } from './usePermissions';

// Жёстко закодированный project_id для использования по умолчанию
const DEFAULT_PROJECT_ID = FALLBACK_PROJECT_ID;

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

  // Fetch daily data with better logging
  const fetchDailyData = useCallback(async () => {
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
      
      // Log first few records for debugging
      if (data && data.length > 0) {
        console.log('📋 Первые записи:', data.slice(0, 3).map(d => ({ date: d.date, spend: d.spend, leads: d.leads })));
      }

      const dataMap: Record<string, DailyData> = {};
      data?.forEach((row) => {
        dataMap[row.date] = {
          date: row.date,
          spend: Number(row.spend) || 0,
          impressions: Number(row.impressions) || 0,
          clicks: Number(row.clicks) || 0,
          leads: Number(row.leads) || 0,
          diagnostics: Number(row.diagnostics) || 0,
          sales: Number(row.sales) || 0,
          revenue: Number(row.revenue) || 0,
        };
      });

      setDailyData(dataMap);
    } catch (err: any) {
      console.error('❌ useProjectData | Exception:', err);
      toast.error('Критическая ошибка загрузки данных');
    }
  }, [effectiveProjectId]);

  // Fetch plan data from plan_data table
  const fetchPlanData = useCallback(async () => {
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
        toast.error('Ошибка загрузки плана: ' + error.message);
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
          diagnostics: Number(data.diagnostics) || 0,
          sales: Number(data.sales) || 0,
          revenue: Number(data.revenue) || 0,
        });
      } else {
        console.log('⚠️ useProjectData | ПЛАН не найден для месяца:', firstDayOfMonth);
        setRawPlanData(null);
      }
    } catch (err: any) {
      console.error('❌ useProjectData | Exception загрузки плана:', err);
    }
  }, [effectiveProjectId]);

  // Update or insert daily data using UPSERT with proper conflict resolution
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

    // Optimistically update local state
    setDailyData(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        date,
        spend: prev[date]?.spend || 0,
        impressions: prev[date]?.impressions || 0,
        clicks: prev[date]?.clicks || 0,
        leads: prev[date]?.leads || 0,
        diagnostics: prev[date]?.diagnostics || 0,
        sales: prev[date]?.sales || 0,
        revenue: prev[date]?.revenue || 0,
        [field]: value,
      },
    }));

    try {
      // First, check if record exists
      const { data: existing, error: checkError } = await supabase
        .from('daily_data')
        .select('id')
        .eq('project_id', effectiveProjectId)
        .eq('date', date)
        .maybeSingle();

      if (checkError) {
        console.error('❌ Check existing record error:', checkError);
      }

      let result;
      
      if (existing) {
        // UPDATE existing record
        console.log('📝 Updating existing record:', existing.id);
        result = await supabase
          .from('daily_data')
          .update({
            [field]: value,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        // INSERT new record with all default values
        console.log('➕ Inserting new record for date:', date);
        result = await supabase
          .from('daily_data')
          .insert({
            project_id: effectiveProjectId,
            date,
            spend: field === 'spend' ? value : 0,
            impressions: field === 'impressions' ? value : 0,
            clicks: field === 'clicks' ? value : 0,
            leads: field === 'leads' ? value : 0,
            diagnostics: field === 'diagnostics' ? value : 0,
            sales: field === 'sales' ? value : 0,
            revenue: field === 'revenue' ? value : 0,
          });
      }

      if (result.error) {
        throw result.error;
      }

      console.log('✅ updateDailyData | Успешно сохранено');
      toast.success('Данные сохранены', { duration: 1000 });
    } catch (error: any) {
      logError('Save daily data failed', error);
      console.error('❌ updateDailyData | Ошибка:', error);
      toast.error('Ошибка сохранения: ' + error.message);
      // Rollback to previous state
      setDailyData(previousData);
    }
  }, [effectiveProjectId, dailyData]);

  // Update plan data (обновляем запись за 1-е число месяца)
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
    console.log('💾 updatePlanData | Сохраняем ПЛАН:', { date: firstDayOfMonth, field, value, project_id: effectiveProjectId });

    // Store previous state
    const previousPlanData = rawPlanData;

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

    try {
      // Check if record exists
      const { data: existing } = await supabase
        .from('plan_data')
        .select('id')
        .eq('project_id', effectiveProjectId)
        .eq('month', firstDayOfMonth)
        .maybeSingle();

      let result;
      
      if (existing) {
        result = await supabase
          .from('plan_data')
          .update({
            [field]: value,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        result = await supabase
          .from('plan_data')
          .insert({
            project_id: effectiveProjectId,
            month: firstDayOfMonth,
            spend: field === 'spend' ? value : 0,
            impressions: field === 'impressions' ? value : 0,
            clicks: field === 'clicks' ? value : 0,
            leads: field === 'leads' ? value : 0,
            diagnostics: field === 'diagnostics' ? value : 0,
            sales: field === 'sales' ? value : 0,
            revenue: field === 'revenue' ? value : 0,
          });
      }

      if (result.error) {
        throw result.error;
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

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      console.log('🔄 useProjectData | Начинаем загрузку данных для project_id:', effectiveProjectId);
      try {
        await Promise.all([fetchDailyData(), fetchPlanData()]);
        console.log('✅ useProjectData | Загрузка завершена');
      } catch (err) {
        console.error('❌ useProjectData | Ошибка загрузки:', err);
      }
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
