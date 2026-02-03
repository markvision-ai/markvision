import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/externalSupabase';
import { toast } from 'sonner';

export type ContentType = 'avatar_video' | 'ai_video' | 'static_post' | 'carousel' | 'threads' | 'tg_text' | 'dental_video';
export type ContentStatus = 'ideation' | 'scripting' | 'voice_ready' | 'avatar_ready' | 'editing_ready' | 'ready_to_send' | 'sent';

export interface ContentItem {
  id: string;
  project_id: string;
  content_type: ContentType;
  title: string;
  original_script: string | null;
  rewritten_script: string | null;
  caption: string | null;
  source_url: string | null;
  audio_url: string | null;
  raw_video_url: string | null;
  final_video_url: string | null;
  carousel_media: string[];
  status: ContentStatus;
  feedback: string | null;
  competitor_id: string | null;
  views_count: number;
  followers_gained: number;
  revenue_attributed: number;
  created_at: string;
  updated_at: string;
  // Assembly Line Fields
  avatar_status: string | null;
  heygen_url: string | null;
  sora_status: string | null;
  sora_url: string | null;
  carousel_status: string | null;
  design_url: string | null;
  threads_status: string | null;
  threads_text: string | null;
  telegram_status: string | null;
  telegram_text: string | null;
  article_status: string | null;
  seo_text: string | null;
  _original_body?: any;
}

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

const mapDbToContentItem = (item: any): ContentItem => ({
  id: item.id,
  project_id: item.project_id || '',
  content_type: (item.platform_type as ContentType) || 'avatar_video',
  title: item.title || 'Без названия',
  original_script: item.body_text,
  rewritten_script: item.body_text,
  caption: item.body_text,
  source_url: item.source_url,
  audio_url: item.voice_url,
  raw_video_url: item.video_url,
  final_video_url: item.video_url,
  carousel_media: [],
  status: (item.status as ContentStatus) || 'ideation',
  feedback: null,
  competitor_id: null,
  views_count: 0,
  followers_gained: 0,
  revenue_attributed: 0,
  created_at: item.created_at || new Date().toISOString(),
  updated_at: item.updated_at || new Date().toISOString(),
  // Assembly Line Fields - Defaults
  avatar_status: item.body?.avatar_status || item.heygen_status || 'idle',
  heygen_url: item.heygen_url || item.body?.heygen_url || null,
  sora_status: item.body?.sora_status || item.sora_status || 'idle',
  sora_url: item.sora_url || item.body?.sora_url || null,
  carousel_status: item.body?.carousel_status || item.design_status || 'idle',
  design_url: item.design_url || item.body?.design_url || null,
  threads_status: item.body?.threads_status || item.threads_status || 'idle',
  threads_text: item.threads_text || item.body?.threads_text || null,
  telegram_status: item.body?.telegram_status || item.telegram_status || 'idle',
  telegram_text: item.telegram_text || item.body?.telegram_text || null,
  article_status: item.body?.article_status || item.seo_status || 'idle',
  seo_text: item.seo_text || item.body?.seo_text || null,
  _original_body: item.body || {}
});

export const useContentFactory = (projectId: string | null) => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContent = useCallback(async () => {
    if (!projectId) {
      setContent([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('content_factory')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const typedData = (data || []).map(mapDbToContentItem);
      
      setContent(typedData);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast.error('Ошибка загрузки контента');
    }
  }, [projectId]);

  const fetchCompetitors = useCallback(async () => {
    if (!projectId) {
      setCompetitors([]);
      return;
    }

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

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchContent(), fetchCompetitors()]).finally(() => setLoading(false));
  }, [fetchContent, fetchCompetitors]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel('content_factory_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content_factory',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newItem = mapDbToContentItem(payload.new);
            setContent(prev => [newItem, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = mapDbToContentItem(payload.new);
            setContent(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
          } else if (payload.eventType === 'DELETE') {
            setContent(prev => prev.filter(item => item.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const ensureProjectMember = async (projectId: string, userId: string) => {
    try {
      const { data: member } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!member) {
        // Fetch organization_id if needed
        const { data: project } = await supabase
          .from('projects')
          .select('organization_id')
          .eq('id', projectId)
          .single();

        const payload: any = { 
          project_id: projectId, 
          user_id: userId, 
          role: 'owner' 
        };
        
        if (project?.organization_id) {
          payload.organization_id = project.organization_id;
        }

        const { error } = await supabase
          .from('project_members')
          .insert([payload]);
          
        if (error) console.error('Auto-join project failed:', error);
      }
    } catch (e) {
      console.error('Error in ensureProjectMember:', e);
    }
  };

  const createContent = async (data: any) => {
    if (!projectId) return null;

    try {
      // 0. Get current user for RLS
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await ensureProjectMember(projectId, user.id);
      }
      
      // 1. Create task for n8n (Queue)
      const { error: taskError } = await (supabase as any)
        .from('content_tasks')
        .insert([{ 
          ...data,
          project_id: projectId,
          user_id: user?.id, // Add user_id for RLS if available
          created_at: new Date().toISOString()
        }]);

      if (taskError) throw taskError;
      
      toast.success('Задача на создание контента отправлена');
      return true;
    } catch (error) {
      console.error('Error creating content:', error);
      toast.error('Ошибка при создании контента');
      return null;
    }
  };

  const addCompetitor = async (platform: string, handle: string) => {
    if (!projectId) return null;
    
    try {
      // Get current user for RLS
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
         throw new Error('User not authenticated');
      }

      await ensureProjectMember(projectId, user.id);

      // Insert competitor
      const { data, error } = await supabase
        .from('competitor_monitoring')
        .insert([{
          project_id: projectId,
          platform,
          handle,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Map response to Competitor interface
      const newItem: Competitor = {
        id: data.id,
        project_id: data.project_id,
        handle: data.handle || data.account_handle,
        platform: data.platform,
        avatar_url: data.avatar_url || null,
        last_scanned_at: data.last_scanned_at,
        top_content_links: data.top_content_links || null,
        created_at: data.created_at
      };
      
      setCompetitors(prev => [newItem, ...prev]);
      toast.success('Конкурент добавлен');
      return newItem;
    } catch (error) {
      console.error('Error adding competitor:', error);
      toast.error('Ошибка добавления конкурента');
      return null;
    }
  };

  const deleteCompetitor = async (id: string) => {
    try {
      const { error } = await supabase
        .from('competitor_monitoring')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setCompetitors(prev => prev.filter(c => c.id !== id));
      toast.success('Конкурент удален');
    } catch (error) {
      console.error('Error deleting competitor:', error);
      toast.error('Ошибка удаления');
    }
  };

  return {
    content,
    competitors,
    loading,
    createContent,
    addCompetitor,
    deleteCompetitor,
    refresh: fetchContent
  };
};
