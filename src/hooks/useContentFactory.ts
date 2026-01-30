import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/externalSupabase';
import { toast } from 'sonner';

export type ContentType = 'avatar_video' | 'ai_video' | 'static_post' | 'carousel' | 'threads' | 'tg_text';
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
}

export interface Competitor {
  id: string;
  project_id: string;
  handle: string;
  platform: string;
  last_scanned_at: string | null;
  top_content_links: any | null;
  created_at: string;
}

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
      
      const typedData = (data || []).map(item => ({
        id: item.id,
        project_id: item.project_id || '',
        content_type: (item.platform_type as ContentType) || 'avatar_video',
        title: item.title || 'Без названия',
        original_script: item.body_text,
        rewritten_script: item.body_text, // using body_text as fallback
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
      }));
      
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
            const newItem = {
              ...payload.new,
              content_type: payload.new.content_type as ContentType,
              status: payload.new.status as ContentStatus,
              carousel_media: (payload.new.carousel_media as string[]) || [],
            } as ContentItem;
            setContent(prev => [newItem, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = {
              ...payload.new,
              content_type: payload.new.content_type as ContentType,
              status: payload.new.status as ContentStatus,
              carousel_media: (payload.new.carousel_media as string[]) || [],
            } as ContentItem;
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

  const createContent = async (data: { title: string; content_type: ContentType; original_script?: string; source_url?: string }) => {
    if (!projectId) return null;

    try {
      const { data: created, error } = await supabase
        .from('content_factory')
        .insert([{ 
          title: data.title,
          content_type: data.content_type,
          original_script: data.original_script || null,
          source_url: data.source_url || null,
          project_id: projectId 
        }])
        .select()
        .single();

      if (error) throw error;
      toast.success('Контент создан');
      return created;
    } catch (error) {
      console.error('Error creating content:', error);
      toast.error('Ошибка создания контента');
      return null;
    }
  };

  const updateContent = async (id: string, data: Partial<ContentItem>) => {
    // Optimistic update
    const previousContent = [...content];
    const previousItem = content.find(item => item.id === id);
    
    // Apply optimistic change immediately
    setContent(prev => prev.map(item => item.id === id ? { ...item, ...data } : item));

    try {
      const { error } = await supabase
        .from('content_factory')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      // Success toast is optional for drag-drop to reduce noise, but good for explicit actions
      // toast.success('Контент обновлён');
      return true;
    } catch (error) {
      console.error('Error updating content:', error);
      // Revert to previous state on error
      if (previousItem) {
        setContent(prev => prev.map(item => item.id === id ? previousItem : item));
      } else {
        // Fallback: restore full list if item tracking failed
        setContent(previousContent);
      }
      toast.error('Ошибка обновления');
      return false;
    }
  };

  const deleteContent = async (id: string) => {
    // Optimistic delete
    const previousContent = [...content];
    setContent(prev => prev.filter(item => item.id !== id));

    try {
      const { error } = await supabase
        .from('content_factory')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Контент удалён');
      return true;
    } catch (error) {
      console.error('Error deleting content:', error);
      // Revert
      setContent(previousContent);
      toast.error('Ошибка удаления');
      return false;
    }
  };

  const addCompetitor = async (accountHandle: string, platform: string) => {
    if (!projectId) return null;

    try {
      const { data, error } = await supabase
        .from('competitor_monitoring')
        .insert([{ project_id: projectId, handle: accountHandle, platform }])
        .select()
        .single();

      if (error) throw error;
      setCompetitors(prev => [data, ...prev]);
      toast.success('Конкурент добавлен');
      return data;
    } catch (error) {
      console.error('Error adding competitor:', error);
      toast.error('Ошибка добавления конкурента');
      return null;
    }
  };

  const removeCompetitor = async (id: string) => {
    try {
      const { error } = await supabase
        .from('competitor_monitoring')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setCompetitors(prev => prev.filter(c => c.id !== id));
      toast.success('Конкурент удалён');
      return true;
    } catch (error) {
      console.error('Error removing competitor:', error);
      toast.error('Ошибка удаления');
      return false;
    }
  };

  // Webhook triggers for n8n
  const triggerWebhook = async (action: string, payload: Record<string, unknown>) => {
    // This will be called by n8n webhooks configured in settings
    if (import.meta.env.DEV) console.log('Triggering webhook:', action, payload);
    toast.info(`Отправлено в n8n: ${action}`);
    // In production, this would POST to your n8n webhook URL
    return true;
  };

  const triggerVoice = async (contentId: string, script: string, voiceSettings?: Record<string, unknown>) => {
    await updateContent(contentId, { status: 'scripting' });
    return triggerWebhook('trigger_voice', { content_id: contentId, script, voice_settings: voiceSettings });
  };

  const triggerAvatar = async (contentId: string, audioUrl: string, avatarId?: string) => {
    await updateContent(contentId, { status: 'voice_ready' });
    return triggerWebhook('trigger_avatar', { content_id: contentId, audio_url: audioUrl, avatar_id: avatarId });
  };

  const triggerAiVideo = async (contentId: string, script: string, style?: string) => {
    await updateContent(contentId, { status: 'scripting' });
    return triggerWebhook('trigger_ai_video', { content_id: contentId, script, style });
  };

  const triggerEdit = async (contentId: string, videoUrl: string, captionsStyle?: string) => {
    await updateContent(contentId, { status: 'avatar_ready' });
    return triggerWebhook('trigger_edit', { content_id: contentId, video_url: videoUrl, captions_style: captionsStyle });
  };

  const triggerPublish = async (contentId: string, finalVideoUrl: string, caption: string, platforms: string[]) => {
    await updateContent(contentId, { status: 'ready_to_send' });
    return triggerWebhook('trigger_publish', { 
      content_id: contentId, 
      final_video_url: finalVideoUrl, 
      caption, 
      platforms 
    });
  };

  return {
    content,
    competitors,
    loading,
    createContent,
    updateContent,
    deleteContent,
    addCompetitor,
    removeCompetitor,
    refetch: fetchContent,
    triggerVoice,
    triggerAvatar,
    triggerAiVideo,
    triggerEdit,
    triggerPublish,
  };
};
