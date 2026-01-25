import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
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
  Facebook
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/externalSupabase';
import { toast } from 'sonner';

interface AutomationFlow {
  id: string;
  project_id: string;
  name: string;
  flow_name?: string; // Название из n8n (СТРОГО используется для отображения)
  description?: string;
  status: 'active' | 'inactive' | 'error' | 'running' | 'paused';
  last_run: string | null;
  last_seen?: string | null; // Время последнего обновления из n8n
  execution_time?: number;
  logs?: string;
  created_at: string;
  updated_at: string;
  trigger_type?: string;
  webhook_url?: string; // URL для ручного запуска
}

interface AutomationPageProps {
  projectId: string | null;
}

// GlowBadge component for status indicators
const GlowBadge = ({ status, children }: { status: AutomationFlow['status']; children: React.ReactNode }) => {
  const statusConfig = {
    active: {
      className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-lg shadow-emerald-500/20',
      label: 'Работает'
    },
    error: {
      className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 shadow-lg shadow-red-500/20',
      label: 'Ошибка'
    },
    paused: {
      className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30',
      label: 'Пауза'
    },
    inactive: {
      className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30',
      label: 'Неактивно'
    },
    running: {
      className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 shadow-lg shadow-blue-500/20',
      label: 'Выполняется'
    }
  };

  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
      config.className
    )}>
      {children || config.label}
    </span>
  );
};

const getStatusIcon = (status: AutomationFlow['status']) => {
  switch (status) {
    case 'active':
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    case 'error':
      return <XCircle className="w-4 h-4 text-red-600" />;
    case 'running':
      return <Clock className="w-4 h-4 text-blue-600 animate-spin" />;
    default:
      return <AlertCircle className="w-4 h-4 text-gray-600" />;
  }
};

const getTriggerTypeLabel = (triggerType?: string) => {
  if (!triggerType) return 'Не указан';
  const types: Record<string, string> = {
    schedule: 'По расписанию',
    webhook: 'Webhook',
    manual: 'Ручной запуск',
    event: 'По событию'
  };
  return types[triggerType] || triggerType;
};

// Определение иконки по названию связки
const getFlowIcon = (flowName?: string) => {
  if (!flowName) return <Zap className="w-5 h-5" />;
  const nameLower = flowName.toLowerCase();
  if (nameLower.includes('inst') || nameLower.includes('instagram')) {
    return <Instagram className="w-5 h-5 text-purple-500" />;
  }
  if (nameLower.includes('facebook') || nameLower.includes('fb') || nameLower.includes('meta')) {
    return <Facebook className="w-5 h-5 text-blue-500" />;
  }
  return <Zap className="w-5 h-5" />;
};

