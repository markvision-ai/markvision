import { useState, useEffect } from 'react';
import { supabase } from '@/lib/externalSupabase';

export interface ContentProductionStats {
  id: string;
  project_id: string;
  period_start: string;
  period_end: string;
  publications: number;
  stories: number;
  reach: number;
  engagement: number;
  followers: number;
  diagnostics: number;
  sales: number;
  revenue: number;
  created_at: string;
  updated_at: string;
}

export const useContentProductionStats = (projectId: string | null, periodStart: string = '2026-01-01', periodEnd: string = '2026-01-22') => {
  const [stats, setStats] = useState<ContentProductionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!projectId) {
        setStats(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('content_production_stats')
          .select('*')
          .eq('project_id', projectId)
          .eq('period_start', periodStart)
          .eq('period_end', periodEnd)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
          throw fetchError;
        }

        setStats(data || null);
      } catch (err: any) {
        console.error('Error fetching content production stats:', err);
        setError(err.message || 'Failed to load stats');
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('content_production_stats_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content_production_stats',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, periodStart, periodEnd]);

  return { stats, loading, error };
};
