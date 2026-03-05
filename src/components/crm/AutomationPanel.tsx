import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAutomationRules, AutomationRule, AutomationLog } from '@/hooks/useAutomationRules';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
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
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AutomationPanelProps {
  projectId: string | null;
}

const actionTypeIcons: Record<string, React.ReactNode> = {
  assign: <Users className="w-4 h-4" />,
  telegram: <Send className="w-4 h-4" />,
  whatsapp_ai: <MessageCircle className="w-4 h-4" />,
  webhook: <Webhook className="w-4 h-4" />,
  reminder: <Bell className="w-4 h-4" />,
  status_change: <ArrowRight className="w-4 h-4" />
};

const actionTypeLabels: Record<string, string> = {
  assign: 'Назначение',
  telegram: 'Telegram',
  whatsapp_ai: 'WhatsApp AI',
  webhook: 'Webhook',
  reminder: 'Напоминание',
  status_change: 'Смена статуса'
};

const triggerTypeLabels: Record<string, string> = {
  new_lead: 'Новый лид',
  status_change: 'Смена статуса',
  time_based: 'По времени'
};

const statusLabels: Record<string, string> = {
  new: 'Новый лид',
  in_progress: 'В работе',
  no_answer: 'Без ответа',
  appointment: 'Записан',
  invoiced: 'Счет выставлен',
  paid: 'Оплачен',
  cancelled: 'Отказ'
};

