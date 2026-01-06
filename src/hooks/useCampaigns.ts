import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/externalSupabase';
import { toast } from 'sonner';

export interface Campaign {
  id: string;
  project_id: string;
  platform: 'facebook' | 'tiktok' | 'google';
  external_id: string | null;
  name: string;
  status: boolean;
  budget: number;
  spent_today: number;
  autopilot_enabled: boolean;
  rules: {
    max_cpa?: number | null;
    min_roas?: number | null;
    max_daily_spend?: number | null;
  };
  ai_log: Array<{
    timestamp: string;
    action: string;
    details?: string;
  }>;
  created_at: string;
  updated_at: string;
}

export function useCampaigns(projectId: string | null) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = useCallback(async () => {
    if (!projectId) {
      setCampaigns([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setCampaigns((data || []).map(c => ({
        ...c,
        platform: c.platform as 'facebook' | 'tiktok' | 'google',
        rules: (c.rules || {}) as Campaign['rules'],
        ai_log: (c.ai_log || []) as Campaign['ai_log'],
      })));
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Ошибка загрузки кампаний');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const updateCampaign = async (id: string, updates: Partial<Campaign>) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      setCampaigns(prev => prev.map(c => 
        c.id === id ? { ...c, ...updates } : c
      ));
      
      toast.success('Кампания обновлена');
      return true;
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('Ошибка обновления кампании');
      return false;
    }
  };

  const createCampaign = async (campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert(campaign)
        .select()
        .single();

      if (error) throw error;
      
      setCampaigns(prev => [{
        ...data,
        platform: data.platform as 'facebook' | 'tiktok' | 'google',
        rules: (data.rules || {}) as Campaign['rules'],
        ai_log: (data.ai_log || []) as Campaign['ai_log'],
      }, ...prev]);
      
      toast.success('Кампания создана');
      return data;
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Ошибка создания кампании');
      return null;
    }
  };

  return {
    campaigns,
    loading,
    refetch: fetchCampaigns,
    updateCampaign,
    createCampaign,
  };
}
