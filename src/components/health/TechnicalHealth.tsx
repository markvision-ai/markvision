import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Wifi,
  Database,
  Server,
  Globe,
  Clock,
  Zap,
  Shield
} from 'lucide-react';
import { supabase } from '@/lib/externalSupabase';
import { toast } from 'sonner';

interface Integration {
  id: string;
  name: string;
  type: string;
  status: string;
  last_sync_at: string | null;
  error_message: string | null;
}

interface TechnicalHealthProps {
  projectId: string;
}

const systemMetrics = [
  { name: 'API Response Time', value: 124, unit: 'ms', status: 'good', max: 500 },
  { name: 'Database Queries', value: 45, unit: '/min', status: 'good', max: 100 },
  { name: 'Memory Usage', value: 67, unit: '%', status: 'warning', max: 100 },
  { name: 'CPU Load', value: 23, unit: '%', status: 'good', max: 100 },
];

const defaultIntegrations = [
  { name: 'Supabase Database', type: 'database', status: 'connected', icon: Database },
  { name: 'Яндекс.Директ', type: 'ads', status: 'connected', icon: Globe },
  { name: 'Telegram Bot', type: 'messaging', status: 'connected', icon: Wifi },
  { name: 'VK Реклама', type: 'ads', status: 'pending', icon: Globe },
  { name: 'AmoCRM', type: 'crm', status: 'disconnected', icon: Server },
  { name: 'WhatsApp Business', type: 'messaging', status: 'error', icon: Wifi },
];

export const TechnicalHealth = ({ projectId }: TechnicalHealthProps) => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchIntegrations();
  }, [projectId]);

  const fetchIntegrations = async () => {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;
      setIntegrations(data || []);
    } catch (error) {
      console.error('Error fetching integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchIntegrations();
    setTimeout(() => {
      setRefreshing(false);
      toast.success('Статус обновлен');
    }, 1000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500/10 text-green-500">Подключено</Badge>;
      case 'error':
        return <Badge className="bg-red-500/10 text-red-500">Ошибка</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-500">Ожидание</Badge>;
      default:
        return <Badge variant="secondary">Отключено</Badge>;
    }
  };

  const getMetricStatus = (value: number, max: number) => {
    const percent = (value / max) * 100;
    if (percent < 50) return 'good';
    if (percent < 80) return 'warning';
    return 'critical';
  };

  const connectedCount = integrations.length > 0 
    ? integrations.filter(i => i.status === 'connected').length
    : defaultIntegrations.filter(i => i.status === 'connected').length;
  
  const totalCount = integrations.length > 0 ? integrations.length : defaultIntegrations.length;
  const healthScore = Math.round((connectedCount / totalCount) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            Technical Health
          </h2>
          <p className="text-muted-foreground">Мониторинг интеграций и системы</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </div>

      {/* Health Score */}
      <Card className={`border-2 ${healthScore >= 80 ? 'border-green-500/50' : healthScore >= 50 ? 'border-yellow-500/50' : 'border-red-500/50'}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-full ${healthScore >= 80 ? 'bg-green-500/10' : healthScore >= 50 ? 'bg-yellow-500/10' : 'bg-red-500/10'}`}>
                <Shield className={`w-8 h-8 ${healthScore >= 80 ? 'text-green-500' : healthScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Общее здоровье системы</p>
                <p className="text-4xl font-bold">{healthScore}%</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Подключено интеграций</p>
              <p className="text-2xl font-bold">{connectedCount} / {totalCount}</p>
            </div>
          </div>
          <Progress value={healthScore} className="h-3 mt-4" />
        </CardContent>
      </Card>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {systemMetrics.map((metric, i) => {
          const status = getMetricStatus(metric.value, metric.max);
          return (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{metric.name}</span>
                  <div className={`w-2 h-2 rounded-full ${
                    status === 'good' ? 'bg-green-500' : 
                    status === 'warning' ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }`} />
                </div>
                <p className="text-2xl font-bold">
                  {metric.value}
                  <span className="text-sm font-normal text-muted-foreground ml-1">{metric.unit}</span>
                </p>
                <Progress 
                  value={(metric.value / metric.max) * 100} 
                  className={`h-1.5 mt-2 ${
                    status === 'good' ? '[&>div]:bg-green-500' : 
                    status === 'warning' ? '[&>div]:bg-yellow-500' : 
                    '[&>div]:bg-red-500'
                  }`}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Integrations Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Статус интеграций
          </CardTitle>
          <CardDescription>Мониторинг подключенных сервисов</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(integrations.length > 0 ? integrations : defaultIntegrations).map((integration: any, i: number) => {
              const Icon = integration.icon || Wifi;
              return (
                <div
                  key={integration.id || i}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(integration.status)}
                    <div className="p-2 rounded-lg bg-muted">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">{integration.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {integration.type === 'database' ? 'База данных' :
                         integration.type === 'ads' ? 'Реклама' :
                         integration.type === 'messaging' ? 'Мессенджеры' :
                         integration.type === 'crm' ? 'CRM' :
                         integration.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {integration.last_sync_at && (
                      <p className="text-sm text-muted-foreground">
                        Синхр: {new Date(integration.last_sync_at).toLocaleString('ru-RU')}
                      </p>
                    )}
                    {getStatusBadge(integration.status)}
                    {integration.status !== 'connected' && (
                      <Button size="sm" variant="outline">
                        {integration.status === 'error' ? 'Переподключить' : 'Подключить'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>Последние события</CardTitle>
          <CardDescription>Логи системных событий</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { time: '2 мин назад', event: 'Синхронизация с Яндекс.Директ завершена', type: 'success' },
              { time: '15 мин назад', event: 'Получено 5 новых лидов через webhook', type: 'info' },
              { time: '1 час назад', event: 'Ошибка подключения к WhatsApp API', type: 'error' },
              { time: '2 часа назад', event: 'Автобэкап базы данных выполнен', type: 'success' },
              { time: '3 часа назад', event: 'Обновлены данные по кампаниям', type: 'info' },
            ].map((event, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className={`w-2 h-2 rounded-full ${
                  event.type === 'success' ? 'bg-green-500' :
                  event.type === 'error' ? 'bg-red-500' :
                  'bg-blue-500'
                }`} />
                <span className="text-sm flex-1">{event.event}</span>
                <span className="text-xs text-muted-foreground">{event.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
