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
  const effectiveProjectId = projectId ?? null;
  const { flows, loading, refetch } = useAutomation(effectiveProjectId);
  const [refreshing, setRefreshing] = useState(false);
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState('');
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [triggeringAll, setTriggeringAll] = useState(false);

  const refreshAbortControllerRef = useRef<AbortController | null>(null);

  // Realtime на automation_flows отключён: сервер может ожидать колонки (напр. webhook_url),
  // которых нет в пересозданной таблице. Обновление — по кнопке «Обновить» и после действий.

  useEffect(() => {
    if (!effectiveProjectId) {
      setN8nWebhookUrl(N8N_DISPATCHER_URL);
      return;
    }
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
    if (!effectiveProjectId) {
      toast.error('Сначала выберите проект');
      return;
    }
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
    if (!effectiveProjectId) {
      toast.error('Сначала выберите проект');
      return;
    }
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
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
        <div>
          <h2 className="text-3xl font-black flex items-center gap-4 text-white uppercase tracking-tight">
            <div className="w-14 h-14 rounded-2xl bg-[#955251]/20 flex items-center justify-center border border-[#955251]/20 shadow-inner">
              <Zap className="w-7 h-7 text-[#B57170]" />
            </div>
            n8n Automation
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-3 opacity-40">
            Управление автоматизациями и сценариями
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          className="h-14 bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-2xl transition-all font-black uppercase tracking-widest text-[10px] gap-3 px-8"
        >
          <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          {refreshing ? 'Обновление…' : 'Синхронизировать'}
        </Button>
      </div>

      <Card className="bg-[#020617]/60 backdrop-blur-3xl border border-white/10 shadow-interstellar rounded-[32px] overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#955251]/5 blur-[100px] rounded-full -mr-32 -mt-32 group-hover:bg-[#955251]/10 transition-colors duration-700" />
        <CardHeader className="p-10 border-b border-white/5 relative z-10">
          <CardTitle className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-4">
            <Webhook className="w-6 h-6 text-[#B57170]" />
            Подключение n8n
          </CardTitle>
          <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40 mt-2">
            URL вебхука n8n для координации сценариев
          </CardDescription>
        </CardHeader>
        <CardContent className="p-10 relative z-10">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <Label htmlFor="webhook-url" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">URL вебхука</Label>
              <Input
                id="webhook-url"
                placeholder={N8N_DISPATCHER_URL}
                value={n8nWebhookUrl}
                onChange={(e) => setN8nWebhookUrl(e.target.value)}
                className="h-14 bg-white/5 border-white/10 rounded-2xl font-mono text-white focus:border-[#955251]/50 transition-all text-sm px-5"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleSaveWebhook}
                disabled={savingWebhook}
                className="h-14 bg-[#955251] hover:bg-[#B57170] text-white rounded-2xl shadow-lg shadow-[#955251]/20 transition-all hover:scale-[1.02] active:scale-[0.98] font-black uppercase tracking-widest text-[10px] gap-3 px-10"
              >
                {savingWebhook ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Сохранить
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
          <div className="space-y-1">
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Актуальные связки</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">
              Сценарии, импортированные из вашего n8n
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Input
              placeholder="Поиск по названию…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full md:w-64 bg-white/5 border-white/10 rounded-xl text-white text-[11px] px-5 font-black uppercase tracking-widest"
            />
            {filteredFlows.length > 0 && (
              <Button
                onClick={() => void handleRunAll(filteredFlows)}
                disabled={triggeringAll}
                className="h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all font-black uppercase tracking-widest text-[10px] gap-3 px-6"
              >
                <Play className="w-4 h-4" />
                {triggeringAll ? 'Запуск…' : 'Запустить все'}
              </Button>
            )}
          </div>
        </div>

        <div className="px-4">
          {loading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full bg-white/5 rounded-3xl" />
              ))}
            </div>
          ) : !flows.length ? (
            <div className="text-center py-20 bg-white/5 rounded-[40px] border border-dashed border-white/10">
              <Zap className="w-16 h-16 mx-auto mb-6 text-white/10" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Нет настроенных автоматизаций</p>
              <Button variant="link" onClick={handleRefresh} className="mt-4 text-[#B57170] font-black uppercase tracking-widest text-[10px]">
                Синхронизировать сейчас
              </Button>
            </div>
          ) : !filteredFlows.length ? (
            <div className="text-center py-20">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">По запросу «{searchQuery}» ничего не найдено</p>
            </div>
          ) : (
            <div className="grid gap-5">
              <AnimatePresence mode="popLayout">
                {filteredFlows.map((flow, index) => {
                  const isError = flow.status === 'error';
                  const isActive = flow.status === 'active';
                  return (
                    <motion.div
                      key={flow.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        'group p-6 rounded-[32px] border bg-[#020617]/40 backdrop-blur-3xl transition-all duration-500 hover:border-white/20 hover:bg-[#020617]/60 shadow-interstellar',
                        isError ? 'border-red-500/20 bg-red-500/5' : 'border-white/5',
                        isActive && 'border-blue-500/20 bg-blue-500/5'
                      )}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                          <div className={cn(
                            "w-16 h-16 rounded-[24px] flex items-center justify-center border shadow-inner group-hover:scale-110 transition-transform duration-500",
                            isActive ? "bg-blue-500/20 border-blue-500/20 text-blue-400" : "bg-white/5 border-white/10 text-white/40"
                          )}>
                            {getFlowIcon(flow.flow_name)}
                          </div>
                          <div>
                            <div className="flex items-center gap-4">
                              <h4 className="font-black text-xl text-white uppercase tracking-tight truncate max-w-[200px] sm:max-w-md">
                                {flow.flow_name || 'Без названия'}
                              </h4>
                              <Badge
                                className={cn(
                                  'text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border',
                                  isActive ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-white/5 text-muted-foreground border-white/5',
                                )}
                              >
                                {isActive ? 'ACTIVE' : 'INACTIVE'}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3">
                              {flow.last_seen != null && (
                                <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">
                                  <Clock className="w-3.5 h-3.5" />
                                  Обновлено: {safeFormatDate(flow.last_seen)}
                                </p>
                              )}
                              {flow.execution_time != null && (
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">
                                  Execution: {flow.execution_time}s
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => triggerOneFlow(flow)}
                            className="h-12 bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-2xl transition-all font-black uppercase tracking-widest text-[10px] px-6"
                          >
                            <Play className="w-3.5 h-3.5 mr-2" /> Run
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
