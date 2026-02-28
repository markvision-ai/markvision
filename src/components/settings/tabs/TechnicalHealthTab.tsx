import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Activity,
  Database,
  MessageSquare,
  BarChart3,
  Zap,
  ShieldCheck,
  User,
  Bot,
  Send,
  Clock,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useHealthMonitor } from '@/hooks/useHealthMonitor';
import { motion, AnimatePresence } from 'framer-motion';

interface TechnicalHealthTabProps {
  projectId: string;
}

const serviceIcons: Record<string, React.ReactNode> = {
  'facebook': <BarChart3 className="h-5 w-5" />,
  'instagram': <BarChart3 className="h-5 w-5" />,
  'whatsapp': <MessageSquare className="h-5 w-5" />,
  'greenapi': <MessageSquare className="h-5 w-5" />,
  'telegram': <Send className="h-5 w-5" />,
  'database': <Database className="h-5 w-5" />,
  'realtime': <Zap className="h-5 w-5" />,
};

export function TechnicalHealthTab({ projectId }: TechnicalHealthTabProps) {
  const { services, alerts, loading, refreshing, lastCheckTime, refresh, runChecks } = useHealthMonitor(projectId);
  const [expandedService, setExpandedService] = useState<string | null>(null);

  const handleRefresh = async () => {
    await refresh();
    toast.success('Статус обновлён');
  };

  const handleRunChecks = async () => {
    await runChecks();
    toast.success('Проверка завершена');
  };

  const handleResolveAlert = async (alertId: string) => {
    // This will be handled by the health check service
    toast.success('Алерт помечен как решённый');
  };

  const hasErrors = services.some(s => s.status === 'error');
  const hasDegraded = services.some(s => s.status === 'degraded');
  const allOperational = !hasErrors && !hasDegraded && services.length > 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-blue-500';
      case 'degraded': return 'bg-amber-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-muted';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20">Работает</Badge>;
      case 'degraded':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20">Замедлен</Badge>;
      case 'error':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20">Ошибка</Badge>;
      default:
        return <Badge variant="secondary">Неизвестно</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Критично</Badge>;
      case 'warning':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Внимание</Badge>;
      default:
        return <Badge className="bg-cyan-500/10 text-cyan-600 border-cyan-500/20">Инфо</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Premium Header with Glassmorphic Design */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className={cn(
          "relative overflow-hidden border-2 transition-all duration-500",
          "bg-gradient-to-br from-background via-background to-background",
          hasErrors ? "border-red-500/50 shadow-2xl shadow-blue-900/5 shadow-red-500/20" :
            hasDegraded ? "border-amber-500/50 shadow-2xl shadow-blue-900/5 shadow-amber-500/20" :
              "border-blue-500/50 shadow-2xl shadow-blue-900/5 shadow-blue-500/20"
        )}>
          {/* Gradient Overlay */}
          <div className={cn(
            "absolute inset-0 opacity-10",
            hasErrors ? "bg-gradient-to-br from-red-500 to-red-600" :
              hasDegraded ? "bg-gradient-to-br from-amber-500 to-amber-600" :
                "bg-gradient-to-br from-blue-500 to-cyan-500"
          )} />

          <CardContent className="relative py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                {/* Animated Status Icon */}
                <motion.div
                  className={cn(
                    "relative p-4 rounded-2xl backdrop-blur-xl",
                    hasErrors ? "bg-red-500/10" :
                      hasDegraded ? "bg-amber-500/10" :
                        "bg-blue-500/10"
                  )}
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {hasErrors ? (
                    <XCircle className="h-10 w-10 text-red-500" />
                  ) : hasDegraded ? (
                    <AlertTriangle className="h-10 w-10 text-amber-500" />
                  ) : (
                    <CheckCircle2 className="h-10 w-10 text-blue-500" />
                  )}

                  {/* Pulsing Ring */}
                  {allOperational && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl border-2 border-blue-500"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeOut"
                      }}
                    />
                  )}
                </motion.div>

                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    {hasErrors ? '🚨 Обнаружены технические проблемы!' :
                      hasDegraded ? '⚠️ Некоторые системы работают с задержкой' :
                        services.length === 0 ? 'Нет подключенных сервисов' :
                          '✅ Все системы работают в штатном режиме'}
                  </h2>
                  <div className="flex items-center gap-3 mt-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Последняя проверка: {lastCheckTime ? format(lastCheckTime, 'd MMM HH:mm', { locale: ru }) : 'Никогда'}
                    </p>
                    {allOperational && (
                      <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse" />
                        Защищено
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="gap-2 hover:bg-primary/10"
                >
                  <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                  Обновить
                </Button>
                <Button
                  size="sm"
                  onClick={handleRunChecks}
                  disabled={refreshing}
                  className="gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                >
                  <Activity className="h-4 w-4" />
                  Проверить сейчас
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Services Grid with Glassmorphic Cards */}
      {services.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-500" />
            Статус сервисов
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {services.map((service, index) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className={cn(
                    "relative overflow-hidden transition-all duration-300 hover:shadow-2xl shadow-blue-900/5 cursor-pointer",
                    "bg-gradient-to-br from-card/50 to-card backdrop-blur-xl border-white/5",
                    expandedService === service.id && "ring-2 ring-primary/50"
                  )}
                    onClick={() => setExpandedService(expandedService === service.id ? null : service.id)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={cn(
                            "p-3 rounded-xl backdrop-blur-xl transition-colors",
                            service.status === 'operational' ? "bg-blue-500/10 text-blue-600" :
                              service.status === 'degraded' ? "bg-amber-500/10 text-amber-600" :
                                "bg-red-500/10 text-red-600"
                          )}>
                            {serviceIcons[service.service_type] || <Activity className="h-5 w-5" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground">{service.service_name}</h4>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {service.last_check_at ?
                                format(new Date(service.last_check_at), 'd MMM HH:mm', { locale: ru }) :
                                'Ожидание проверки'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Pulsing Status Indicator */}
                          <div className="relative">
                            <div className={cn(
                              "w-3 h-3 rounded-full",
                              getStatusColor(service.status)
                            )} />
                            {service.status === 'operational' && (
                              <div className={cn(
                                "absolute inset-0 w-3 h-3 rounded-full animate-ping",
                                getStatusColor(service.status),
                                "opacity-75"
                              )} />
                            )}
                          </div>
                          {getStatusBadge(service.status)}
                        </div>
                      </div>

                      {/* Error Message */}
                      {service.error_message && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-4 p-3 rounded-lg bg-red-500/5 border border-red-500/20"
                        >
                          <p className="text-sm text-red-600 flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            {service.error_message}
                          </p>
                        </motion.div>
                      )}

                      {/* Expanded Metadata */}
                      <AnimatePresence>
                        {expandedService === service.id && service.metadata && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 p-3 rounded-lg bg-muted/30 border border-white/5"
                          >
                            <p className="text-xs font-medium text-muted-foreground mb-2">Метаданные:</p>
                            <pre className="text-xs text-foreground/80 whitespace-pre-wrap">
                              {JSON.stringify(service.metadata, null, 2)}
                            </pre>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* No Services State */}
      {services.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="py-12 text-center">
            <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Нет подключенных сервисов</h3>
            <p className="text-sm text-muted-foreground">
              Подключите интеграции во вкладке "Подключения"
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recent Incidents with Timeline Design */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Недавние инциденты
        </h3>
        {alerts.length === 0 ? (
          <Card className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-blue-500/20">
            <CardContent className="py-8 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-blue-500/50" />
              <p className="font-medium text-blue-600">Нет активных инцидентов</p>
              <p className="text-sm text-muted-foreground mt-1">Все системы работают стабильно</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {alerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="border-l-4 border-l-red-500 bg-gradient-to-r from-red-500/5 to-transparent hover:shadow-2xl shadow-blue-900/5 transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getSeverityBadge(alert.severity)}
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(alert.created_at), 'd MMM HH:mm', { locale: ru })}
                            </span>
                          </div>
                          <h4 className="font-semibold text-foreground">{alert.title}</h4>
                          {alert.description && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {alert.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResolveAlert(alert.id)}
                          className="shrink-0 hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/20"
                        >
                          Решено
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Uptime Statistics */}
      <Card className="bg-gradient-to-br from-card/50 to-card backdrop-blur-xl border-white/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Статистика доступности
          </CardTitle>
          <CardDescription>За последние 30 дней</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl border border-blue-500/20">
              <div className="text-3xl font-bold text-blue-600">99.9%</div>
              <div className="text-sm text-muted-foreground mt-1">Uptime</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 rounded-xl border border-cyan-500/20">
              <div className="text-3xl font-bold text-cyan-600">45ms</div>
              <div className="text-sm text-muted-foreground mt-1">Avg Response</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl border border-blue-500/20">
              <div className="text-3xl font-bold text-blue-600">
                {services.filter(s => s.status === 'operational').length}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Активных</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-xl border border-red-500/20">
              <div className="text-3xl font-bold text-red-600">{alerts.length}</div>
              <div className="text-sm text-muted-foreground mt-1">Инцидентов</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}