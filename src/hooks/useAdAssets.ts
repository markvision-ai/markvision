import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/externalSupabase';
import { toast } from 'sonner';

export interface AdAsset {
  id: string;
  project_id: string;
  campaign_id: string | null;
  asset_type: 'image' | 'video';
  file_url: string;
  file_name: string | null;
  aspect_ratio: string | null;
  platform: 'facebook' | 'tiktok' | 'google' | 'all' | null;
  ai_headlines: string[];
  ai_descriptions: string[];
  ai_primary_text: string | null;
  ai_hashtags: string[] | null;
  ai_score: number | null;
  status: 'draft' | 'active' | 'paused' | 'archived';
  created_at: string;
  updated_at: string;
}

export function useAdAssets(projectId: string | null) {
  const [assets, setAssets] = useState<AdAsset[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssets = useCallback(async () => {
    if (!projectId) {
      setAssets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ad_assets')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setAssets((data || []).map(a => ({
        ...a,
        asset_type: a.asset_type as 'image' | 'video',
        platform: a.platform as AdAsset['platform'],
        status: a.status as AdAsset['status'],
        ai_headlines: (a.ai_headlines || []) as string[],
        ai_descriptions: (a.ai_descriptions || []) as string[],
      })));
    } catch (error) {
      console.error('Error fetching ad assets:', error);
      toast.error('Ошибка загрузки креативов');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const createAsset = async (asset: Omit<AdAsset, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('ad_assets')
        .insert(asset)
        .select()
        .single();

      if (error) throw error;
      
      const newAsset = {
        ...data,
        asset_type: data.asset_type as 'image' | 'video',
        platform: data.platform as AdAsset['platform'],
        status: data.status as AdAsset['status'],
        ai_headlines: (data.ai_headlines || []) as string[],
        ai_descriptions: (data.ai_descriptions || []) as string[],
      };
      
      setAssets(prev => [newAsset, ...prev]);
      toast.success('Креатив добавлен');
      return newAsset;
    } catch (error) {
      console.error('Error creating ad asset:', error);
      toast.error('Ошибка создания креатива');
      return null;
    }
  };

  const updateAsset = async (id: string, updates: Partial<AdAsset>) => {
    try {
      const { error } = await supabase
        .from('ad_assets')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      setAssets(prev => prev.map(a => 
        a.id === id ? { ...a, ...updates } : a
      ));
      
      toast.success('Креатив обновлён');
      return true;
    } catch (error) {
      console.error('Error updating ad asset:', error);
      toast.error('Ошибка обновления креатива');
      return false;
    }
  };

  const deleteAsset = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ad_assets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setAssets(prev => prev.filter(a => a.id !== id));
      toast.success('Креатив удалён');
      return true;
    } catch (error) {
      console.error('Error deleting ad asset:', error);
      toast.error('Ошибка удаления креатива');
      return false;
    }
  };

  return {
    assets,
    loading,
    refetch: fetchAssets,
    createAsset,
    updateAsset,
    deleteAsset,
  };
}