export const AutomationPage = ({ projectId }: AutomationPageProps) => {
  const [flows, setFlows] = useState<AutomationFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState('');
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [triggeringFlow, setTriggeringFlow] = useState<string | null>(null);

  // Fetch automation flows from database
  const fetchFlows = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('automation_flows')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFlows(data || []);
    } catch (error) {
      console.error('Error fetching automation flows:', error);
      toast.error('Ошибка загрузки автоматизаций');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

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
          filter: `project_id=eq.${projectId}`
        },
        () => {
          fetchFlows();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, fetchFlows]);

  // Fetch n8n webhook URL from project settings
  useEffect(() => {
    if (!projectId) return;

    const fetchWebhookUrl = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('n8n_webhook_url')
          .eq('id', projectId)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        if (data?.n8n_webhook_url) {
          setN8nWebhookUrl(data.n8n_webhook_url);
        }
      } catch (error) {
        console.error('Error fetching webhook URL:', error);
      }
    };

    fetchWebhookUrl();
  }, [projectId]);

  // Save n8n webhook URL
  const handleSaveWebhook = async () => {
    if (!projectId) {
      toast.error('Выберите проект');
      return;
    }

    setSavingWebhook(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ n8n_webhook_url: n8nWebhookUrl })
        .eq('id', projectId);

      if (error) throw error;
      toast.success('URL вебхука сохранен');
    } catch (error) {
      console.error('Error saving webhook URL:', error);
      toast.error('Ошибка сохранения URL вебхука');
    } finally {
      setSavingWebhook(false);
    }
  };

  // Activate workflow
  const handleActivateFlow = async (flow: AutomationFlow) => {
    if (!n8nWebhookUrl) {
      toast.error('Сначала настройте URL вебхука n8n');
      return;
    }

    setTriggeringFlow(flow.id);
    try {
      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'activate_flow',
          flow_id: flow.id,
        project_id: projectId,
          flow_name: flow.name
        })
      });

      if (!response.ok) throw new Error('Ошибка активации workflow');

      const flowDisplayName = flow.flow_name || 'Workflow';
      toast.success(`Workflow "${flowDisplayName}" активирован`);
      
      // Update status in database
      const { error } = await supabase
        .from('automation_flows')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', flow.id);

      if (error) console.error('Error updating status:', error);
      
      // Refresh flows list
      const { data } = await supabase
        .from('automation_flows')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (data) setFlows(data);
    } catch (error) {
      console.error('Error activating workflow:', error);
      toast.error('Ошибка активации workflow');
    } finally {
      setTriggeringFlow(null);
    }
  };

  // Refresh flows list from n8n sync webhook
  const handleRefresh = async () => {
    if (!projectId) {
      toast.error('Выберите проект');
      return;
    }

    setRefreshing(true);
    try {
      // Отправляем POST на n8n синхронизатор
      const syncWebhookUrl = 'https://n8n.zapoinov.com/webhook-test/sync-markvision-flows';
      const response = await fetch(syncWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: projectId
        })
      });

      if (!response.ok) throw new Error('Ошибка синхронизации');

      toast.success('Список автоматизаций синхронизирован');
      
      // Обновляем список из базы данных после синхронизации
      await fetchFlows();
    } catch (error) {
      console.error('Error refreshing flows:', error);
      toast.error('Ошибка синхронизации автоматизаций');
    } finally {
      setRefreshing(false);
    }
  };

  // Trigger workflow manually using webhook_url from database
  const handleTriggerFlow = async (flow: AutomationFlow) => {
    if (!flow.webhook_url) {
      toast.error('Для ручного запуска добавьте узел Webhook в эту связку n8n');
      return;
    }

    setTriggeringFlow(flow.id);
    try {
      const response = await fetch(flow.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflow_id: flow.id,
        project_id: projectId,
          trigger_type: 'manual'
        })
      });

      if (!response.ok) throw new Error('Ошибка запуска workflow');

      const flowDisplayName = flow.flow_name || 'Workflow';
      toast.success(`Workflow "${flowDisplayName}" запущен`);
      
      // Update last_run
      const { error } = await supabase
        .from('automation_flows')
        .update({ last_run: new Date().toISOString() })
        .eq('id', flow.id);

      if (error) console.error('Error updating last_run:', error);
    } catch (error) {
      console.error('Error triggering workflow:', error);
      toast.error('Ошибка запуска workflow');
    } finally {
      setTriggeringFlow(null);
    }
  };

  if (!projectId) {
    return (
      <div className="bg-card border rounded-xl p-12 text-center">
        <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Выберите проект</h3>
        <p className="text-muted-foreground">Для настройки автоматизации выберите проект</p>
      </div>
    );
  }

  const hasErrors = flows.some(f => f.status === 'error');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            Автоматизация
          </h2>
          <p className="text-muted-foreground mt-1">Управление n8n workflows и автоматизациями</p>
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
          <CardTitle className="flex items-center gap-2">
            <Webhook className="w-5 h-5" />
            Подключение n8n
          </CardTitle>
          <CardDescription>
            Укажите URL вебхука n8n для запуска автоматизаций вручную
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="webhook-url">URL вебхука</Label>
                <Input
                id="webhook-url"
                  placeholder="https://n8n.example.com/webhook/..."
                  value={n8nWebhookUrl}
                  onChange={(e) => setN8nWebhookUrl(e.target.value)}
                className="mt-2"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleSaveWebhook}
                disabled={savingWebhook}
                className="w-full md:w-auto"
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
          <CardTitle>Список автоматизаций</CardTitle>
          <CardDescription>
            Все workflows из таблицы automation_flows
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
              <p>Нет настроенных автоматизаций</p>
              <p className="text-sm mt-2">Автоматизации появятся после настройки n8n</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {flows.map((flow, index) => {
                  const isError = flow.status === 'error';
                  const isTriggering = triggeringFlow === flow.id;

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
                        flow.status === 'active' && "border-emerald-500/30 bg-emerald-500/5 shadow-lg shadow-emerald-500/20"
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            {getFlowIcon(flow.flow_name)}
                            {getStatusIcon(flow.status)}
                            <h4 className="font-semibold truncate text-foreground">
                              {flow.flow_name || 'Без названия'}
                            </h4>
                            <GlowBadge status={flow.status} />
                              </div>
                              
                          {flow.description && (
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {flow.description}
                                </p>
                              )}
                              
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Тип: {getTriggerTypeLabel(flow.trigger_type)}
                            </span>
                            {flow.last_run && (
                              <span className="flex items-center gap-1">
                                <RefreshCw className="w-3 h-3" />
                                Последний запуск: {format(new Date(flow.last_run), 'dd.MM.yyyy HH:mm', { locale: ru })}
                              </span>
                            )}
                            {flow.execution_time && (
                              <span>
                                Время выполнения: {flow.execution_time}мс
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
                        
                        <div className="flex items-center gap-2">
                          {flow.status !== 'active' && (
                            <Button
                              size="sm"
                              onClick={() => handleActivateFlow(flow)}
                              disabled={!n8nWebhookUrl || isTriggering}
                              className="shrink-0 bg-primary hover:bg-primary/90"
                            >
                              {isTriggering ? (
                                <>
                                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                  Активация...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Активировать
                                </>
                              )}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTriggerFlow(flow)}
                            disabled={!flow.webhook_url || isTriggering}
                            className="shrink-0"
                          >
                            {isTriggering ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
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
