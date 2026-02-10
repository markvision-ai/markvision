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
  status?: 'active' | 'paused' | 'error';
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
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
        .from('competitors')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompetitors(data || []);
    } catch (error) {
      console.error('Error fetching competitors:', error);
      // Fallback for empty/missing table to avoid breaking UI
      setCompetitors([]);
    }
  }, [projectId]);

  const fetchPosts = useCallback(async () => {
    if (!projectId) return;

    try {
      const { data, error } = await supabase
        .from('competitor_posts')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(50);

      if (error) {
        console.warn('competitor_posts fetch error (table might be missing):', error);
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
      // 1. Direct insert into 'competitors' table
      const { data, error } = await supabase
        .from('competitors')
        .insert([{
          project_id: projectId,
          platform,
          handle,
          status: 'active',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        // Handle unique constraint violation (already exists)
        if (error.code === '23505') {
          toast.error('Этот конкурент уже добавлен');
          return null;
        }
        throw error;
      }

      const newItem = data as Competitor;
      setCompetitors(prev => [newItem, ...prev]);
      toast.success('Конкурент добавлен (мониторинг начнется скоро)');
      return newItem;
    } catch (error: any) {
      console.error('Error adding competitor:', error);
      toast.error(`Ошибка: ${error.message || 'Не удалось добавить конкурента'}`);
      return null;
    }
  }, [projectId]);

  const removeCompetitor = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('competitors')
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
