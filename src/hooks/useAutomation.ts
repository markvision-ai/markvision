// @ts-nocheck
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Поля automation_flows (схема из src/integrations/supabase/types.ts).
 * flow_name, webhook_url — для отображения и запуска по активированному хуку.
 */
export interface AutomationFlowRow {
  id: string;
  project_id: string;
  flow_name: string | null;
  status: 'active' | 'inactive' | 'error' | 'running' | 'paused';
  last_seen: string | null;
  execution_time: number | null;
  n8n_id: string | null;
  webhook_url: string | null;
}

const FIELDS = 'id, project_id, flow_name, status, last_seen, execution_time, n8n_id, webhook_url';

function parseExecutionTime(raw: unknown): number | null {
  if (typeof raw === 'number' && !isNaN(raw)) return raw;
  if (typeof raw === 'string') {
    const n = parseInt(raw, 10);
    return isNaN(n) ? null : n;
  }
  return null;
}

function normalize(row: Record<string, unknown> | null): AutomationFlowRow | null {
  if (!row || typeof row.id !== 'string') return null;
  const status = row.status as string;
  const valid = ['active', 'inactive', 'error', 'running', 'paused'];
  return {
    id: row.id as string,
    project_id: (row.project_id as string) ?? '',
    flow_name: typeof row.flow_name === 'string' ? row.flow_name : null,
    status: valid.includes(status) ? (status as AutomationFlowRow['status']) : 'inactive',
    last_seen: (row.last_seen as string) ?? null,
    execution_time: parseExecutionTime(row.execution_time),
    n8n_id: typeof row.n8n_id === 'string' ? row.n8n_id : null,
    webhook_url: typeof row.webhook_url === 'string' ? row.webhook_url : null,
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
        .order('last_seen', { ascending: false, nullsFirst: false })
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