export const AutomationPanel = ({ projectId }: AutomationPanelProps) => {
  const { rules, logs, loading, toggleRule, fetchLogs } = useAutomationRules(projectId);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [activeTab, setActiveTab] = useState('rules');
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleLoadLogs = async () => {
    setLoadingLogs(true);
    await fetchLogs(50);
    setLoadingLogs(false);
  };

  if (loading) {
    return (
      <Card className="bg-white/5 backdrop-blur-2xl shadow-interstellar border border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Автоматизация
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const getRuleStatusBadge = (rule: AutomationRule) => {
    if (rule.is_active) {
      return <Badge className="bg-success/20 text-success border-0">Активно</Badge>;
    }
    return <Badge variant="secondary">Выключено</Badge>;
  };

  const getLogStatusIcon = (result: string) => {
    switch (result) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'skipped':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  // Функция активации шаблона (отправка запроса в n8n)
  const handleActivateTemplate = async (templateId: string) => {
    if (!projectId) {
      toast.error('Выберите проект');
      return;
    }

    try {
      // Получаем n8n webhook URL из проекта
      const { data: projectData } = await supabase
        .from('projects')
        .select('n8n_webhook_url')
        .eq('id', projectId)
        .single();

      if (!projectData?.n8n_webhook_url) {
        toast.error('Настройте URL вебхука n8n в настройках проекта');
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      // Отправляем запрос в n8n для активации шаблона
      const response = await fetch(projectData.n8n_webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'activate_template',
          template_id: templateId,
          project_id: projectId,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Ошибка активации шаблона');

      toast.success('Шаблон активирован!');
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast.error('Время ожидания истекло');
        return;
      }
      console.error('Error activating template:', error);
      toast.error('Ошибка активации шаблона');
    }
  };

  return (
    <Card className="bg-white/5 backdrop-blur-2xl shadow-interstellar border border-white/10 relative z-10 overflow-hidden rounded-2xl">
      <CardHeader className="pb-4 border-b border-white/5">
        <CardTitle className="flex items-center gap-2 text-white">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Zap className="w-5 h-5 text-primary" />
          </motion.div>
          Автоматизация CRM
          <Badge className="ml-auto bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.2)] font-black">
            {rules.filter(r => r.is_active).length} активных
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Шаблоны автоматизации */}
        <div className="mb-6 space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Готовые шаблоны</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Шаблон 1: Мгновенный WhatsApp */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center group-hover:bg-green-500/20 group-hover:scale-110 transition-all shadow-[0_0_15px_rgba(34,197,94,0.15)]">
                    <MessageCircle className="w-6 h-6 text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white group-hover:text-green-400 transition-colors">Мгновенный WhatsApp</h4>
                    <p className="text-[10px] uppercase font-black tracking-widest text-white/40 mt-0.5">При новом лиде</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-white/50 mb-4 line-clamp-2 leading-relaxed">
                Автоматическая отправка приветственного сообщения в WhatsApp при поступлении нового лида
              </p>
              <Button
                size="sm"
                className="w-full bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 hover:border-green-500/40 rounded-xl transition-all font-semibold"
                onClick={() => handleActivateTemplate('instant_whatsapp')}
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Активировать
              </Button>
            </motion.div>

            {/* Шаблон 2: Дожим 24ч */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/20 group-hover:scale-110 transition-all shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                    <Clock className="w-6 h-6 text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white group-hover:text-amber-400 transition-colors">Дожим 24ч</h4>
                    <p className="text-[10px] uppercase font-black tracking-widest text-white/40 mt-0.5">Напоминание</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-white/50 mb-4 line-clamp-2 leading-relaxed">
                Автоматическое напоминание лидам, которые не ответили в течение 24 часов
              </p>
              <Button
                size="sm"
                className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 hover:border-amber-500/40 rounded-xl transition-all font-semibold"
                onClick={() => handleActivateTemplate('followup_24h')}
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Активировать
              </Button>
            </motion.div>

            {/* Шаблон 3: LTV-контроль */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/20 group-hover:scale-110 transition-all shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                    <TrendingUp className="w-6 h-6 text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white group-hover:text-purple-400 transition-colors">LTV-контроль</h4>
                    <p className="text-[10px] uppercase font-black tracking-widest text-white/40 mt-0.5">Мониторинг ценности</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-white/50 mb-4 line-clamp-2 leading-relaxed">
                Автоматический расчет и отслеживание LTV клиентов с уведомлениями о высокоценных лидах
              </p>
              <Button
                size="sm"
                className="w-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 hover:border-purple-500/40 rounded-xl transition-all font-semibold"
                onClick={() => handleActivateTemplate('ltv_control')}
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Активировать
              </Button>
            </motion.div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="rules" className="flex-1">
              <Bot className="w-4 h-4 mr-2" />
              Правила
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex-1" onClick={handleLoadLogs}>
              <History className="w-4 h-4 mr-2" />
              Логи
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rules">
            <ScrollArea className="h-[400px] pr-4">
              <AnimatePresence mode="popLayout">
                {rules.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Нет настроенных правил автоматизации
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rules.map((rule, index) => (
                      <motion.div
                        key={rule.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          "p-4 rounded-xl border backdrop-blur-sm bg-white/5 border-white/10",
                          "hover:border-white/20 hover:bg-white/10 transition-all group",
                          rule.is_active && "border-primary/30 bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.1)]"
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
                              {getRuleStatusBadge(rule)}
                            </div>

                            {rule.description && (
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                {rule.description}
                              </p>
                            )}

                            <div className="flex flex-wrap gap-2 text-xs">
                              <Badge className="bg-white/10 text-white/70 border border-white/10 text-[10px] uppercase font-black tracking-widest gap-1 py-1">
                                <Play className="w-3 h-3 text-white/50" />
                                {triggerTypeLabels[rule.trigger_type] || rule.trigger_type}
                              </Badge>

                              {rule.trigger_status && (
                                <Badge className="bg-white/5 text-white/60 border border-white/10 text-[10px] uppercase font-black tracking-widest py-1">
                                  {statusLabels[rule.trigger_status] || rule.trigger_status}
                                </Badge>
                              )}

                              <Badge className="bg-primary/10 text-primary border border-primary/20 text-[10px] uppercase font-black tracking-widest gap-1 py-1">
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
          </TabsContent>

          <TabsContent value="logs">
            <div className="flex justify-end mb-3">
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

            <ScrollArea className="h-[350px] pr-4">
              {loadingLogs ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Нет записей выполнения автоматизаций
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log, index) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="p-4 rounded-xl border backdrop-blur-sm bg-white/5 border-white/10 text-sm hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {getLogStatusIcon(log.action_result)}
                          <span className="font-medium">
                            {actionTypeLabels[log.action_type] || log.action_type}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.executed_at), 'dd HH:mm', { locale: ru })}
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
                        <p className="mt-1 text-xs text-destructive">{log.error_message}</p>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
