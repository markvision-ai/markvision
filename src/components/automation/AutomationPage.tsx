import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Zap,
  Bot,
  Send,
  Bell,
  Users,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  MessageCircle,
  Webhook,
  RefreshCw,
  Play,
  History,
  Plus,
  Link2,
  Heart,
  Timer,
  Sparkles,
  Settings2,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/externalSupabase';
import { toast } from 'sonner';
import { useAutomationRules, AutomationRule, AutomationLog } from '@/hooks/useAutomationRules';

interface AutomationPageProps {
  projectId: string | null;
}

const actionTypeIcons: Record<string, React.ReactNode> = {
  assign: <Users className="w-4 h-4" />,
  telegram: <Send className="w-4 h-4" />,
  whatsapp_ai: <MessageCircle className="w-4 h-4" />,
  webhook: <Webhook className="w-4 h-4" />,
  reminder: <Bell className="w-4 h-4" />,
  status_change: <ArrowRight className="w-4 h-4" />,
  diagnostic_link: <Link2 className="w-4 h-4" />,
  lost_recovery: <Heart className="w-4 h-4" />
};

const actionTypeLabels: Record<string, string> = {
  assign: 'Назначение',
  telegram: 'Telegram',
  whatsapp_ai: 'WhatsApp AI',
  webhook: 'Webhook (n8n)',
  reminder: 'Напоминание',
  status_change: 'Смена статуса',
  diagnostic_link: 'Ссылка на диагностику',
  lost_recovery: 'Реанимация'
};

const triggerTypeLabels: Record<string, string> = {
  new_lead: 'Новый лид',
  status_change: 'Смена статуса',
  time_based: 'По времени',
  appointment_reminder: 'Напоминание о записи'
};

const statusLabels: Record<string, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  no_answer: 'Недозвон',
  appointment: 'Записан',
  diagnostics_completed: 'Диагностика пройдена',
  paid: 'Оплачено',
  cancelled: 'Отказ'
};

const TRIGGER_CONFIGS = [
  {
    id: 'diagnostic_link',
    name: 'Diagnostic Link',
    description: 'При смене статуса на "В работе" — отправить ссылку на диагностику',
    trigger: 'status_change',
    triggerStatus: 'in_progress',
    action: 'webhook',
    icon: Link2,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'auto_move',
    name: 'Auto-Move',
    description: 'Если diagnostics_completed — автоперемещение в "Записан"',
    trigger: 'status_change',
    triggerStatus: 'diagnostics_completed',
    action: 'status_change',
    icon: ArrowRight,
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'reminder',
    name: 'Reminder',
    description: 'За 24 часа до записи — напоминание клиенту',
    trigger: 'appointment_reminder',
    action: 'webhook',
    icon: Timer,
    color: 'from-amber-500 to-orange-500'
  },
  {
    id: 'lost_recovery',
    name: 'Lost Recovery',
    description: 'Отказ — реанимация через 30 дней',
    trigger: 'status_change',
    triggerStatus: 'cancelled',
    action: 'reminder',
    icon: Heart,
    color: 'from-red-500 to-pink-500'
  }
];

