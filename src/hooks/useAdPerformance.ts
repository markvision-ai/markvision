import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface AdPerformanceLog {
  id: string;
  project_id: string;
  entity_id: string;
  entity_name: string;
  entity_type: string;
  date_start: string;
  date_stop: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  actions: any;
}

export function useAdPerformance(projectId: string | null, dateRange?: { from: Date; to: Date }) {
  const [performanceLogs, setPerformanceLogs] = useState<AdPerformanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchPerformance = useCallback(async () => {
    if (!projectId) {
      setPerformanceLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('ad_performance_logs')
        .select('*')
        .eq('project_id', projectId);

      if (dateRange?.from) {
        query = query.gte('date_start', format(dateRange.from, 'yyyy-MM-dd'));
      }
      if (dateRange?.to) {
        query = query.lte('date_start', format(dateRange.to, 'yyyy-MM-dd'));
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setPerformanceLogs((data || []) as AdPerformanceLog[]);
    } catch (error) {
      console.error('Error fetching ad performance:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId, dateRange]);

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  return { performanceLogs, loading, refetch: fetchPerformance };
}
