import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export interface AutomationRule {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_status: string | null;
  action_type: string;
  action_config: Record<string, any>;
  conditions: Record<string, any>;
  is_active: boolean;
  execution_order: number;
  created_at: string;
  updated_at: string;
}

export interface AutomationLog {
  id: string;
  project_id: string;
  automation_rule_id: string | null;
  lead_id: string | null;
  action_type: string;
  action_result: string;
  action_data: Record<string, any> | null;
  error_message: string | null;
  executed_at: string;
  lead?: { id: string; name: string | null; phone: string | null } | null;
  rule?: { id: string; name: string } | null;
}

// Helper to convert Json to Record<string, any>
const toRecord = (json: Json | null): Record<string, any> => {
  if (json === null || typeof json !== 'object' || Array.isArray(json)) {
    return {};
  }
  return json as Record<string, any>;
};

// Helper to map DB row to AutomationRule
const mapDbToRule = (row: any): AutomationRule => ({
  id: row.id,
  project_id: row.project_id,
  name: row.name,
  description: row.description,
  trigger_type: row.trigger_type,
  trigger_status: row.trigger_status,
  action_type: row.action_type,
  action_config: toRecord(row.action_config),
  conditions: toRecord(row.conditions),
  is_active: row.is_active ?? true,
  execution_order: row.execution_order ?? 0,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export function useAutomationRules(projectId: string | null) {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRules = useCallback(async () => {
    if (!projectId) {
      setRules([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('crm_automation_rules')
        .select('*')
        .eq('project_id', projectId)
        .order('execution_order');

      if (error) throw error;
      setRules((data || []).map(mapDbToRule));
    } catch (error) {
      console.error('Error fetching automation rules:', error);
      toast.error('Ошибка загрузки правил автоматизации');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const fetchLogs = useCallback(async (limit = 50) => {
    if (!projectId) return;

    try {
      const { data, error } = await supabase
        .from('automation_logs')
        .select(`
          *,
          lead:leads(id, name, phone),
          rule:crm_automation_rules(id, name)
        `)
        .eq('project_id', projectId)
        .order('executed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setLogs((data as unknown as AutomationLog[]) || []);
    } catch (error) {
      console.error('Error fetching automation logs:', error);
    }
  }, [projectId]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const toggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('crm_automation_rules')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', ruleId);

      if (error) throw error;
      
      setRules(prev => prev.map(r => 
        r.id === ruleId ? { ...r, is_active: isActive } : r
      ));
      
      toast.success(isActive ? 'Правило активировано' : 'Правило деактивировано');
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast.error('Ошибка обновления правила');
    }
  };

  const triggerStatusChange = async (leadId: string, newStatus: string, oldStatus?: string) => {
    if (!projectId) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await supabase.functions.invoke('crm-automation', {
        body: {
          action: 'trigger_status_change',
          project_id: projectId,
          lead_id: leadId,
          new_status: newStatus,
          old_status: oldStatus
        }
      });

      if (response.error) throw response.error;
      
      console.log('Automation triggered:', response.data);
    } catch (error) {
      console.error('Error triggering automation:', error);
    }
  };

  const triggerNewLead = async (leadId: string) => {
    if (!projectId) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await supabase.functions.invoke('crm-automation', {
        body: {
          action: 'trigger_new_lead',
          project_id: projectId,
          lead_id: leadId
        }
      });

      if (response.error) throw response.error;
      
      console.log('New lead automation triggered:', response.data);
    } catch (error) {
      console.error('Error triggering new lead automation:', error);
    }
  };

  const createRule = async (rule: Omit<AutomationRule, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('crm_automation_rules')
        .insert(rule)
        .select()
        .single();

      if (error) throw error;
      
      const mappedRule = mapDbToRule(data);
      setRules(prev => [...prev, mappedRule]);
      toast.success('Правило создано');
      return mappedRule;
    } catch (error) {
      console.error('Error creating rule:', error);
      toast.error('Ошибка создания правила');
      throw error;
    }
  };

  const updateRule = async (ruleId: string, updates: Partial<AutomationRule>) => {
    try {
      const { data, error } = await supabase
        .from('crm_automation_rules')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', ruleId)
        .select()
        .single();

      if (error) throw error;
      
      const mappedRule = mapDbToRule(data);
      setRules(prev => prev.map(r => r.id === ruleId ? mappedRule : r));
      toast.success('Правило обновлено');
      return mappedRule;
    } catch (error) {
      console.error('Error updating rule:', error);
      toast.error('Ошибка обновления правила');
      throw error;
    }
  };

  const deleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from('crm_automation_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;
      
      setRules(prev => prev.filter(r => r.id !== ruleId));
      toast.success('Правило удалено');
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error('Ошибка удаления правила');
      throw error;
    }
  };

  return {
    rules,
    logs,
    loading,
    fetchRules,
    fetchLogs,
    toggleRule,
    triggerStatusChange,
    triggerNewLead,
    createRule,
    updateRule,
    deleteRule
  };
}