export const AutomationPage = ({ projectId }: AutomationPageProps) => {
  const { rules, logs, loading, toggleRule, createRule, fetchLogs } = useAutomationRules(projectId);
  const [activeTab, setActiveTab] = useState('triggers');
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [realtimeLogs, setRealtimeLogs] = useState<AutomationLog[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState('');

  // Realtime subscription for logs
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel('automation-logs-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'automation_logs',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('🤖 New automation log:', payload.new);
          const newLog = payload.new as any;
          setRealtimeLogs(prev => [newLog, ...prev].slice(0, 100));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const handleLoadLogs = async () => {
    setLoadingLogs(true);
    await fetchLogs(100);
    setLoadingLogs(false);
  };

  useEffect(() => {
    if (activeTab === 'logs') {
      handleLoadLogs();
    }
  }, [activeTab, projectId]);

  // Merge realtime logs with fetched logs
  const allLogs = [...realtimeLogs, ...logs.filter(l => !realtimeLogs.find(rl => rl.id === l.id))];

  const getLogStatusIcon = (result: string) => {
    switch (result) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'skipped':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const handleQuickSetup = async (config: typeof TRIGGER_CONFIGS[0]) => {
    if (!projectId) return;

    try {
      const actionConfig: Record<string, any> = {};
      
      if (config.action === 'webhook' && n8nWebhookUrl) {
        actionConfig.webhook_url = n8nWebhookUrl;
      }
      
      if (config.action === 'status_change') {
        actionConfig.target_status = 'appointment';
      }
      
      if (config.action === 'reminder') {
        actionConfig.delay_days = 30;
        actionConfig.message_template = 'Здравствуйте! Как ваше самочувствие? Мы готовы помочь вам вернуться к здоровью.';
      }

      await createRule({
        project_id: projectId,
        name: config.name,
        description: config.description,
        trigger_type: config.trigger,
        trigger_status: config.triggerStatus || null,
        action_type: config.action,
        action_config: actionConfig,
        conditions: {},
        execution_order: rules.length,
        is_active: true
      });

      toast.success(`Триггер "${config.name}" создан!`);
    } catch (error) {
      console.error('Error creating rule:', error);
      toast.error('Ошибка создания триггера');
    }
  };

  // Simulated trigger test for UI preview
  const handleTestTrigger = async (config: typeof TRIGGER_CONFIGS[0]) => {
    if (!projectId) {
      toast.error('Выберите проект');
      return;
    }

    toast.loading('Тестируем триггер...');

    // Log the test execution
    try {
      await supabase.from('automation_logs').insert({
        project_id: projectId,
        action_type: config.action,
        action_result: 'success',
        action_data: { test: true, trigger: config.id }
      });

      toast.dismiss();
      toast.success(`Тест триггера "${config.name}" выполнен!`);
    } catch (error) {
      toast.dismiss();
      toast.error('Ошибка тестирования');
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

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            Интеллект системы
          </h2>
          <p className="text-muted-foreground mt-1">Автоматизация CRM и AI-триггеры</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-gradient-to-r from-primary/20 to-accent/20 text-primary border-0">
            {rules.filter(r => r.is_active).length} активных
          </Badge>
        </div>
      </div>

      {/* n8n Webhook URL Card */}
      <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Webhook className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Подключение n8n</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Укажите URL вебхука n8n для отправки триггеров
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="https://n8n.example.com/webhook/..."
                  value={n8nWebhookUrl}
                  onChange={(e) => setN8nWebhookUrl(e.target.value)}
                  className="max-w-md"
                />
                <Button variant="outline" size="icon">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="triggers" className="flex-1 md:flex-none">
            <Zap className="w-4 h-4 mr-2" />
            Триггеры
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex-1 md:flex-none">
            <Bot className="w-4 h-4 mr-2" />
            Правила
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex-1 md:flex-none">
            <History className="w-4 h-4 mr-2" />
            Логи
          </TabsTrigger>
        </TabsList>

        {/* Triggers Tab */}
        <TabsContent value="triggers" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TRIGGER_CONFIGS.map((config, index) => {
              const existingRule = rules.find(r => r.name === config.name);
              const IconComponent = config.icon;

              return (
                <motion.div
                  key={config.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={cn(
                    "overflow-hidden transition-all hover:shadow-lg",
                    existingRule?.is_active && "ring-2 ring-primary/50"
                  )}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center",
                            config.color
                          )}>
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{config.name}</CardTitle>
                            <CardDescription className="text-xs mt-0.5">
                              {triggerTypeLabels[config.trigger]}
                              {config.triggerStatus && ` → ${statusLabels[config.triggerStatus]}`}
                            </CardDescription>
                          </div>
                        </div>
                        {existingRule && (
                          <Switch
                            checked={existingRule.is_active}
                            onCheckedChange={(checked) => toggleRule(existingRule.id, checked)}
                          />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {config.description}
                      </p>
                      <div className="flex gap-2">
                        {existingRule ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestTrigger(config)}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Тест
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleQuickSetup(config)}
                            className={cn("bg-gradient-to-r", config.color)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Активировать
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Активные правила</CardTitle>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Создать правило
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <AnimatePresence mode="popLayout">
                  {rules.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Нет настроенных правил автоматизации</p>
                      <p className="text-sm mt-2">Активируйте триггеры на вкладке выше</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {rules.map((rule, index) => (
                        <motion.div
                          key={rule.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                          className={cn(
                            "p-4 rounded-xl border bg-card/50",
                            "hover:border-primary/30 transition-all",
                            rule.is_active && "border-primary/20 bg-primary/5"
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <div className={cn(
                                  "p-1.5 rounded-lg",
                                  rule.is_active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                                )}>
                                  {actionTypeIcons[rule.action_type] || <Zap className="w-4 h-4" />}
                                </div>
                                <h4 className="font-medium truncate">{rule.name}</h4>
                                <Badge className={cn(
                                  rule.is_active 
                                    ? "bg-green-500/20 text-green-500 border-0" 
                                    : "bg-muted text-muted-foreground"
                                )}>
                                  {rule.is_active ? 'Активно' : 'Выключено'}
                                </Badge>
                              </div>
                              
                              {rule.description && (
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                  {rule.description}
                                </p>
                              )}
                              
                              <div className="flex flex-wrap gap-2 text-xs">
                                <Badge variant="outline" className="gap-1">
                                  <Play className="w-3 h-3" />
                                  {triggerTypeLabels[rule.trigger_type] || rule.trigger_type}
                                </Badge>
                                
                                {rule.trigger_status && (
                                  <Badge variant="outline">
                                    Статус: {statusLabels[rule.trigger_status] || rule.trigger_status}
                                  </Badge>
                                )}
                                
                                <Badge variant="outline" className="gap-1">
                                  {actionTypeIcons[rule.action_type]}
                                  {actionTypeLabels[rule.action_type] || rule.action_type}
                                </Badge>
                              </div>
                            </div>
                            
                            <Switch
                              checked={rule.is_active}
                              onCheckedChange={(checked) => toggleRule(rule.id, checked)}
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    История выполнения
                  </CardTitle>
                  <CardDescription>Логи автоматизаций в реальном времени</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLoadLogs}
                  disabled={loadingLogs}
                >
                  <RefreshCw className={cn("w-4 h-4 mr-2", loadingLogs && "animate-spin")} />
                  Обновить
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                {loadingLogs ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : allLogs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Нет записей выполнения</p>
                    <p className="text-sm mt-2">Логи появятся после срабатывания триггеров</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {allLogs.map((log, index) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className={cn(
                          "p-3 rounded-lg border bg-card/30 text-sm",
                          log.action_result === 'success' && "border-l-4 border-l-green-500",
                          log.action_result === 'failed' && "border-l-4 border-l-red-500"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {getLogStatusIcon(log.action_result)}
                            <span className="font-medium">
                              {actionTypeLabels[log.action_type] || log.action_type}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(log.executed_at), 'dd.MM.yyyy HH:mm:ss', { locale: ru })}
                          </span>
                        </div>
                        
                        <div className="mt-1 text-muted-foreground text-xs">
                          {log.lead && (
                            <span>Лид: {log.lead.name || log.lead.phone || 'Без имени'}</span>
                          )}
                          {log.rule && (
                            <span className="ml-2">• Правило: {log.rule.name}</span>
                          )}
                        </div>
                        
                        {log.error_message && (
                          <p className="mt-1 text-xs text-red-500">{log.error_message}</p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
