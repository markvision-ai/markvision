import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/externalSupabase';

/**
 * Строгий список полей automation_flows (только колонки из БД):
 * id, project_id, name, flow_name, description, status, last_run, last_seen,
 * execution_time, trigger_type, webhook_url.
 */
export interface AutomationFlowRow {
  id: string;
  project_id: string;
  name: string;
  flow_name: string | null;
  description: string | null;
  trigger_type: string | null;
  webhook_url: string | null;
  status: 'active' | 'inactive' | 'error' | 'running' | 'paused';
  last_run: string | null;
  last_seen: string | null;
  execution_time: number | null;
}

const FIELDS = 'id, project_id, name, flow_name, description, trigger_type, webhook_url, status, last_run, last_seen, execution_time';

function normalize(row: Record<string, unknown> | null): AutomationFlowRow | null {
  if (!row || typeof row.id !== 'string') return null;
  const status = row.status as string;
  const valid = ['active', 'inactive', 'error', 'running', 'paused'];
  return {
    id: row.id as string,
    project_id: (row.project_id as string) ?? '',
    name: (row.name as string) ?? '',
    flow_name: typeof row.flow_name === 'string' ? row.flow_name : null,
    description: typeof row.description === 'string' ? row.description : null,
    trigger_type: typeof row.trigger_type === 'string' ? row.trigger_type : null,
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

  const FETCH_TIMEOUT_MS = 15_000;

  const fetchFlows = useCallback(async () => {
    if (!projectId) {
      setFlows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    const timer = setTimeout(() => {
      cancelled = true;
      setLoading(false);
      setFlows([]);
      import('sonner').then(({ toast }) => toast.error('Таймаут загрузки связок'));
    }, FETCH_TIMEOUT_MS);
    try {
      const { data, error } = await supabase
        .from('automation_flows')
        .select(FIELDS)
        .eq('project_id', projectId)
        .order('last_run', { ascending: false, nullsFirst: false })
        .limit(12);

      if (cancelled) return;
      if (error) {
        setFlows([]);
        const { toast } = await import('sonner');
        toast.error(`Ошибка загрузки связок: ${error.message}`);
        return;
      }
      const list = (data ?? []).map(normalize).filter((x): x is AutomationFlowRow => x != null);
      setFlows(list);
    } catch (err) {
      if (cancelled) return;
      setFlows([]);
      const { toast } = await import('sonner');
      toast.error(`Ошибка загрузки: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
    } finally {
      clearTimeout(timer);
      if (!cancelled) setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchFlows();
  }, [fetchFlows]);

  return { flows, loading, refetch: fetchFlows };
}
