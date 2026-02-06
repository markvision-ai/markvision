// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ContentProductionStats {
  id: string;
  project_id: string;
  period_start: string;
  period_end: string;
  publications: number;
  stories: number;
  reach: number;
  comments: number;
  followers: number;
  visits: number;
  sales: number;
  revenue: number;
  created_at: string;
  updated_at: string;
}

export const useContentProductionStats = (projectId: string | null, periodStart: string = '2026-01-01', periodEnd?: string) => {
  // Если periodEnd не указан, используем вчерашний день
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const effectivePeriodEnd = periodEnd || yesterday.toISOString().split('T')[0];
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

        // Debug logs removed for production performance

        const { data: rows, error: fetchError } = await supabase
          .from('content_production_stats')
          .select('*')
          .eq('project_id', projectId)
          .gte('period_start', periodStart)
          .lte('period_end', effectivePeriodEnd)
          .order('period_start', { ascending: true });

        if (fetchError) {
          console.error('❌ Ошибка загрузки content_production_stats:', fetchError);
          throw fetchError;
        }

        let data: ContentProductionStats | null = null;
        if (rows && rows.length > 0) {
          const agg = rows.reduce(
            (acc, r) => ({
              publications: (acc.publications || 0) + (r.publications ?? 0),
              stories: (acc.stories || 0) + (r.stories ?? 0),
              reach: (acc.reach || 0) + (r.reach ?? 0),
              comments: (acc.comments || 0) + (r.comments ?? 0),
              followers: (acc.followers || 0) + (r.followers ?? 0),
              visits: (acc.visits || 0) + (r.visits ?? r.diagnostics ?? 0),
              sales: (acc.sales || 0) + (r.sales ?? 0),
              revenue: (acc.revenue || 0) + (r.revenue ?? 0),
            }),
            { publications: 0, stories: 0, reach: 0, comments: 0, followers: 0, visits: 0, sales: 0, revenue: 0 }
          );
          data = {
            id: rows[0].id,
            project_id: projectId,
            period_start: periodStart,
            period_end: effectivePeriodEnd,
            ...agg,
            created_at: rows[0].created_at ?? '',
            updated_at: rows[0].updated_at ?? '',
          } as ContentProductionStats;
          // Debug log removed for production
        } else {
          // Debug log removed for production
        }

        setStats(data);
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
  }, [projectId, periodStart, effectivePeriodEnd]);

  return { stats, loading, error };
};
