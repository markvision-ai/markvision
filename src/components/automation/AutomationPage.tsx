// @ts-nocheck
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  Webhook,
  Play,
  RefreshCw,
  CheckCircle2,
  Clock,
  Sparkles,
  Instagram,
  Facebook,
  MessageCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { FALLBACK_PROJECT_ID } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAutomation, type AutomationFlowRow } from '@/hooks/useAutomation';

const N8N_BASE = 'https://n8n.zapoinov.com';
const DISPATCHER_URL = `${N8N_BASE}/webhook/execute-any-flow-new`;
const N8N_DISPATCHER_URL = import.meta.env.VITE_N8N_DISPATCHER_URL || DISPATCHER_URL;
const N8N_SYNC_URL = `${N8N_BASE}/webhook/sync-markvision-flows`;
const SYNC_FETCH_TIMEOUT_MS = 15_000;

/** Возвращает URL как есть - n8n поддерживает CORS */
function webhookFetchUrl(url: string): string {
  return url;
}

function fetchWithTimeout(url: string, opts: RequestInit, ms: number): Promise<Response> {
  const controller = new AbortController();
  const signal = controller.signal;
  // Merge signals if one is provided in opts
  const finalOpts = { ...opts, signal: opts.signal || signal };

  const fetchPromise = fetch(url, finalOpts);
  const timeoutPromise = new Promise<never>((_, rej) => 
    setTimeout(() => {
      controller.abort();
      rej(new Error('Таймаут запроса'));
    }, ms)
  );

  return Promise.race([fetchPromise, timeoutPromise]);
}

function safeFormatDate(val: string | null | undefined): string {
  if (val == null || typeof val !== 'string') return '—';
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? '—' : format(d, 'dd.MM.yyyy HH:mm', { locale: ru });
  } catch {
    return '—';
  }
}

function getFlowIcon(flowName?: string) {
  if (!flowName) return <Zap className="w-6 h-6" />;
  const l = flowName.toLowerCase();
  if (l.includes('whatsapp') || l.includes('wa')) return <MessageCircle className="w-6 h-6 text-green-500" />;
  if (l.includes('inst') || l.includes('instagram')) return <Instagram className="w-6 h-6 text-purple-500" />;
  if (l.includes('facebook') || l.includes('fb') || l.includes('meta')) return <Facebook className="w-6 h-6 text-blue-500" />;
  return <Zap className="w-6 h-6" />;
}

interface AutomationPageProps {
  projectId: string | null;
}

