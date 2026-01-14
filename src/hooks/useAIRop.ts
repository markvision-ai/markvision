import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/externalSupabase';
import { toast } from 'sonner';

export interface AIRopTask {
  id: string;
  project_id: string;
  task_text: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  created_by: string | null;
}

export interface AIRopAudit {
  id: string;
  project_id: string;
  audit_date: string;
  overall_score: number;
  critical_errors: string[];
  growth_points: string[];
  bot_stats: {
    total_dialogs?: number;
    logic_errors?: number;
    successful_bookings?: number;
  };
  summary: string | null;
  created_at: string;
}

export const useAIRop = (projectId: string | null) => {
  const [tasks, setTasks] = useState<AIRopTask[]>([]);
  const [audits, setAudits] = useState<AIRopAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!projectId) return;
    
    const { data, error } = await supabase
      .from('ai_rop_tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching tasks:', error);
      return;
    }

    setTasks(data as AIRopTask[]);
  }, [projectId]);

  const fetchAudits = useCallback(async () => {
    if (!projectId) return;
    
    const { data, error } = await supabase
      .from('ai_rop_audits')
      .select('*')
      .eq('project_id', projectId)
      .order('audit_date', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching audits:', error);
      return;
    }

    // Parse JSONB fields
    const parsedAudits = data.map(audit => ({
      ...audit,
      critical_errors: Array.isArray(audit.critical_errors) ? audit.critical_errors : [],
      growth_points: Array.isArray(audit.growth_points) ? audit.growth_points : [],
      bot_stats: typeof audit.bot_stats === 'object' ? audit.bot_stats : {}
    })) as AIRopAudit[];

    setAudits(parsedAudits);
  }, [projectId]);

  const createTask = useCallback(async (taskText: string) => {
    if (!projectId || !taskText.trim()) return null;
    
    setSubmitting(true);
    
    const { data: userData } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('ai_rop_tasks')
      .insert({
        project_id: projectId,
        task_text: taskText.trim(),
        status: 'pending',
        created_by: userData.user?.id || null
      })
      .select()
      .single();

    setSubmitting(false);

    if (error) {
      console.error('Error creating task:', error);
      toast.error('Ошибка создания задачи');
      return null;
    }

    toast.success('Задача отправлена ИИ-РОПу');
    return data as AIRopTask;
  }, [projectId]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTasks(), fetchAudits()]);
      setLoading(false);
    };
    
    if (projectId) {
      loadData();
    }
  }, [projectId, fetchTasks, fetchAudits]);

  // Realtime subscription for tasks
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel('ai-rop-tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_rop_tasks',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [payload.new as AIRopTask, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => 
              prev.map(task => 
                task.id === payload.new.id ? payload.new as AIRopTask : task
              )
            );
            
            // Notify when task completed
            if (payload.new.status === 'completed') {
              toast.success('ИИ-РОП завершил анализ');
            }
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(task => task.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  return {
    tasks,
    audits,
    loading,
    submitting,
    createTask,
    refetch: () => Promise.all([fetchTasks(), fetchAudits()])
  };
};
