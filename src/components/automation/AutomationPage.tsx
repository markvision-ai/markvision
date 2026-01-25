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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/externalSupabase';
import { FALLBACK_PROJECT_ID } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAutomation, type AutomationFlowRow } from '@/hooks/useAutomation';

const N8N_DISPATCHER_URL = import.meta.env.VITE_N8N_DISPATCHER_URL || 'https://n8n.zapoinov.com/webhook/execute-flow';
const N8N_SYNC_URL = 'https://n8n.zapoinov.com/webhook/sync-markvision-flows';

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
      await refetch();
    } catch {
      toast.error('Ошибка сохранения URL вебхука');
    } finally {
      setSavingWebhook(false);
    }
  }, [effectiveProjectId, n8nWebhookUrl, refetch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetch(N8N_SYNC_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: effectiveProjectId }),
      });
      toast.info('Запрос на синхронизацию отправлен...');
    } catch (e: unknown) {
      toast.error(`Ошибка отправки: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setRefreshing(false);
    }
    setTimeout(() => refetch(), 3000);
  }, [effectiveProjectId, refetch]);

  const handleTriggerFlow = useCallback(async (flow: AutomationFlowRow) => {
    const url = flow.webhook_url?.trim();
    if (!url) {
      toast.error('Нет вебхука для запуска');
      return;
    }
    const flowId = flow.id;
    if (!flowId) {
      toast.error('У связки отсутствует ID.');
      return;
    }
    setTriggeringFlow(flowId);
    try {
      const res = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flow_id: flowId }),
      });
      if (!res.ok) throw new Error(await res.text().catch(() => 'Ошибка запуска'));
      toast.success('Команда на запуск отправлена');
      await supabase.from('automation_flows').update({ last_run: new Date().toISOString() }).eq('id', flowId).select('id');
      await refetch();
    } catch (e: unknown) {
      toast.error(`Ошибка запуска: ${e instanceof Error ? e.message : 'Неизвестная ошибка'}`);
    } finally {
      setTriggeringFlow(null);
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
          <p className="text-[14px] text-muted-foreground mt-1">Управление n8n workflows и автоматизациями</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="shrink-0">
          <RefreshCw className={cn('w-4 h-4 mr-2', refreshing && 'animate-spin')} />
          Обновить
        </Button>
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
          <CardDescription className="text-[14px]">Список автоматизаций из n8n (максимум 12)</CardDescription>
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
              <p className="text-sm mt-2 text-[14px]">Нажмите &quot;Обновить&quot; для синхронизации с n8n</p>
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
                          <div className="flex items-center gap-3 mb-2">
                            {getFlowIcon(flow.flow_name)}
                            <h4 className="font-bold text-[16px] truncate text-foreground">
                              {flow.flow_name || 'Без названия'}
                            </h4>
                            <Badge
                              className={cn(
                                'text-[14px] transition-all duration-300 relative',
                                isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30',
                              )}
                            >
                              {isActive && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />}
                              <span className={cn('relative inline-flex items-center', isActive && 'animate-pulse')}>
                                {isActive ? 'ВКЛ' : 'ВЫКЛ'}
                              </span>
                            </Badge>
                          </div>
                          <p className="text-[14px] text-muted-foreground mb-2 line-clamp-2">
                            {flow.description?.trim() || 'Нет описания'}
                          </p>
                          <div className="flex flex-wrap gap-3 text-[14px] text-muted-foreground">
                            {flow.last_run != null && (
                              <span className="flex items-center gap-1">
                                <RefreshCw className="w-3.5 h-3.5" />
                                Запуск: {safeFormatDate(flow.last_run)}
                              </span>
                            )}
                            {flow.execution_time != null && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                Время: {flow.execution_time} с
                              </span>
                            )}
                            {flow.last_seen != null && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                Обновлено: {safeFormatDate(flow.last_seen)}
                              </span>
                            )}
                            {flow.trigger_type && (
                              <span className="flex items-center gap-1">
                                Триггер: {flow.trigger_type}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!flow.webhook_url?.trim() ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled
                                      className="shrink-0 text-[14px] font-medium min-w-[140px] opacity-70"
                                      type="button"
                                      aria-label="Нет вебхука для запуска"
                                    >
                                      <Play className="w-4 h-4 mr-2" /> Запустить вручную
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>Нет вебхука для запуска</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleTriggerFlow(flow);
                              }}
                              disabled={isTriggering}
                              className={cn(
                                'shrink-0 text-[14px] font-medium min-w-[140px]',
                                !isTriggering && 'cursor-pointer hover:bg-primary/10 hover:border-primary/30 active:scale-95 opacity-100',
                                isTriggering && 'opacity-70',
                              )}
                              type="button"
                              aria-label={`Запустить связку ${flow.flow_name || 'Без названия'}`}
                            >
                              {isTriggering ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Запуск...</>
                              ) : (
                                <><Play className="w-4 h-4 mr-2" /> Запустить вручную</>
                              )}
                            </Button>
                          )}
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
