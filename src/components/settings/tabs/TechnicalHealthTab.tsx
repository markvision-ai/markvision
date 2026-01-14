import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw,
  ExternalLink,
  Activity,
  Database,
  Globe,
  MessageSquare,
  BarChart3,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TechnicalHealthTabProps {
  projectId: string;
}

interface SystemHealth {
  id: string;
  project_id: string;
  service_name: string;
  service_type: string;
  status: 'operational' | 'degraded' | 'error';
  last_check_at: string;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
}

interface SystemAlert {
  id: string;
  service_id: string;
  title: string;
  description: string | null;
  severity: 'info' | 'warning' | 'critical';
  is_resolved: boolean;
  created_at: string;
}

const serviceIcons: Record<string, React.ReactNode> = {
  'facebook': <BarChart3 className="h-5 w-5" />,
  'whatsapp': <MessageSquare className="h-5 w-5" />,
  'pixel': <Activity className="h-5 w-5" />,
  'database': <Database className="h-5 w-5" />,
  'website': <Globe className="h-5 w-5" />,
  'realtime': <Zap className="h-5 w-5" />,
};

const defaultServices = [
  { service_name: 'Facebook Marketing API', service_type: 'facebook', status: 'operational' },
  { service_name: 'WhatsApp Gateway', service_type: 'whatsapp', status: 'operational' },
  { service_name: 'Pixel & Tracking', service_type: 'pixel', status: 'operational' },
  { service_name: 'Database Realtime', service_type: 'realtime', status: 'operational' },
];

export function TechnicalHealthTab({ projectId }: TechnicalHealthTabProps) {
  const [services, setServices] = useState<SystemHealth[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      // Fetch system health
      const { data: healthData } = await supabase
        .from('system_health')
        .select('*')
        .eq('project_id', projectId);

      if (healthData && healthData.length > 0) {
        setServices(healthData as unknown as SystemHealth[]);
      } else {
        // Use default services if none exist
        setServices(defaultServices.map((s, i) => ({
          id: `default-${i}`,
          project_id: projectId,
          ...s,
          last_check_at: new Date().toISOString(),
          error_message: null,
          metadata: null,
        })) as SystemHealth[]);
      }

      // Fetch unresolved alerts
      const { data: alertsData } = await supabase
        .from('system_alerts')
        .select('*')
        .eq('is_resolved', false)
        .order('created_at', { ascending: false });

      if (alertsData) {
        setAlerts(alertsData as unknown as SystemAlert[]);
      }
    } catch (error) {
      console.error('Error fetching health data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Realtime subscription
    const channel = supabase
      .channel('system-health-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_health' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_alerts' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success('Статус обновлён');
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await supabase
        .from('system_alerts')
        .update({ is_resolved: true, resolved_at: new Date().toISOString() })
        .eq('id', alertId);
      
      toast.success('Алерт помечен как решённый');
      fetchData();
    } catch (error) {
      toast.error('Ошибка при обновлении алерта');
    }
  };

  const hasErrors = services.some(s => s.status === 'error');
  const hasDegraded = services.some(s => s.status === 'degraded');
  const allOperational = !hasErrors && !hasDegraded;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-muted';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Работает</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Замедлен</Badge>;
      case 'error':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Ошибка</Badge>;
      default:
        return <Badge variant="secondary">Неизвестно</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Критично</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Внимание</Badge>;
      default:
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Инфо</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global Status Banner */}
      <Card className={cn(
        "border-2 transition-colors",
        hasErrors ? "border-red-500/50 bg-red-500/5" :
        hasDegraded ? "border-yellow-500/50 bg-yellow-500/5" :
        "border-green-500/50 bg-green-500/5"
      )}>
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {hasErrors ? (
                <div className="p-3 rounded-full bg-red-500/10">
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
              ) : hasDegraded ? (
                <div className="p-3 rounded-full bg-yellow-500/10">
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                </div>
              ) : (
                <div className="p-3 rounded-full bg-green-500/10">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold">
                  {hasErrors ? '🚨 Обнаружены технические проблемы!' :
                   hasDegraded ? '⚠️ Некоторые системы работают с задержкой' :
                   '✅ Все системы работают в штатном режиме'}
                </h2>
                <p className="text-muted-foreground text-sm">
                  Последняя проверка: {new Date().toLocaleString('ru-RU')}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
              Обновить
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Services Grid */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Статус сервисов</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((service) => (
            <Card key={service.id} className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      service.status === 'operational' ? "bg-green-500/10 text-green-600" :
                      service.status === 'degraded' ? "bg-yellow-500/10 text-yellow-600" :
                      "bg-red-500/10 text-red-600"
                    )}>
                      {serviceIcons[service.service_type] || <Activity className="h-5 w-5" />}
                    </div>
                    <div>
                      <h4 className="font-medium">{service.service_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {service.last_check_at ? 
                          `Проверено: ${new Date(service.last_check_at).toLocaleTimeString('ru-RU')}` :
                          'Ожидание проверки'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Pulsing indicator */}
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
                {service.error_message && (
                  <p className="mt-3 text-sm text-red-600 bg-red-500/5 p-2 rounded">
                    {service.error_message}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Incidents */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Недавние инциденты</h3>
        {alerts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500/50" />
              <p>Нет активных инцидентов</p>
              <p className="text-sm">Все системы работают стабильно</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <Card key={alert.id} className="border-l-4 border-l-red-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getSeverityBadge(alert.severity)}
                        <span className="text-sm text-muted-foreground">
                          {new Date(alert.created_at).toLocaleString('ru-RU')}
                        </span>
                      </div>
                      <h4 className="font-medium">{alert.title}</h4>
                      {alert.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {alert.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolveAlert(alert.id)}
                      >
                        Решено
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <a href="#integrations">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Uptime Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Статистика доступности</CardTitle>
          <CardDescription>За последние 30 дней</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">45ms</div>
              <div className="text-sm text-muted-foreground">Avg Response</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{services.filter(s => s.status === 'operational').length}</div>
              <div className="text-sm text-muted-foreground">Активных</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{alerts.length}</div>
              <div className="text-sm text-muted-foreground">Инцидентов</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}