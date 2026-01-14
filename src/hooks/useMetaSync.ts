import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SyncResult {
  success: boolean;
  ads?: {
    campaigns: number;
    totalSpend: number;
  };
  instagram?: {
    posts: number;
    reels: number;
  };
  synced_at?: string;
  error?: string;
}

interface MarketingStats {
  id: string;
  source: string;
  date: string;
  spend: number;
  clicks: number;
  impressions: number;
  reach: number;
  campaign_name: string | null;
  synced_at: string;
}

interface InstagramContentStats {
  id: string;
  media_id: string;
  media_type: string;
  caption: string | null;
  permalink: string;
  thumbnail_url: string | null;
  views_count: number;
  likes_count: number;
  comments_count: number;
  posted_at: string;
}

export const useMetaSync = (projectId: string | null) => {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const syncMetaData = useCallback(async (syncType: 'ads' | 'instagram' | 'all' = 'all'): Promise<SyncResult | null> => {
    if (!projectId) {
      toast.error('Проект не выбран');
      return null;
    }

    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-meta-ads', {
        body: { projectId, syncType }
      });

      if (error) {
        console.error('Sync error:', error);
        toast.error('Ошибка синхронизации: ' + error.message);
        return null;
      }

      if (data.error) {
        toast.error(data.error);
        return { success: false, error: data.error };
      }

      setLastSync(data.synced_at);
      
      if (syncType === 'ads' || syncType === 'all') {
        toast.success(`Синхронизировано ${data.ads?.campaigns || 0} кампаний`);
      }
      if (syncType === 'instagram' || syncType === 'all') {
        toast.success(`Синхронизировано ${(data.instagram?.posts || 0) + (data.instagram?.reels || 0)} публикаций`);
      }

      return data;
    } catch (err) {
      console.error('Sync failed:', err);
      toast.error('Не удалось синхронизировать данные');
      return null;
    } finally {
      setSyncing(false);
    }
  }, [projectId]);

  const getMarketingStats = useCallback(async (
    source?: string,
    days: number = 30
  ): Promise<MarketingStats[]> => {
    if (!projectId) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabase
      .from('marketing_stats')
      .select('id, source, date, spend, clicks, impressions, reach, campaign_name, synced_at')
      .eq('project_id', projectId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (source) {
      query = query.eq('source', source);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching marketing stats:', error);
      return [];
    }

    return (data || []) as MarketingStats[];
  }, [projectId]);

  const getInstagramContent = useCallback(async (
    limit: number = 50
  ): Promise<InstagramContentStats[]> => {
    if (!projectId) return [];

    const { data, error } = await supabase
      .from('instagram_content_stats')
      .select('id, media_id, media_type, caption, permalink, thumbnail_url, views_count, likes_count, comments_count, posted_at')
      .eq('project_id', projectId)
      .order('posted_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching Instagram content:', error);
      return [];
    }

    return (data || []) as InstagramContentStats[];
  }, [projectId]);

  const getTotalSpend = useCallback(async (days: number = 30): Promise<number> => {
    const stats = await getMarketingStats(undefined, days);
    return stats.reduce((sum, stat) => sum + (stat.spend || 0), 0);
  }, [getMarketingStats]);

  const getIntegrationStatus = useCallback(async (): Promise<{
    connected: boolean;
    lastSync: string | null;
  }> => {
    if (!projectId) return { connected: false, lastSync: null };

    const { data } = await supabase
      .from('integrations')
      .select('status, last_sync_at')
      .eq('project_id', projectId)
      .eq('type', 'facebook')
      .single();

    return {
      connected: data?.status === 'active',
      lastSync: data?.last_sync_at || null
    };
  }, [projectId]);

  return {
    syncing,
    lastSync,
    syncMetaData,
    getMarketingStats,
    getInstagramContent,
    getTotalSpend,
    getIntegrationStatus
  };
};
