// @ts-nocheck
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, subMonths, format, startOfToday, subDays } from 'date-fns';
import { toast } from 'sonner';

export type PeriodType = 'this_month' | 'last_month' | 'custom';

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export interface ContentPlanFactData {
  metric: string;
  plan: number;
  fact: number;
  unit: string;
}

export const useFactoryAnalytics = (projectId: string | null) => {
  const [periodType, setPeriodType] = useState<PeriodType>('this_month');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: new Date()
  });

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    followers: 0,
    reach: 0,
    comments: 0,
    leads: 0,
    sales: 0,
    publications: 0
  });

  const effectiveProjectId = projectId;

  // Initial plan data
  const [planData, setPlanData] = useState<ContentPlanFactData[]>([
    { metric: 'Новые подписчики', plan: 5000, fact: 0, unit: '' },
    { metric: 'Публикации', plan: 30, fact: 0, unit: 'шт' },
    { metric: 'Охват', plan: 500000, fact: 0, unit: '' },
    { metric: 'Комментарии', plan: 1000, fact: 0, unit: 'шт' },
    { metric: 'Лиды', plan: 100, fact: 0, unit: 'шт' },
    { metric: 'Продажи', plan: 10, fact: 0, unit: 'шт' },
  ]);

  // Update date range when period type changes
  useEffect(() => {
    const today = new Date();
    if (periodType === 'this_month') {
      setDateRange({
        from: startOfMonth(today),
        to: today
      });
    } else if (periodType === 'last_month') {
      const lastMonthStart = startOfMonth(subMonths(today, 1));
      const lastMonthEnd = subDays(startOfMonth(today), 1);
      setDateRange({
        from: lastMonthStart,
        to: lastMonthEnd
      });
    }
    // 'custom' keeps current range
  }, [periodType]);

  useEffect(() => {
    if (!effectiveProjectId || !dateRange.from || !dateRange.to) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      setLoading(true);
      try {
        const fromStr = format(dateRange.from!, 'yyyy-MM-dd');
        const toStr = format(dateRange.to!, 'yyyy-MM-dd');

        console.log(`📊 Fetching analytics for ${effectiveProjectId} from ${fromStr} to ${toStr}`);

        // 1. Fetch Daily Data (Followers, Reach, Comments, Publications)
        const { data: dailyData, error: dailyError } = await supabase
          .from('daily_data')
          .select('new_followers, ig_followers_new, followers, reach, impressions, comments, publications')
          .eq('project_id', effectiveProjectId)
          .gte('date', fromStr)
          .lte('date', toStr)
          .abortSignal(signal);

        if (dailyError) throw dailyError;

        // Calculate sums
        // FIX: Strictly use 'ig_followers_new' or 'new_followers' to avoid accidentally summing 'followers_total' 
        // which might be present in 'followers_today' in some legacy records.
        // Also fallback to 'followers' if new fields are empty.
        const totalFollowers = dailyData?.reduce((sum, row) => sum + (row.ig_followers_new || row.new_followers || row.followers || 0), 0) || 0;
        
        // For reach: prefer 'reach', fallback to 'impressions'
        const totalReach = dailyData?.reduce((sum, row) => sum + (row.reach || row.impressions || 0), 0) || 0;
        
        const totalComments = dailyData?.reduce((sum, row) => sum + (row.comments || 0), 0) || 0;
        const totalPublications = dailyData?.reduce((sum, row) => sum + (row.publications || 0), 0) || 0;

        // 2. Fetch Leads (Source = 'organic') from leads table
        // User requested: "Поля 'Лиды' и 'Продажи' должны считаться из таблицы leads, где source = 'organic'"
        // Schema check confirmed 'lead_source' is the column name.
        
        // Leads Count
        const { count: leadsCount, error: leadsError } = await supabase
          .from('leads')
          .select('id', { count: 'exact' })
          .eq('project_id', effectiveProjectId)
          .eq('lead_source', 'organic')
          .gte('created_at', dateRange.from!.toISOString())
          .lte('created_at', dateRange.to!.toISOString())
          .limit(1)
          .abortSignal(signal);

        if (leadsError) throw leadsError;

        // Sales Count (Status = 'won'/'paid' etc)
        // Adjust statuses based on actual CRM workflow if known, otherwise assume standard success statuses
        const { count: salesCount, error: salesError } = await supabase
          .from('leads')
          .select('id', { count: 'exact' })
          .eq('project_id', effectiveProjectId)
          .eq('lead_source', 'organic')
          .in('status', ['won', 'paid', 'completed', 'success', 'closed_won'])
          .gte('created_at', dateRange.from!.toISOString())
          .lte('created_at', dateRange.to!.toISOString())
          .limit(1)
          .abortSignal(signal);
        
        if (salesError) throw salesError;

        if (!signal.aborted) {
          setMetrics({
            followers: totalFollowers,
            reach: totalReach,
            comments: totalComments,
            leads: leadsCount || 0,
            sales: salesCount || 0,
            publications: totalPublications
          });
        }

      } catch (error: any) {
        if (error.name === 'AbortError' || error.message?.includes('AbortError')) {
          return;
        }
        console.error('Error fetching factory analytics:', error);
        toast.error('Ошибка загрузки данных аналитики');
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [effectiveProjectId, dateRange, periodType]);

  // Update planData with fetched metrics
  useEffect(() => {
    setPlanData(prev => prev.map(item => {
      let newFact = item.fact;
      switch (item.metric) {
        case 'Новые подписчики': newFact = metrics.followers; break;
        case 'Публикации': newFact = metrics.publications; break;
        case 'Охват': newFact = metrics.reach; break;
        case 'Комментарии': newFact = metrics.comments; break;
        case 'Лиды': newFact = metrics.leads; break;
        case 'Продажи': newFact = metrics.sales; break;
      }
      return { ...item, fact: newFact };
    }));
  }, [metrics]);

  const updatePlan = (metric: string, plan: number) => {
    setPlanData(prev => prev.map(item => 
      item.metric === metric ? { ...item, plan } : item
    ));
  };

  // Transform array to object for backward compatibility with ContentFactoryPage
  const planDataObj = useMemo(() => {
    const getMetric = (name: string) => planData.find(p => p.metric === name) || { fact: 0, plan: 0 };
    return {
      fact: {
        followers: getMetric('Новые подписчики').fact,
        publications: getMetric('Публикации').fact,
        reach: getMetric('Охват').fact,
        comments: getMetric('Комментарии').fact,
        leads: getMetric('Лиды').fact,
        sales: getMetric('Продажи').fact,
      },
      plan: {
        followers: getMetric('Новые подписчики').plan,
        publications: getMetric('Публикации').plan,
        reach: getMetric('Охват').plan,
        comments: getMetric('Комментарии').plan,
        leads: getMetric('Лиды').plan,
        sales: getMetric('Продажи').plan,
      }
    };
  }, [planData]);

  return {
    planData: planDataObj,
    rawPlanData: planData,
    updatePlan,
    periodType,
    setPeriodType,
    dateRange,
    setDateRange,
    loading
  };
};
