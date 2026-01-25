import { useState, useEffect, useCallback } from 'react';
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
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/externalSupabase';
import { FALLBACK_PROJECT_ID } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAutomation, type AutomationFlowRow } from '@/hooks/useAutomation';

const EXECUTE_ANY_FLOW_URL = 'https://n8n.zapoinov.com/webhook/execute-any-flow';
const N8N_DISPATCHER_URL = import.meta.env.VITE_N8N_DISPATCHER_URL || EXECUTE_ANY_FLOW_URL;
const N8N_SYNC_URL = 'https://n8n.zapoinov.com/webhook/sync-markvision-flows';
const SYNC_FETCH_TIMEOUT_MS = 8_000;

function fetchWithTimeout(url: string, opts: RequestInit, ms: number): Promise<Response> {
  return Promise.race([
    fetch(url, opts),
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error('Таймаут запроса')), ms)),
  ]);
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
  const [triggeringFlow, setTriggeringFlow] = useState<string | null>(null);

  // Realtime на automation_flows отключён: сервер может ожидать колонки (напр. webhook_url),
  // которых нет в пересозданной таблице. Обновление — по кнопке «Обновить» и после действий.

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase.from('projects').select('n8n_webhook_url').eq('id', effectiveProjectId).single();
        if (!error && data?.n8n_webhook_url) setN8nWebhookUrl(data.n8n_webhook_url);
        else setN8nWebhookUrl(N8N_DISPATCHER_URL);
      } catch {
        setN8nWebhookUrl(N8N_DISPATCHER_URL);
      }
    };
    load();
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

  const handleRefresh = useCallback(() => {
    toast.info('Обновляю список…');
    setRefreshing(true);
    refetch();
    fetchWithTimeout(
      N8N_SYNC_URL,
      {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: effectiveProjectId }),
      },
      SYNC_FETCH_TIMEOUT_MS,
    )
      .then(() => {
        toast.success('Синхронизация отправлена. Список обновится через пару секунд.');
      })
      .catch((e: unknown) => {
        toast.error(`Ошибка синхронизации: ${e instanceof Error ? e.message : String(e)}`);
      })
      .finally(() => {
        setRefreshing(false);
      });
    setTimeout(() => refetch(), 3000);
  }, [effectiveProjectId, refetch]);

  const handleTriggerFlow = useCallback(async (flow: AutomationFlowRow) => {
    const n8nId = flow.n8n_id?.trim();
    if (!n8nId) {
      toast.error('У связки отсутствует n8n_id.');
      return;
    }
    const name = flow.flow_name?.trim() || 'Без названия';
    setTriggeringFlow(flow.id);
    try {
      await fetch(EXECUTE_ANY_FLOW_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flow_id: n8nId }),
      });
      toast.success(`Связка ${name} запущена успешно!`);
      try {
        await supabase.from('automation_flows').update({ last_run: new Date().toISOString() }).eq('id', flow.id).select('id');
      } catch {
        /* игнорируем ошибку обновления last_run */
      }
    } catch (e: unknown) {
      toast.error(`Ошибка запуска: ${e instanceof Error ? e.message : 'Неизвестная ошибка'}`);
    } finally {
      setTriggeringFlow(null);
      refetch();
    }
  }, [refetch]);

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
          <p className="text-[14px] text-muted-foreground mt-1">Управление автоматизациями</p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (refreshing) return;
            handleRefresh();
          }}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 shrink-0 h-10 px-4 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none"
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
          <CardDescription className="text-[14px]">URL вебхука n8n для дополнительных настроек</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="webhook-url" className="text-[14px]">URL вебхука</Label>
              <Input
                id="webhook-url"
                placeholder={N8N_DISPATCHER_URL}
                value={n8nWebhookUrl}
                onChange={(e) => setN8nWebhookUrl(e.target.value)}
                className="mt-2 text-[14px]"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSaveWebhook} disabled={savingWebhook} className="w-full md:w-auto text-[14px]">
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
          <CardDescription className="text-[14px]">Список автоматизаций (максимум 12)</CardDescription>
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
              <p className="text-sm text-[14px]">Нет настроенных автоматизаций</p>
              <p className="text-sm mt-2 text-[14px]">Нажмите &quot;Обновить&quot; для синхронизации</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {flows.map((flow, index) => {
                  const isError = flow.status === 'error';
                  const isActive = flow.status === 'active';
                  const isTriggering = triggeringFlow === flow.id;
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
                                'text-[13px] shrink-0',
                                isActive ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-muted text-muted-foreground border-border',
                              )}
                            >
                              {isActive ? 'ВКЛ' : 'ВЫКЛ'}
                            </Badge>
                          </div>
                          {flow.last_run != null && (
                            <p className="text-[13px] text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              Последний запуск: {safeFormatDate(flow.last_run)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              void handleTriggerFlow(flow);
                            }}
                            className={cn(
                              'inline-flex items-center justify-center gap-2 shrink-0 min-w-[140px] h-9 px-3 rounded-md text-[14px] font-medium',
                              'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
                              'shadow-sm hover:shadow-md transition-all cursor-pointer',
                              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                              isTriggering && 'opacity-90',
                            )}
                            aria-label={`Запустить связку ${flow.flow_name || 'Без названия'}`}
                          >
                            {isTriggering ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> Запуск…</>
                            ) : (
                              <><Play className="w-4 h-4" /> Запустить вручную</>
                            )}
                          </button>
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
