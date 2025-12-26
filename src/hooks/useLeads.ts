import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
}

export interface LeadFilter {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  status?: string;
  search?: string;
}

export function useLeads(projectId: string | null) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<LeadFilter>({});

  const fetchLeads = async () => {
    if (!projectId) {
      setLeads([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('leads')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

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
  };

  useEffect(() => {
    fetchLeads();
  }, [projectId, filters]);

  const getUniqueValues = (field: keyof Lead) => {
    const values = leads
      .map(lead => lead[field])
      .filter((value): value is string => value !== null && value !== undefined);
    return [...new Set(values)];
  };

  const updateLead = async (
    leadId: string,
    updates: Partial<Pick<Lead, 'name' | 'phone' | 'email' | 'status' | 'deal_amount'>>
  ) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId);

      if (error) throw error;
      
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
  };

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
