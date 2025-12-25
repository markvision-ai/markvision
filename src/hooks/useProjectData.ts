import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'sonner';

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
      console.error('Error fetching daily data:', error);
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
      console.error('Error fetching plan data:', error);
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
        console.error('Error updating daily data:', error);
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
        console.error('Error inserting daily data:', error);
        toast.error('Ошибка сохранения данных');
        fetchDailyData(); // Revert on error
      }
    }
  }, [projectId, fetchDailyData]);

  // Update plan data
  const updatePlanData = useCallback(async (field: keyof PlanData, value: number) => {
    if (!projectId) return;

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
        console.error('Error updating plan data:', error);
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
        console.error('Error inserting plan data:', error);
        toast.error('Ошибка сохранения плана');
        fetchPlanData();
      }
    }
  }, [projectId, fetchPlanData]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchDailyData(), fetchPlanData()]);
      setLoading(false);
    };

    if (projectId) {
      loadData();
    }
  }, [projectId, fetchDailyData, fetchPlanData]);

  return {
    dailyData,
    planData,
    loading,
    updateDailyData,
    updatePlanData,
    refetch: () => Promise.all([fetchDailyData(), fetchPlanData()]),
  };
};
