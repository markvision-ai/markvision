import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/externalSupabase';
import { DateRange } from 'react-day-picker';
import { format, isToday, startOfDay, endOfDay } from 'date-fns';

export interface MarketingStatRecord {
  id: string;
  project_id: string;
  source: string;
  date: string;
  spend: number;
  clicks: number;
  impressions: number;
  reach: number;
  cpm: number;
  cpc: number;
  ctr: number;
  campaign_id: string | null;
  campaign_name: string | null;
  synced_at: string;
}

export interface MarketingStatsAggregated {
  totalSpend: number;
  totalClicks: number;
  totalImpressions: number;
  totalReach: number;
  avgCpm: number;
  avgCpc: number;
  avgCtr: number;
  byCampaign: Record<string, {
    spend: number;
    clicks: number;
    impressions: number;
    reach: number;
  }>;
  byDate: Record<string, {
    spend: number;
    clicks: number;
    impressions: number;
  }>;
}

interface UseMarketingStatsOptions {
  projectId: string | null;
  dateRange: DateRange | undefined;
  todaySpendFromCampaigns?: Record<string, number>; // campaign_id -> spent_today
}

export function useMarketingStats({
  projectId,
  dateRange,
  todaySpendFromCampaigns = {},
}: UseMarketingStatsOptions) {
  const [records, setRecords] = useState<MarketingStatRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!projectId || !dateRange?.from || !dateRange?.to) {
      setRecords([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fromDate = format(startOfDay(dateRange.from), 'yyyy-MM-dd');
      const toDate = format(endOfDay(dateRange.to), 'yyyy-MM-dd');

      const { data, error: fetchError } = await supabase
        .from('marketing_stats')
        .select('*')
        .eq('project_id', projectId)
        .gte('date', fromDate)
        .lte('date', toDate)
        .order('date', { ascending: false });

      if (fetchError) {
        // Table might not exist - fail silently
        console.log('marketing_stats fetch error:', fetchError.message);
        setRecords([]);
        return;
      }

      setRecords(data || []);
    } catch (err) {
      console.error('Error fetching marketing stats:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, dateRange]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Aggregate stats
  const aggregated = useMemo<MarketingStatsAggregated>(() => {
    const byCampaign: Record<string, { spend: number; clicks: number; impressions: number; reach: number }> = {};
    const byDate: Record<string, { spend: number; clicks: number; impressions: number }> = {};

    let totalSpend = 0;
    let totalClicks = 0;
    let totalImpressions = 0;
    let totalReach = 0;
    let weightedCpm = 0;
    let weightedCtr = 0;

    // Process historical records
    for (const record of records) {
      totalSpend += record.spend;
      totalClicks += record.clicks;
      totalImpressions += record.impressions;
      totalReach += record.reach;

      // Weight CPM and CTR by impressions
      if (record.impressions > 0) {
        weightedCpm += record.cpm * record.impressions;
        weightedCtr += record.ctr * record.impressions;
      }

      // By campaign
      if (record.campaign_id) {
        if (!byCampaign[record.campaign_id]) {
          byCampaign[record.campaign_id] = { spend: 0, clicks: 0, impressions: 0, reach: 0 };
        }
        byCampaign[record.campaign_id].spend += record.spend;
        byCampaign[record.campaign_id].clicks += record.clicks;
        byCampaign[record.campaign_id].impressions += record.impressions;
        byCampaign[record.campaign_id].reach += record.reach;
      }

      // By date
      const dateKey = record.date;
      if (!byDate[dateKey]) {
        byDate[dateKey] = { spend: 0, clicks: 0, impressions: 0 };
      }
      byDate[dateKey].spend += record.spend;
      byDate[dateKey].clicks += record.clicks;
      byDate[dateKey].impressions += record.impressions;
    }

    // If today is in range and we have live campaign data, use it
    if (dateRange?.to && isToday(dateRange.to)) {
      const todayKey = format(new Date(), 'yyyy-MM-dd');

      // Check if we already have today's data from marketing_stats
      const hasTodayStats = records.some(r => r.date === todayKey);

      if (!hasTodayStats && Object.keys(todaySpendFromCampaigns).length > 0) {
        // Use live data from campaigns table
        let todaySpend = 0;
        for (const [campaignId, spend] of Object.entries(todaySpendFromCampaigns)) {
          todaySpend += spend;

          if (!byCampaign[campaignId]) {
            byCampaign[campaignId] = { spend: 0, clicks: 0, impressions: 0, reach: 0 };
          }
          byCampaign[campaignId].spend += spend;
        }

        totalSpend += todaySpend;

        if (!byDate[todayKey]) {
          byDate[todayKey] = { spend: 0, clicks: 0, impressions: 0 };
        }
        byDate[todayKey].spend += todaySpend;
      }
    }

    return {
      totalSpend,
      totalClicks,
      totalImpressions,
      totalReach,
      avgCpm: totalImpressions > 0 ? weightedCpm / totalImpressions : 0,
      avgCpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
      avgCtr: totalImpressions > 0 ? weightedCtr / totalImpressions : 0,
      byCampaign,
      byDate,
    };
  }, [records, dateRange, todaySpendFromCampaigns]);

  return {
    records,
    aggregated,
    loading,
    error,
    refetch: fetchStats,
  };
}
