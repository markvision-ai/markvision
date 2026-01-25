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
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Sparkles,
  Instagram,
  Facebook,
  MessageCircle,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/externalSupabase';
import { FALLBACK_PROJECT_ID } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AutomationFlow {
  id: string;
  project_id: string;
  name: string;
  flow_name?: string; // Название из n8n (используется для отображения)
  description?: string;
  status: 'active' | 'inactive' | 'error' | 'running' | 'paused';
  last_run: string | null;
  last_seen?: string | null;
  execution_time?: number;
  logs?: string;
  created_at: string;
  updated_at: string;
  trigger_type?: string;
  webhook_url?: string;
  n8n_id?: string; // ID связки в n8n для запуска
}

interface AutomationPageProps {
  projectId: string | null;
}

// N8N URLs
const N8N_DISPATCHER_URL = import.meta.env.VITE_N8N_DISPATCHER_URL || 'https://n8n.zapoinov.com/webhook/execute-flow';
const N8N_SYNC_URL = 'https://n8n.zapoinov.com/webhook/sync-markvision-flows';

// Определение иконки по названию связки
const getFlowIcon = (flowName?: string) => {
  if (!flowName) return <Zap className="w-6 h-6" />;
  const nameLower = flowName.toLowerCase();
  if (nameLower.includes('whatsapp') || nameLower.includes('wa')) {
    return <MessageCircle className="w-6 h-6 text-green-500" />;
  }
  if (nameLower.includes('inst') || nameLower.includes('instagram')) {
    return <Instagram className="w-6 h-6 text-purple-500" />;
  }
  if (nameLower.includes('facebook') || nameLower.includes('fb') || nameLower.includes('meta')) {
    return <Facebook className="w-6 h-6 text-blue-500" />;
  }
  return <Zap className="w-6 h-6" />;
};

