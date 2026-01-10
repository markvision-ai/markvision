import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface LeadTask {
  id: string;
  lead_id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useLeadTasks = (leadId: string | null) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<LeadTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!leadId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lead_tasks')
        .select('*')
        .eq('lead_id', leadId)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) throw error;
      setTasks((data as LeadTask[]) || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!leadId) return;

    const channel = supabase
      .channel(`lead_tasks_${leadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lead_tasks',
          filter: `lead_id=eq.${leadId}`,
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId, fetchTasks]);

  const createTask = useCallback(
    async (task: { title: string; description?: string; due_date?: string }) => {
      if (!leadId || !user) return null;

      try {
        const { data, error } = await supabase
          .from('lead_tasks')
          .insert({
            lead_id: leadId,
            user_id: user.id,
            title: task.title,
            description: task.description || null,
            due_date: task.due_date || null,
          })
          .select()
          .single();

        if (error) throw error;
        return data as LeadTask;
      } catch (error) {
        console.error('Error creating task:', error);
        return null;
      }
    },
    [leadId, user]
  );

  const toggleComplete = useCallback(async (taskId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('lead_tasks')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating task:', error);
      return false;
    }
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('lead_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  }, []);

  const updateTask = useCallback(
    async (taskId: string, updates: Partial<Pick<LeadTask, 'title' | 'description' | 'due_date'>>) => {
      try {
        const { error } = await supabase
          .from('lead_tasks')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', taskId);

        if (error) throw error;
        return true;
      } catch (error) {
        console.error('Error updating task:', error);
        return false;
      }
    },
    []
  );

  const overdueTasks = tasks.filter(
    (t) => !t.completed && t.due_date && new Date(t.due_date) < new Date()
  );

  const upcomingTasks = tasks.filter(
    (t) => !t.completed && t.due_date && new Date(t.due_date) >= new Date()
  );

  return {
    tasks,
    loading,
    createTask,
    toggleComplete,
    deleteTask,
    updateTask,
    refresh: fetchTasks,
    overdueTasks,
    upcomingTasks,
  };
};
