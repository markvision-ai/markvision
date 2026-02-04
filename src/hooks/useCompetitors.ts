import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Competitor {
  id: string;
  project_id: string;
  handle: string;
  platform: string;
  avatar_url?: string;
  followers_count?: number;
  engagement_rate?: number;
  posts_count?: number;
  stories_count?: number;
  last_scanned_at?: string;
  status?: string;
  top_content_links?: any;
}

export function useCompetitors(projectId: string | null) {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompetitors = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('competitor_monitoring')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompetitors(data || []);
    } catch (e) {
      console.error('Error fetching competitors:', e);
      // toast.error('Ошибка загрузки конкурентов');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchCompetitors();
    
    if (!projectId) return;

    const channel = supabase
      .channel(`competitors-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'competitor_monitoring',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchCompetitors();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, fetchCompetitors]);

  const addCompetitor = async (handle: string) => {
    if (!projectId) return;
    try {
      // Mock fetching initial data
      const mockData = {
        project_id: projectId,
        handle: handle.replace('@', ''),
        platform: 'instagram',
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${handle}`,
        followers_count: Math.floor(Math.random() * 50000) + 1000,
        engagement_rate: Number((Math.random() * 5).toFixed(2)),
        posts_count: Math.floor(Math.random() * 500),
        stories_count: Math.floor(Math.random() * 10),
        status: 'active',
        last_scanned_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('competitor_monitoring')
        .insert(mockData);

      if (error) throw error;
      toast.success(`Конкурент ${handle} добавлен`);
    } catch (e) {
      console.error('Error adding competitor:', e);
      toast.error('Ошибка добавления конкурента');
      throw e;
    }
  };

  const removeCompetitor = async (id: string) => {
    try {
      const { error } = await supabase
        .from('competitor_monitoring')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Конкурент удален');
    } catch (e) {
      console.error('Error removing competitor:', e);
      toast.error('Ошибка удаления');
    }
  };

  const refreshCompetitorData = async (id: string) => {
    try {
      // Simulate scraping delay
      await new Promise(r => setTimeout(r, 1500));
      
      const updates = {
        followers_count: Math.floor(Math.random() * 50000) + 1000,
        engagement_rate: Number((Math.random() * 5).toFixed(2)),
        posts_count: Math.floor(Math.random() * 500),
        stories_count: Math.floor(Math.random() * 10),
        last_scanned_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('competitor_monitoring')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      toast.success('Данные обновлены');
    } catch (e) {
      console.error('Error refreshing competitor:', e);
      toast.error('Ошибка обновления данных');
    }
  };

  return {
    competitors,
    loading,
    addCompetitor,
    removeCompetitor,
    refreshCompetitorData
  };
}