export const AutomationPage = ({ projectId }: AutomationPageProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const effectiveProjectId = projectId ?? FALLBACK_PROJECT_ID;
  const { flows, loading, refetch } = useAutomation(effectiveProjectId);
  const [refreshing, setRefreshing] = useState(false);
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState('');
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [triggeringAll, setTriggeringAll] = useState(false);
  
  const refreshAbortControllerRef = useRef<AbortController | null>(null);

  // Realtime на automation_flows отключён: сервер может ожидать колонки (напр. webhook_url),
  // которых нет в пересозданной таблице. Обновление — по кнопке «Обновить» и после действий.

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('n8n_webhook_url')
          .eq('id', effectiveProjectId)
          .abortSignal(controller.signal)
          .single();

        if (!error && data?.n8n_webhook_url) setN8nWebhookUrl(data.n8n_webhook_url);
        else setN8nWebhookUrl(N8N_DISPATCHER_URL);
      } catch (err: any) {
        if (err.name === 'AbortError' || err.message?.includes('aborted')) return;
        setN8nWebhookUrl(N8N_DISPATCHER_URL);
      }
    };
    load();
    return () => controller.abort();
  }, [effectiveProjectId]);

  const handleSaveWebhook = useCallback(async () => {
    setSavingWebhook(true);
    try {
      const { error } = await supabase.from('projects').update({ n8n_webhook_url: n8nWebhookUrl }).eq('id', effectiveProjectId);
      if (error) throw error;
      toast.success('URL вебхука сохранен');
      refetch();
    } catch {
      toast.error('Ошибка сохранения URL вебхука');
    } finally {
      setSavingWebhook(false);
    }
  }, [effectiveProjectId, n8nWebhookUrl, refetch]);

  const handleRefresh = useCallback(async () => {
    // Cancel previous request
    if (refreshAbortControllerRef.current) {
      refreshAbortControllerRef.current.abort();
    }
    refreshAbortControllerRef.current = new AbortController();
    const signal = refreshAbortControllerRef.current.signal;

    toast.info('Запрашиваю связки из n8n…');
    setRefreshing(true);
    const syncUrl = webhookFetchUrl(N8N_SYNC_URL);
    try {
      const res = await fetchWithTimeout(
        syncUrl,
        {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project_id: effectiveProjectId }),
          signal,
        },
        SYNC_FETCH_TIMEOUT_MS,
      );
      if (!res.ok) {
        let errorText = res.statusText;
        try {
          const text = await res.text();
          // Если ответ HTML (ошибка 500), пытаемся извлечь полезную информацию
          if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
            errorText = `Сервер n8n вернул ошибку ${res.status}. Возможные причины: ошибка в workflow n8n, неверные данные или сбой сервера. Проверьте логи n8n.`;
          } else {
            // Пытаемся распарсить как JSON
            try {
              const json = JSON.parse(text);
              errorText = json.error || json.message || text.substring(0, 100);
            } catch {
              errorText = text.substring(0, 200) || res.statusText;
            }
          }
        } catch (e) {
          errorText = `Ошибка ${res.status}: ${res.statusText}`;
        }
        console.error('[Обновить] Ошибка sync n8n:', res.status, errorText);
        toast.error(`Ошибка sync n8n (${res.status}): ${errorText}`);
        return;
      }
      toast.success('Связки получены из n8n. Обновляю список…');
      await refetch();
      setTimeout(() => refetch(), 2500);
    } catch (e: any) {
      if (e.name === 'AbortError' || e.message?.includes('AbortError') || e.message?.includes('aborted')) {
        return;
      }
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[Обновить] Ошибка синхронизации:', msg);
      toast.error(`Ошибка синхронизации: ${msg}`);
    } finally {
      setRefreshing(false);
    }
  }, [effectiveProjectId, refetch]);

  const triggerOneFlow = useCallback(
    async (flow: AutomationFlowRow): Promise<boolean> => {
      const targetUrl = flow.webhook_url?.trim()
        ? webhookFetchUrl(flow.webhook_url.trim())
        : webhookFetchUrl(DISPATCHER_URL);
      const body = flow.n8n_id
        ? { flow_id: flow.n8n_id, project_id: effectiveProjectId }
        : { project_id: effectiveProjectId };
      if (!flow.webhook_url && !flow.n8n_id) return false;
      try {
        const res = await fetch(targetUrl, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        return res.ok;
      } catch {
        return false;
      }
    },
    [effectiveProjectId],
  );

  const handleRunAll = useCallback(
    async (list: AutomationFlowRow[]) => {
      const runnable = list.filter((f) => f.webhook_url || f.n8n_id);
      if (!runnable.length) {
        toast.error('Нет связок с webhook_url или n8n_id. Настройте в n8n и синхронизируйте.');
        return;
      }
      setTriggeringAll(true);
      toast.info(`Запускаю ${runnable.length} связок…`);
      const results = await Promise.all(runnable.map((f) => triggerOneFlow(f)));
      const ok = results.filter(Boolean).length;
      const err = runnable.length - ok;
      if (err === 0) toast.success(`Запущено ${ok} связок`);
      else toast.warning(`Запущено ${ok} связок, ошибок: ${err}`);
      refetch();
      setTriggeringAll(false);
    },
    [triggerOneFlow, refetch],
  );

  const q = searchQuery.trim().toLowerCase();
  const filteredFlows = !flows.length ? [] : !q ? flows : flows.filter((f) => (f.flow_name ?? '').toLowerCase().includes(q));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-[16px] sm:text-2xl">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            Автоматизация
          </h2>
          <p className="text-[15px] text-muted-foreground mt-1">Управление автоматизациями</p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (refreshing) return;
            void handleRefresh();
          }}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 shrink-0 h-10 px-4 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-[15px] font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          {refreshing ? 'Обновление…' : 'Обновить'}
        </button>
      </div>

      <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[16px]">
            <Webhook className="w-5 h-5" />
            Подключение n8n
          </CardTitle>
          <CardDescription className="text-[15px]">URL вебхука n8n для дополнительных настроек</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="webhook-url" className="text-[15px]">URL вебхука</Label>
              <Input
                id="webhook-url"
                placeholder={N8N_DISPATCHER_URL}
                value={n8nWebhookUrl}
                onChange={(e) => setN8nWebhookUrl(e.target.value)}
                className="mt-2 text-[15px]"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSaveWebhook} disabled={savingWebhook} className="w-full md:w-auto text-[15px]">
                {savingWebhook ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Сохранение...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4 mr-2" /> Сохранить</>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[16px]">Актуальные связки</CardTitle>
          <CardDescription className="text-[15px]">
            Действующие связки из n8n. Нажмите «Обновить» — запрос в n8n, затем показ списка здесь (макс. 12).
          </CardDescription>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Input
              placeholder="Поиск по названию…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs text-[15px]"
            />
            {filteredFlows.length > 0 && (
              <button
                type="button"
                onClick={() => void handleRunAll(filteredFlows)}
                disabled={triggeringAll}
                aria-label={triggeringAll ? 'Запуск связок…' : `Запустить вручную все ${filteredFlows.length} связок`}
                className={cn(
                  'inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md text-[15px] font-medium',
                  'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
                  'shadow-sm hover:shadow-md transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  'disabled:opacity-70 disabled:cursor-not-allowed',
                )}
              >
                <Play className="w-4 h-4" />
                {triggeringAll ? 'Запуск…' : 'Запустить вручную'}
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : !flows.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-[15px]">Нет настроенных автоматизаций</p>
              <p className="text-[15px] mt-2">Нажмите &quot;Обновить&quot; для синхронизации</p>
            </div>
          ) : !filteredFlows.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-[15px]">По запросу «{searchQuery}» ничего не найдено</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredFlows.map((flow, index) => {
                  const isError = flow.status === 'error';
                  const isActive = flow.status === 'active';
                  return (
                    <motion.div
                      key={flow.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        'p-4 rounded-xl border bg-card/50 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg',
                        isError && 'border-red-500/50 bg-red-500/5 animate-pulse shadow-lg shadow-red-500/20',
                        isActive && 'border-emerald-500/30 bg-emerald-500/5 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500/20',
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            {getFlowIcon(flow.flow_name)}
                            <h4 className="font-bold text-xl sm:text-2xl truncate text-foreground">
                              {flow.flow_name || 'Без названия'}
                            </h4>
                            <Badge
                              className={cn(
                                'text-[14px] shrink-0',
                                isActive ? 'bg-emerald-500/15 text-emerald-600  border-emerald-500/30' : 'bg-muted text-muted-foreground border-border',
                              )}
                            >
                              {isActive ? 'ВКЛ' : 'ВЫКЛ'}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-muted-foreground">
                            {flow.last_seen != null && (
                              <p className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                Обновлено: {safeFormatDate(flow.last_seen)}
                              </p>
                            )}
                            {flow.execution_time != null && (
                              <p>Время выполнения: {flow.execution_time} с</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
