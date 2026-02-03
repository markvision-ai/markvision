// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, startOfMonth } from 'date-fns';

export interface AgencyFinance {
  id?: string;
  project_id: string;
  project_name: string;
  tier: 'lite' | 'pro' | 'legacy';
  package_revenue: number;
  team_members: string;
  total_expenses: number;
  yuri_net_profit?: number;
  month: string;
}

export const useAgencyFinances = () => {
  const [finances, setFinances] = useState<AgencyFinance[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  const currentMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');

  // Fetch all projects and merge with finances
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');

      if (projectsError) throw projectsError;

      // Fetch finances for current month
      const { data: financesData, error: financesError } = await supabase
        .from('agency_project_finances')
        .select('*')
        .eq('month', currentMonth);

      if (financesError && financesError.code !== 'PGRST116') {
        console.error('Error fetching finances:', financesError);
      }

      // Merge projects with finances
      const mergedFinances: AgencyFinance[] = (projectsData || []).map(project => {
        const existingFinance = financesData?.find(f => f.project_id === project.id);
        return {
          id: existingFinance?.id,
          project_id: project.id,
          project_name: existingFinance?.project_name || project.name,
          month: currentMonth,
          tier: (existingFinance?.tier || 'pro') as 'lite' | 'pro' | 'legacy',
          package_revenue: existingFinance?.package_revenue || 0,
          team_members: existingFinance?.team_members || '',
          total_expenses: existingFinance?.total_expenses || 0,
          yuri_net_profit: existingFinance?.yuri_net_profit,
        };
      });

      setFinances(mergedFinances);
    } catch (error) {
      console.error('Error fetching agency data:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchData();

    // Realtime subscription
    const channel = supabase
      .channel('agency-finances-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agency_project_finances'
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  // Update finance with optimistic UI
  const updateFinance = useCallback(async (
    projectId: string, 
    field: keyof AgencyFinance, 
    value: any
  ) => {
    const oldFinances = [...finances];
    
    // Optimistic update
    setFinances(prev => prev.map(f => 
      f.project_id === projectId ? { ...f, [field]: value } : f
    ));

    setSavingIds(prev => new Set(prev).add(projectId));

    try {
      const financeData = finances.find(f => f.project_id === projectId);
      if (!financeData) return;

      const upsertData = {
        project_id: projectId,
        project_name: financeData.project_name,
        month: currentMonth,
        tier: field === 'tier' ? value : financeData.tier,
        package_revenue: field === 'package_revenue' ? value : financeData.package_revenue,
        team_members: field === 'team_members' ? value : financeData.team_members,
        total_expenses: field === 'total_expenses' ? value : financeData.total_expenses,
      };

      const { data, error } = await supabase
        .from('agency_project_finances')
        .upsert(upsertData, { onConflict: 'project_id,month' })
        .select()
        .single();

      if (error) throw error;

      // Update with calculated yuri_net_profit from database
      if (data) {
        setFinances(prev => prev.map(f => 
          f.project_id === projectId ? { ...f, yuri_net_profit: data.yuri_net_profit } : f
        ));
      }

      toast.success('💰 Данные обновлены', { duration: 1000 });
    } catch (error) {
      console.error('Error updating finance:', error);
      toast.error('Ошибка сохранения');
      // Rollback
      setFinances(oldFinances);
    } finally {
      setSavingIds(prev => {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      });
    }
  }, [finances, currentMonth]);

  // Calculate totals
  const totals = {
    totalRevenue: finances.reduce((sum, f) => sum + f.package_revenue, 0),
    totalExpenses: finances.reduce((sum, f) => sum + f.total_expenses, 0),
    yuriNetProfit: finances.reduce((sum, f) => sum + (f.yuri_net_profit || 0), 0),
    projectsCount: finances.length,
    profitableProjects: finances.filter(f => (f.yuri_net_profit || 0) > 0).length,
  };

  return {
    finances,
    loading,
    savingIds,
    totals,
    updateFinance,
    refetch: fetchData,
  };
};
