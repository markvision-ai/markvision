import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LeadStatusChange {
  id: string;
  lead_id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string;
  changed_by_name: string | null;
  deal_amount_change: number | null;
  created_at: string;
}

export const useLeadStatusHistory = (leadId: string | null) => {
  const [history, setHistory] = useState<LeadStatusChange[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!leadId) {
      setHistory([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lead_status_history')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory((data as LeadStatusChange[]) || []);
    } catch (error) {
      console.error('Error fetching status history:', error);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    loading,
    refresh: fetchHistory,
  };
};

export const logStatusChange = async (
  leadId: string,
  userId: string,
  userName: string,
  oldStatus: string | null,
  newStatus: string,
  dealAmountChange?: number
) => {
  try {
    const { error } = await supabase.from('lead_status_history').insert({
      lead_id: leadId,
      changed_by: userId,
      changed_by_name: userName,
      old_status: oldStatus,
      new_status: newStatus,
      deal_amount_change: dealAmountChange || null,
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error logging status change:', error);
    return false;
  }
};
