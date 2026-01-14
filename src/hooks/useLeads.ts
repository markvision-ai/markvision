import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuditLog } from './useAuditLog';
import { Json } from '@/integrations/supabase/types';

// Sanitize search input to prevent ILIKE wildcard injection
function sanitizeSearchInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  // Remove PostgreSQL ILIKE wildcards and escape character, limit length
  return input
    .replace(/[%_\\]/g, '') // Remove % _ and \ characters
    .substring(0, 100)
    .trim();
}

export interface Lead {
  id: string;
  project_id: string;
  external_lead_id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  status: string | null;
  deal_amount: number | null;
  client_id: string | null;
  visit_id: string | null;
  extra_data: any;
  created_at: string;
  updated_at: string;
  assigned_to: string | null;
  assigned_at: string | null;
  appointment_date: string | null;
  rejection_reason: string | null;
  lead_score: number | null;
  score_label: string | null;
}

export interface LeadFilter {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  status?: string;
  search?: string;
}

// Select only needed fields for performance
const LEAD_FIELDS = `
  id,
  project_id,
  name,
  email,
  phone,
  utm_source,
  utm_medium,
  utm_campaign,
  utm_content,
  utm_term,
  status,
  deal_amount,
  created_at,
  updated_at,
  assigned_to,
  assigned_at,
  appointment_date,
  rejection_reason,
  lead_score,
  score_label,
  external_lead_id,
  client_id,
  visit_id,
  extra_data
`;

export function useLeads(projectId: string | null) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<LeadFilter>({});
  const { logUpdate, logStatusChange } = useAuditLog();

  const fetchLeads = useCallback(async () => {
    if (!projectId) {
      setLeads([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('leads')
        .select(LEAD_FIELDS)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(500); // Limit for performance

      if (filters.utm_source) {
        query = query.eq('utm_source', filters.utm_source);
      }
      if (filters.utm_medium) {
        query = query.eq('utm_medium', filters.utm_medium);
      }
      if (filters.utm_campaign) {
        query = query.eq('utm_campaign', filters.utm_campaign);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.search) {
        const sanitized = sanitizeSearchInput(filters.search);
        if (sanitized) {
          query = query.or(`name.ilike.%${sanitized}%,phone.ilike.%${sanitized}%`);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, filters]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Set up realtime subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`leads-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLeads(prev => [payload.new as Lead, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setLeads(prev => prev.map(l => 
              l.id === payload.new.id ? { ...l, ...payload.new } as Lead : l
            ));
          } else if (payload.eventType === 'DELETE') {
            setLeads(prev => prev.filter(l => l.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const getUniqueValues = (field: keyof Lead) => {
    const values = leads
      .map(lead => lead[field])
      .filter((value): value is string => value !== null && value !== undefined);
    return [...new Set(values)];
  };

  const updateLead = useCallback(async (
    leadId: string,
    updates: Partial<Pick<Lead, 'name' | 'phone' | 'email' | 'status' | 'deal_amount'>>
  ) => {
    try {
      // Get current lead for audit logging
      const currentLead = leads.find(l => l.id === leadId);
      
      const { error } = await supabase
        .from('leads')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId);

      if (error) throw error;
      
      // Log the update
      if (currentLead) {
        if (updates.status && updates.status !== currentLead.status) {
          logStatusChange('lead', leadId, projectId || undefined, currentLead.status || undefined, updates.status);
        } else {
          const oldValues = { name: currentLead.name, phone: currentLead.phone, deal_amount: currentLead.deal_amount } as Json;
          const newValues = updates as unknown as Json;
          logUpdate('lead', leadId, projectId || undefined, oldValues, newValues);
        }
      }
      
      // Update local state
      setLeads(prev =>
        prev.map(lead =>
          lead.id === leadId ? { ...lead, ...updates } : lead
        )
      );
      
      return true;
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  }, [leads, projectId, logUpdate, logStatusChange]);

  return {
    leads,
    loading,
    filters,
    setFilters,
    refetch: fetchLeads,
    getUniqueValues,
    updateLead,
  };
}
