import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Touchpoint {
  id: string;
  deal_id: string;
  visit_id: string | null;
  channel_name: string;
  campaign_name: string | null;
  keyword: string | null;
  source_type: string;
  position: number;
  total_in_chain: number;
  is_first: boolean;
  is_last: boolean;
  deal_revenue: number;
  deal_profit: number;
  touched_at: string;
}

export interface Visit {
  id: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  source_type: string;
  landing_page: string | null;
  device_type: string | null;
  browser: string | null;
  country: string | null;
  city: string | null;
  visited_at: string;
}

export function useLeadTouchpoints(leadId: string | null, clientId: string | null, projectId: string | null) {
  const [touchpoints, setTouchpoints] = useState<Touchpoint[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!leadId || !projectId) {
      setTouchpoints([]);
      setVisits([]);
      return;
    }

    setLoading(true);
    try {
      // Fetch touchpoints for this lead
      const { data: touchpointData, error: touchpointError } = await supabase
        .from('lead_touchpoints')
        .select('*')
        .eq('project_id', projectId)
        .eq('deal_id', leadId)
        .order('position', { ascending: true });

      if (touchpointError) throw touchpointError;
      setTouchpoints(touchpointData || []);

      // Fetch all visits for this client to show full journey
      if (clientId) {
        const { data: visitData, error: visitError } = await supabase
          .from('visits')
          .select('*')
          .eq('project_id', projectId)
          .eq('client_id', clientId)
          .order('visited_at', { ascending: true });

        if (visitError) throw visitError;
        setVisits(visitData || []);
      }
    } catch (error) {
      console.error('Error fetching lead touchpoints:', error);
      setTouchpoints([]);
      setVisits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [leadId, clientId, projectId]);

  return {
    touchpoints,
    visits,
    loading
  };
}
