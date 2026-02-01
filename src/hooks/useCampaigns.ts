import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/externalSupabase';
import { toast } from 'sonner';

export interface Campaign {
  id: string;
  project_id: string;
  platform: 'facebook' | 'tiktok' | 'google' | 'instagram';
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

// Select only needed fields for performance
const CAMPAIGN_FIELDS = `
  id,
  project_id,
  platform,
  external_id,
  name,
  status,
  budget,
  spent_today,
  autopilot_enabled,
  rules,
  ai_log,
  created_at,
  updated_at
`;

export function useCampaigns(projectId: string | null) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const abortControllerRef = useCallback((controller: AbortController | null) => {
    if (controller) controller.abort();
  }, []);
  const controllerRef = useState<{ current: AbortController | null }>({ current: null })[0];

  const fetchCampaigns = useCallback(async () => {
    if (!projectId) {
      setCampaigns([]);
      setLoading(false);
      return;
    }

    // Cancel previous request
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    controllerRef.current = new AbortController();
    const signal = controllerRef.current.signal;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select(CAMPAIGN_FIELDS)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(100)
        .abortSignal(signal);

      if (error) throw error;
      
      const typedData = (data || []) as any[];
      setCampaigns(typedData.map(c => ({
        ...c,
        platform: c.platform as 'facebook' | 'tiktok' | 'google',
        rules: (c.rules || {}) as Campaign['rules'],
        ai_log: (c.ai_log || []) as Campaign['ai_log'],
      })));
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('AbortError')) {
        return;
      }
      console.error('Error fetching campaigns:', error);
      // Silently fail - table may not exist in external DB
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, [projectId]);

  useEffect(() => {
    fetchCampaigns();
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, [fetchCampaigns]);

  // Realtime subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`campaigns-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaigns',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newCampaign = {
              ...payload.new,
              platform: payload.new.platform as 'facebook' | 'tiktok' | 'google',
              rules: (payload.new.rules || {}) as Campaign['rules'],
              ai_log: (payload.new.ai_log || []) as Campaign['ai_log'],
            } as Campaign;
            setCampaigns(prev => [newCampaign, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setCampaigns(prev => prev.map(c => 
              c.id === payload.new.id 
                ? {
                    ...c,
                    ...payload.new,
                    platform: payload.new.platform as 'facebook' | 'tiktok' | 'google',
                    rules: (payload.new.rules || {}) as Campaign['rules'],
                    ai_log: (payload.new.ai_log || []) as Campaign['ai_log'],
                  } as Campaign
                : c
            ));
          } else if (payload.eventType === 'DELETE') {
            setCampaigns(prev => prev.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

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
      
      const typedData = data as any;
      setCampaigns(prev => [{
        ...typedData,
        platform: typedData.platform as 'facebook' | 'tiktok' | 'google',
        rules: (typedData.rules || {}) as Campaign['rules'],
        ai_log: (typedData.ai_log || []) as Campaign['ai_log'],
      } as Campaign, ...prev]);
      
      toast.success('Кампания создана');
      return typedData;
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