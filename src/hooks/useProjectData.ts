import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/externalSupabase';
import { format, startOfMonth } from 'date-fns';
import { toast } from 'sonner';
import { validateFieldValue, logError } from '@/lib/validation';
import { useAuth } from './useAuth';
import { usePermissions } from './usePermissions';
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
  const { canEditPlan, canEditDailyData, canViewSales, canViewRevenue } = usePermissions(projectId);
  const [dailyData, setDailyData] = useState<Record<string, DailyData>>({});
  const [planData, setPlanData] = useState<PlanData>({
    spend: 0,
    impressions: 0,
    clicks: 0,
    leads: 0,
    diagnostics: 0,
    sales: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  // Fetch daily data
  const fetchDailyData = useCallback(async () => {
    if (!projectId) return;

    const { data, error } = await supabase
      .from('daily_data')
      .select('*')
      .eq('project_id', projectId);

    if (error) {
      logError('Fetch daily data failed', error);
      return;
    }

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
  }, [projectId]);

  // Fetch plan data for current month
  const fetchPlanData = useCallback(async () => {
    if (!projectId) return;

    const currentMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    
    const { data, error } = await supabase
      .from('plan_data')
      .select('*')
      .eq('project_id', projectId)
      .eq('month', currentMonth)
      .maybeSingle();

    if (error) {
      logError('Fetch plan data failed', error);
      return;
    }

    if (data) {
      setPlanData({
        spend: Number(data.spend) || 0,
        impressions: data.impressions || 0,
        clicks: data.clicks || 0,
        leads: data.leads || 0,
        diagnostics: data.diagnostics || 0,
        sales: data.sales || 0,
        revenue: Number(data.revenue) || 0,
      });
    }
  }, [projectId]);

  // Update or insert daily data
  const updateDailyData = useCallback(async (date: string, field: keyof DailyData, value: number) => {
    if (!projectId) return;

    // Validate input
    const validation = validateFieldValue(field, value);
    if (!validation.success) {
      toast.error(validation.error || 'Некорректное значение');
      return;
    }

    // Optimistically update local state
    setDailyData(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        date,
        [field]: value,
      },
    }));

    // Check if record exists
    const { data: existing } = await supabase
      .from('daily_data')
      .select('id')
      .eq('project_id', projectId)
      .eq('date', date)
      .maybeSingle();

    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from('daily_data')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', existing.id);

      if (error) {
        logError('Update daily data failed', error);
        toast.error('Ошибка сохранения данных');
        fetchDailyData(); // Revert on error
      }
    } else {
      // Insert new record
      const { error } = await supabase
        .from('daily_data')
        .insert({
          project_id: projectId,
          date,
          [field]: value,
        });

      if (error) {
        logError('Insert daily data failed', error);
        toast.error('Ошибка сохранения данных');
        fetchDailyData(); // Revert on error
      }
    }
  }, [projectId, fetchDailyData]);

  // Update plan data (admin or users with permission)
  const updatePlanData = useCallback(async (field: keyof PlanData, value: number) => {
    if (!projectId) return;

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

    const currentMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');

    // Optimistically update local state
    setPlanData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Check if record exists
    const { data: existing } = await supabase
      .from('plan_data')
      .select('id')
      .eq('project_id', projectId)
      .eq('month', currentMonth)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('plan_data')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', existing.id);

      if (error) {
        logError('Update plan data failed', error);
        toast.error('Ошибка сохранения плана');
        fetchPlanData();
      }
    } else {
      const { error } = await supabase
        .from('plan_data')
        .insert({
          project_id: projectId,
          month: currentMonth,
          [field]: value,
        });

      if (error) {
        logError('Insert plan data failed', error);
        toast.error('Ошибка сохранения плана');
        fetchPlanData();
      }
    }
  }, [projectId, isAdmin, canEditPlan, fetchPlanData]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchDailyData(), fetchPlanData()]);
      setLoading(false);
    };

    if (projectId) {
      loadData();
    } else {
      // No project selected - reset loading state and clear data
      setLoading(false);
      setDailyData({});
      setPlanData({
        spend: 0,
        impressions: 0,
        clicks: 0,
        leads: 0,
        diagnostics: 0,
        sales: 0,
        revenue: 0,
      });
    }
  }, [projectId, fetchDailyData, fetchPlanData]);

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
  };
};