export const AutomationPage = ({ projectId }: AutomationPageProps) => {
  const effectiveProjectId = projectId || FALLBACK_PROJECT_ID;
  const [flows, setFlows] = useState<AutomationFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState('');
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [triggeringFlow, setTriggeringFlow] = useState<string | null>(null);

  // Fetch automation flows from database
  const fetchFlows = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('automation_flows')
        .select('id, project_id, name, flow_name, description, status, last_run, last_seen, execution_time, logs, created_at, updated_at, trigger_type, webhook_url, n8n_id')
        .eq('project_id', effectiveProjectId)
        .neq('status', 'archived') // Фильтруем archived связки
        .order('created_at', { ascending: false })
        .limit(12); // Показываем только 12 реальных элементов

      if (error) {
        console.error('Supabase error:', error);
        toast.error(`Ошибка загрузки: ${error.message}`);
        setFlows([]);
        return;
      }
      
      // Убеждаемся, что flow_name используется для отображения
      // Показываем все связки (фильтрация по n8n_id убрана, чтобы кнопка была доступна)
      const mappedFlows = (data || []).map(flow => ({
        ...flow,
        flow_name: flow.flow_name || flow.name,
      }));
      
      setFlows(mappedFlows);
    } catch (error: any) {
      console.error('Error fetching automation flows:', error);
      toast.error('Ошибка загрузки автоматизаций');
      setFlows([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveProjectId]);

  useEffect(() => {
    fetchFlows();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('automation-flows-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'automation_flows',
          filter: `project_id=eq.${effectiveProjectId}`
        },
        () => {
          fetchFlows();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [effectiveProjectId, fetchFlows]);

  // Fetch n8n webhook URL from project settings
  useEffect(() => {
    const fetchWebhookUrl = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('n8n_webhook_url')
          .eq('id', effectiveProjectId)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        // Устанавливаем значение из базы или URL диспетчера по умолчанию
        setN8nWebhookUrl(data?.n8n_webhook_url || N8N_DISPATCHER_URL);
      } catch (error) {
        console.error('Error fetching webhook URL:', error);
        // Устанавливаем значение по умолчанию при ошибке
        setN8nWebhookUrl(N8N_DISPATCHER_URL);
      }
    };

    fetchWebhookUrl();
  }, [effectiveProjectId]);

  // Save n8n webhook URL
  const handleSaveWebhook = async () => {
    setSavingWebhook(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ n8n_webhook_url: n8nWebhookUrl })
        .eq('id', effectiveProjectId);

      if (error) throw error;
      toast.success('URL вебхука сохранен');
    } catch (error) {
      console.error('Error saving webhook URL:', error);
      toast.error('Ошибка сохранения URL вебхука');
    } finally {
      setSavingWebhook(false);
    }
  };

  // Refresh flows list from n8n sync webhook and refetch from database
  const handleRefresh = async () => {
    setRefreshing(true);
    
    try {
      // Отправляем запрос на n8n-синхронизатор
      const response = await fetch(N8N_SYNC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: effectiveProjectId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || 'Ошибка синхронизации с n8n'}`);
      }

      // Обрабатываем JSON-ответ от n8n
      const result = await response.json();
      
      // Ждем немного для завершения синхронизации в базе
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Обновляем данные из базы автоматически
      await fetchFlows();
      
      // Проверяем результат синхронизации (новый формат ответа)
      if (result && result.status === 'success') {
        const newCount = result.newCount || 0;
        const newNames = result.newNames || [];
        
        if (newCount === 0) {
          toast.success('Обновлено. Новых автоматизаций: 0');
        } else if (newCount > 0) {
          const namesList = newNames.length > 0 ? ` (${newNames.join(', ')})` : '';
          toast.success(`Обновлено! Добавлено новых: ${newCount}${namesList}`);
        } else {
          toast.success('Синхронизация завершена');
        }
      } else {
        // Fallback для старого формата ответа
        if (result && typeof result.count === 'number') {
          const newCount = result.count;
          if (newCount === 0) {
            toast.success('Обновлено. Новых автоматизаций: 0');
          } else {
            toast.success(`Обновлено! Всего автоматизаций: ${newCount}`);
          }
        } else {
          toast.success('Синхронизация завершена');
        }
      }
    } catch (error: any) {
      console.error('Error refreshing flows:', error);
      // Выводим полный текст ошибки для диагностики
      const errorMessage = error.message || error.toString() || 'Неизвестная ошибка';
      toast.error(`Ошибка синхронизации: ${errorMessage}`);
      // Все равно обновляем данные из базы
      await fetchFlows();
    } finally {
      setRefreshing(false);
    }
  };

  // Trigger workflow manually using n8n dispatcher
  const handleTriggerFlow = async (flow: AutomationFlow) => {
    // Используем n8n_id если есть, иначе используем id из базы
    const flowIdToSend = flow.n8n_id || flow.id;
    
    if (!flowIdToSend) {
      toast.error('У связки отсутствует ID. Обновите список автоматизаций.');
      return;
    }

    setTriggeringFlow(flow.id);
    try {
      const response = await fetch(N8N_DISPATCHER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flow_id: flowIdToSend
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Ошибка запуска workflow');
      }

      toast.success('Команда на запуск отправлена');
      
      // Update last_run
      const { error } = await supabase
        .from('automation_flows')
        .update({ last_run: new Date().toISOString() })
        .eq('id', flow.id);

      if (error) console.error('Error updating last_run:', error);
      
      // Обновляем список
      await fetchFlows();
    } catch (error: any) {
      console.error('Error triggering workflow:', error);
      toast.error(`Ошибка запуска: ${error.message || 'Неизвестная ошибка'}`);
    } finally {
      setTriggeringFlow(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="shrink-0"
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
          Обновить
        </Button>
      </div>

      {/* n8n Webhook URL Card */}
      <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[16px]">
            <Webhook className="w-5 h-5" />
            Подключение n8n
          </CardTitle>
          <CardDescription className="text-[14px]">
            URL вебхука n8n для дополнительных настроек
          </CardDescription>
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
              <Button
                onClick={handleSaveWebhook}
                disabled={savingWebhook}
                className="w-full md:w-auto text-[14px]"
              >
                {savingWebhook ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Сохранить
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automation Flows List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[16px]">Актуальные связки</CardTitle>
          <CardDescription className="text-[14px]">
            Список автоматизаций из n8n (максимум 12)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : flows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm text-[14px]">Нет настроенных автоматизаций</p>
              <p className="text-sm mt-2 text-[14px]">Нажмите "Обновить" для синхронизации с n8n</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {flows.map((flow, index) => {
                  const isError = flow.status === 'error';
                  const isTriggering = triggeringFlow === flow.id;
                  const isActive = flow.status === 'active';

                  return (
                    <motion.div
                      key={flow.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "p-4 rounded-xl border bg-card/50 backdrop-blur-sm transition-all",
                        "hover:border-primary/30 hover:shadow-lg",
                        isError && "border-red-500/50 bg-red-500/5",
                        isError && "animate-pulse shadow-lg shadow-red-500/20",
                        isActive && "border-emerald-500/30 bg-emerald-500/5 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500/20"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            {getFlowIcon(flow.flow_name)}
                            <h4 className="font-bold text-[16px] truncate text-foreground">
                              {flow.flow_name || flow.name || 'Без названия'}
                            </h4>
                            <Badge 
                              className={cn(
                                "text-[14px] transition-all duration-300 relative",
                                isActive 
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-lg shadow-emerald-500/20" 
                                  : "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30"
                              )}
                            >
                              {isActive && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                              )}
                              <span className={cn(
                                "relative inline-flex items-center",
                                isActive && "animate-pulse"
                              )}>
                                {isActive ? 'ВКЛ' : 'ВЫКЛ'}
                              </span>
                            </Badge>
                          </div>
                          
                          {flow.description && (
                            <p className="text-[14px] text-muted-foreground mb-2 line-clamp-2">
                              {flow.description}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap gap-3 text-[14px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              Создано: {flow.created_at ? format(new Date(flow.created_at), 'dd.MM.yyyy HH:mm', { locale: ru }) : '—'}
                            </span>
                            {flow.last_run && (
                              <span className="flex items-center gap-1">
                                <RefreshCw className="w-3.5 h-3.5" />
                                Запуск: {format(new Date(flow.last_run), 'dd.MM.yyyy HH:mm', { locale: ru })}
                              </span>
                            )}
                          </div>

                          {flow.logs && isError && (
                            <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                              <p className="text-xs text-red-600 font-medium">Ошибка:</p>
                              <p className="text-xs text-red-500 mt-1">{flow.logs}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
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
                              "shrink-0 text-[14px] font-medium min-w-[140px]",
                              !isTriggering && "cursor-pointer hover:bg-primary/10 hover:border-primary/30 active:scale-95 opacity-100",
                              isTriggering && "opacity-70"
                            )}
                            type="button"
                            aria-label={`Запустить связку ${flow.flow_name || flow.name}`}
                          >
                            {isTriggering ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Запуск...
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Запустить вручную
                              </>
                            )}
                          </Button>
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
