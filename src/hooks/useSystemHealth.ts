import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SystemHealth {
  id: string;
  status: 'operational' | 'degraded' | 'error';
}

export function useSystemHealth(projectId: string | null) {
  const [hasErrors, setHasErrors] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const fetchHealth = async () => {
      try {
        const { data } = await supabase
          .from('system_health')
          .select('id, status')
          .eq('project_id', projectId);

        if (data && data.length > 0) {
          const hasError = (data as unknown as SystemHealth[]).some((s) => s.status === 'error');
          setHasErrors(hasError);
        } else {
          setHasErrors(false);
        }
      } catch (error) {
        console.error('Error fetching system health:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();

    // Realtime subscription for instant updates
    const channel = supabase
      .channel('global-health-indicator')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'system_health',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          // Immediately check if the change resulted in an error status
          if (payload.new && 'status' in payload.new) {
            if (payload.new.status === 'error') {
              setHasErrors(true);
            } else {
              // Re-fetch to check if any other services have errors
              fetchHealth();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  return { hasErrors, loading };
}