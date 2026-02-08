import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Competitor {
  id: string;
  project_id: string;
  handle: string;
  platform: string;
  avatar_url?: string | null;
  last_scanned_at: string | null;
  top_content_links: any | null;
  created_at: string;
}

export interface CompetitorPost {
  id: string;
  competitor_id: string;
  external_id: string;
  caption: string;
  media_url: string | null;
  thumbnail_url: string | null;
  platform: string;
  engagement_rate: number;
  reach: number;
  comments_count: number;
  likes_count: number;
  reposts_count: number;
  published_at: string;
  virality_score: number;
  ai_analysis?: any;
}

export const useCompetitors = (projectId: string | null) => {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [posts, setPosts] = useState<CompetitorPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompetitors = useCallback(async () => {
    if (!projectId) return;

    try {
      const { data, error } = await supabase
        .from('competitor_monitoring')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompetitors(data || []);
    } catch (error) {
      console.error('Error fetching competitors:', error);
    }
  }, [projectId]);

  const fetchPosts = useCallback(async () => {
    if (!projectId) return;

    try {
      // User mentioned n8n ingestion, so we expect a table like 'competitor_posts'
      // If it doesn't exist yet, we'll get an error, but that's fine for now as we plan for its existence
      const { data, error } = await supabase
        .from('competitor_posts')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(50);

      if (error) {
        console.warn('competitor_posts table not found or error fetching posts:', error);
        return;
      }
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  }, [projectId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchCompetitors(), fetchPosts()]).finally(() => setLoading(false));
  }, [fetchCompetitors, fetchPosts]);

  const addCompetitor = useCallback(async (platform: string, handle: string) => {
    if (!projectId) return null;

    try {
      const { data, error } = await supabase.functions.invoke('create-competitor', {
        body: { projectId, platform, handle }
      });

      if (error) throw error;

      const newItem = data as Competitor;
      setCompetitors(prev => [newItem, ...prev]);
      toast.success('Конкурент добавлен');
      return newItem;
    } catch (error) {
      console.error('Error adding competitor:', error);
      toast.error('Ошибка добавления конкурента');
      return null;
    }
  }, [projectId]);

  const removeCompetitor = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('competitor_monitoring')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setCompetitors(prev => prev.filter(c => c.id !== id));
      toast.success('Конкурент удален');
    } catch (error) {
      console.error('Error removing competitor:', error);
      toast.error('Ошибка удаления');
    }
  }, []);

  return {
    competitors,
    posts,
    loading,
    addCompetitor,
    removeCompetitor,
    refreshData: () => Promise.all([fetchCompetitors(), fetchPosts()])
  };
};
