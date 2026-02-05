
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, format, isSameMonth } from 'date-fns';

export interface FinancialPlan {
  id?: string;
  revenue_goal: number;
  avg_check: number;
  cr_lead_visit: number;
  cr_visit_sale: number;
  cpl_best: number;
  cpl_avg: number;
  cpl_worst: number;
}

export interface FinancialFact {
  expenses: number;
  impressions: number;
  clicks: number;
  leads: number;
  subscribers: number;
  visits: number;
  sales: number;
  revenue: number;
}

export interface PlanIndicators {
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  followers: number;
  visits: number;
  sales: number;
  revenue: number;
}

export const useFinancialMonthData = (projectId: string, monthDate: Date) => {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<FinancialPlan | null>(null);
  const [fact, setFact] = useState<FinancialFact>({
    expenses: 0,
    impressions: 0,
    clicks: 0,
    leads: 0,
    subscribers: 0,
    visits: 0,
    sales: 0,
    revenue: 0,
  });
  const [planIndicators, setPlanIndicators] = useState<PlanIndicators>({
    spend: 0,
    impressions: 0,
    clicks: 0,
    leads: 0,
    followers: 0,
    visits: 0,
    sales: 0,
    revenue: 0,
  });

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);

    const start = format(startOfMonth(monthDate), 'yyyy-MM-dd');
    const end = format(endOfMonth(monthDate), 'yyyy-MM-dd');
    const monthStr = format(monthDate, 'yyyy-MM-01');

    try {
      // 1. Fetch Plan
      const { data: planData, error: planError } = await supabase
        .from('monthly_financial_plans')
        .select('*')
        .eq('project_id', projectId)
        .eq('month_date', monthStr)
        .maybeSingle();

      if (planError && planError.code !== 'PGRST116') {
        console.error('Error fetching plan:', planError);
      }
      
      setPlan(planData || null);

      // 1.1 Fetch Plan Indicators from plan_data (table of indicators)
      const { data: planRow, error: planRowError } = await supabase
        .from('plan_data')
        .select('*')
        .eq('project_id', projectId)
        .eq('month', monthStr)
        .maybeSingle();

      if (planRowError && planRowError.code !== 'PGRST116') {
        console.error('Error fetching plan_data row:', planRowError);
      }

      setPlanIndicators({
        spend: Number(planRow?.spend) || 0,
        impressions: Number(planRow?.impressions) || 0,
        clicks: Number(planRow?.clicks) || 0,
        leads: Number(planRow?.leads) || 0,
        followers: Number(planRow?.followers) || 0,
        visits: Number(planRow?.diagnostics) || 0,
        sales: Number(planRow?.sales) || 0,
        revenue: Number(planRow?.revenue) || 0,
      });

      // 2. Fetch Fact Data from daily_data (Source of Truth)
      const { data: dailyData, error: dailyError } = await supabase
        .from('daily_data')
        .select('*')
        .eq('project_id', projectId)
        .gte('date', start)
        .lte('date', end);

      if (dailyError) {
        console.error('Error fetching daily data:', dailyError);
      }

      // Initialize totals
      let totalExpenses = 0;
      let totalImpressions = 0;
      let totalClicks = 0;
      let totalLeads = 0;
      let totalSubscribers = 0;
      let totalVisits = 0;
      let totalSales = 0;
      let totalRevenue = 0;

      // Map to store daily data by date for easy merging
      const dailyMap: Record<string, any> = {};

      if (dailyData) {
        dailyData.forEach(row => {
          dailyMap[row.date] = row;
          totalExpenses += Number(row.spend) || 0;
          totalImpressions += Number(row.impressions) || 0;
          totalClicks += Number(row.clicks) || 0;
          totalLeads += Number(row.leads) || 0;
          
          // Logic for subscribers delta (new followers)
          const followersDelta = Number(row.ig_followers_new) || Number(row.new_followers) || Number(row.followers) || 0;
          totalSubscribers += followersDelta;
          
          totalVisits += Number(row.diagnostics) || 0;
          totalSales += Number(row.sales) || 0;
          totalRevenue += Number(row.revenue) || 0;
        });
      }

      // 3. If current month, fetch real-time data for TODAY from ad_performance_logs
      // and merge/overwrite today's daily_data entry
      if (isSameMonth(monthDate, new Date())) {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        
        const { data: adsLogs, error: adsError } = await supabase
          .from('ad_performance_logs')
          .select('*')
          .eq('project_id', projectId)
          .eq('date_start', todayStr);

        if (!adsError && adsLogs && adsLogs.length > 0) {
          // Deduplicate logs (logic from useProjectData)
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

          // Subtract existing today's data from totals before adding real-time data
          // to avoid double counting if daily_data already has partial data for today
          if (dailyMap[todayStr]) {
             totalExpenses -= Number(dailyMap[todayStr].spend) || 0;
             totalImpressions -= Number(dailyMap[todayStr].impressions) || 0;
             totalClicks -= Number(dailyMap[todayStr].clicks) || 0;
             // Don't subtract leads blindly, we take MAX below
          }

          // Add real-time values
          totalExpenses += todaySpend;
          totalImpressions += todayImpressions;
          totalClicks += todayClicks;
          
          // Special logic for leads: MAX(CRM Leads, Ad Leads) for today
          const existingTodayLeads = Number(dailyMap[todayStr]?.leads) || 0;
          
          // If we already added existingTodayLeads to totalLeads, we need to adjust
          // to be effectively: totalLeads - existingTodayLeads + MAX(existingTodayLeads, todayLeads)
          totalLeads = totalLeads - existingTodayLeads + Math.max(existingTodayLeads, todayLeads);
        }
      }

      setFact({
        expenses: totalExpenses,
        impressions: totalImpressions,
        clicks: totalClicks,
        leads: totalLeads,
        subscribers: totalSubscribers,
        visits: totalVisits,
        sales: totalSales,
        revenue: totalRevenue,
      });

    } catch (error) {
      console.error('Error fetching financial month data:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId, monthDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const savePlan = async (newPlan: FinancialPlan) => {
    const monthStr = format(monthDate, 'yyyy-MM-01');
    try {
      const { error } = await supabase
        .from('monthly_financial_plans')
        .upsert({
          project_id: projectId,
          month_date: monthStr,
          ...newPlan,
          updated_at: new Date().toISOString()
        }, { onConflict: 'project_id,month_date' });

      if (error) throw error;
      setPlan({ ...newPlan, id: plan?.id }); // Optimistic update
      return true;
    } catch (error) {
      console.error('Error saving plan:', error);
      return false;
    }
  };

  return { loading, plan, planIndicators, fact, savePlan, refetch: fetchData };
};
