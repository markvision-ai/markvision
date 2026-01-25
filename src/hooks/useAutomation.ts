import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/externalSupabase';

/**
 * Строгий список полей automation_flows (только эти — не добавлять):
 * flow_name, description, trigger_type, webhook_url, status, last_run, last_seen, execution_time.
 * id, project_id — для фильтрации и ключей.
 */
export interface AutomationFlowRow {
  id: string;
  project_id: string;
  flow_name: string;
  description: string;
  trigger_type: string | null;
  webhook_url: string | null;
  status: 'active' | 'inactive' | 'error' | 'running' | 'paused';
  last_run: string | null;
  last_seen: string | null;
  execution_time: number | null;
}

const FIELDS = 'id, project_id, flow_name, description, trigger_type, webhook_url, status, last_run, last_seen, execution_time';

function normalize(row: Record<string, unknown> | null): AutomationFlowRow | null {
  if (!row || typeof row.id !== 'string') return null;
  const status = row.status as string;
  const valid = ['active', 'inactive', 'error', 'running', 'paused'];
  return {
    id: row.id as string,
    project_id: (row.project_id as string) ?? '',
    flow_name: (row.flow_name as string) ?? 'Без названия',
    description: (row.description as string) ?? '',
    trigger_type: (row.trigger_type as string) ?? null,
    webhook_url: typeof row.webhook_url === 'string' ? row.webhook_url : null,
    status: valid.includes(status) ? (status as AutomationFlowRow['status']) : 'inactive',
    last_run: (row.last_run as string) ?? null,
    last_seen: (row.last_seen as string) ?? null,
    execution_time: typeof row.execution_time === 'number' ? row.execution_time : null,
  };
}

export function useAutomation(projectId: string | null) {
  const [flows, setFlows] = useState<AutomationFlowRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlows = useCallback(async () => {
    if (!projectId) {
      setFlows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('automation_flows')
        .select(FIELDS)
        .eq('project_id', projectId)
        .order('last_run', { ascending: false, nullsFirst: false })
        .limit(12);

      if (error) {
        setFlows([]);
        return;
      }
      const list = (data ?? []).map(normalize).filter((x): x is AutomationFlowRow => x != null);
      setFlows(list);
    } catch {
      setFlows([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchFlows();
  }, [fetchFlows]);

  return { flows, loading, refetch: fetchFlows };
}
