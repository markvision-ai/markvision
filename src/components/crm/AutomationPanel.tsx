import { useState } from 'react';
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
  History
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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
  new: 'Новая',
  in_progress: 'В работе',
  no_answer: 'Недозвон',
  appointment: 'Записан',
  paid: 'Оплачено',
  cancelled: 'Отказ'
};

export const AutomationPanel = ({ projectId }: AutomationPanelProps) => {
  const { rules, logs, loading, toggleRule, fetchLogs } = useAutomationRules(projectId);
  const [activeTab, setActiveTab] = useState('rules');
  const [loadingLogs, setLoadingLogs] = useState(false);

  const handleLoadLogs = async () => {
    setLoadingLogs(true);
    await fetchLogs(50);
    setLoadingLogs(false);
  };

  if (loading) {
    return (
      <Card className="crm-card-glass">
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

  return (
    <Card className="crm-card-glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Zap className="w-5 h-5 text-primary" />
          </motion.div>
          Автоматизация CRM
          <Badge className="ml-auto bg-gradient-to-r from-primary/20 to-accent/20 text-primary border-0">
            {rules.filter(r => r.is_active).length} активных
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
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
                              {getRuleStatusBadge(rule)}
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
                      className="p-3 rounded-lg border bg-card/30 text-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {getLogStatusIcon(log.action_result)}
                          <span className="font-medium">
                            {actionTypeLabels[log.action_type] || log.action_type}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.executed_at), 'dd.MM HH:mm', { locale: ru })}
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
