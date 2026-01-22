import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Users, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Zap,
  Clock,
  WifiOff,
  Wifi,
  ShoppingCart
} from 'lucide-react';
import { supabase } from '@/lib/externalSupabase';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAnimatedCounter, formatAnimatedCurrency, formatAnimatedNumber } from '@/hooks/useAnimatedCounter';

interface RealtimeMetric {
  label: string;
  value: number;
  previousValue: number;
  format: 'currency' | 'number' | 'percent';
  icon: React.ReactNode;
  color: string;
}

interface RealtimeLead {
  id: string;
  name: string | null;
  status: string | null;
  created_at: string;
  deal_amount: number | null;
}

interface RealtimeTransaction {
  id: string;
  type: string;
  amount: number;
  category: string;
  created_at: string | null;
}

interface RealtimeDashboardProps {
  projectId: string | null;
}

export const RealtimeDashboard = ({ projectId }: RealtimeDashboardProps) => {
  const [metrics, setMetrics] = useState<RealtimeMetric[]>([
    { label: 'Лиды сегодня', value: 0, previousValue: 0, format: 'number', icon: <Users className="h-5 w-5" />, color: 'text-blue-500' },
    { label: 'Выручка сегодня', value: 0, previousValue: 0, format: 'currency', icon: <DollarSign className="h-5 w-5" />, color: 'text-green-500' },
    { label: 'Продажи', value: 0, previousValue: 0, format: 'number', icon: <ShoppingCart className="h-5 w-5" />, color: 'text-purple-500' },
    { label: 'Активность', value: 0, previousValue: 0, format: 'number', icon: <Activity className="h-5 w-5" />, color: 'text-orange-500' },
  ]);
  
  const [recentLeads, setRecentLeads] = useState<RealtimeLead[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RealtimeTransaction[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [pulseEffect, setPulseEffect] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    if (!projectId) return;

    const fetchInitialData = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch today's data
      const { data: dailyData } = await supabase
        .from('daily_data')
        .select('*')
        .eq('project_id', projectId)
        .eq('date', today)
        .maybeSingle();

      // Fetch recent leads
      const { data: leads } = await supabase
        .from('leads')
        .select('id, name, status, created_at, deal_amount')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch recent transactions  
      const { data: transactions } = await supabase
        .from('transactions')
        .select('id, type, amount, category, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (dailyData) {
        setMetrics([
          { label: 'Лиды сегодня', value: dailyData.leads, previousValue: 0, format: 'number', icon: <Users className="h-5 w-5" />, color: 'text-blue-500' },
          { label: 'Выручка сегодня', value: dailyData.revenue, previousValue: 0, format: 'currency', icon: <DollarSign className="h-5 w-5" />, color: 'text-green-500' },
          { label: 'Продажи', value: dailyData.sales || 0, previousValue: 0, format: 'number', icon: <ShoppingCart className="h-5 w-5" />, color: 'text-purple-500' },
          { label: 'Активность', value: dailyData.clicks || 0, previousValue: 0, format: 'number', icon: <Activity className="h-5 w-5" />, color: 'text-orange-500' },
        ]);
      }

      if (leads) setRecentLeads(leads);
      if (transactions) setRecentTransactions(transactions);
    };

    fetchInitialData();
  }, [projectId]);

  // Проверяем статус глобального realtime соединения (подписка в Index.tsx)
  useEffect(() => {
    const checkConnection = () => {
      const channels = supabase.getChannels();
      const isActive = channels.some(ch => ch.state === 'joined');
      setIsConnected(isActive);
    };
    
    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Подписка на daily_data и transactions (специфичная для этой страницы)
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`realtime-dashboard-local-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_data',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          setLastUpdate(new Date());
          setPulseEffect('daily_data');
          setTimeout(() => setPulseEffect(null), 1000);
          
          if (payload.new && typeof payload.new === 'object') {
            const newData = payload.new as { leads?: number; revenue?: number; sales?: number; clicks?: number };
            
            setMetrics(prev => [
              { ...prev[0], previousValue: prev[0].value, value: newData.leads || 0 },
              { ...prev[1], previousValue: prev[1].value, value: Math.round(newData.revenue || 0) },
              { ...prev[2], previousValue: prev[2].value, value: newData.sales || 0 },
              { ...prev[3], previousValue: prev[3].value, value: newData.clicks || 0 },
            ]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          setLastUpdate(new Date());
          setPulseEffect('transactions');
          setTimeout(() => setPulseEffect(null), 1000);
          
          if (payload.new) {
            const newTransaction = payload.new as RealtimeTransaction;
            setRecentTransactions(prev => [newTransaction, ...prev.slice(0, 4)]);
            
            if (newTransaction.type === 'income') {
              toast.success(`Новая выручка: +${new Intl.NumberFormat('ru-RU').format(Math.round(newTransaction.amount))} ₸`);
              setMetrics(prev => [
                prev[0],
                { ...prev[1], previousValue: prev[1].value, value: Math.round(prev[1].value + newTransaction.amount) },
                ...prev.slice(2)
              ]);
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const formatValue = (value: number, format: 'currency' | 'number' | 'percent') => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
      case 'percent':
        return value.toFixed(1) + '%';
      default:
        return new Intl.NumberFormat('ru-RU').format(Math.round(value));
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'new': return 'bg-blue-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'appointment': return 'bg-purple-500';
      case 'paid': return 'bg-emerald-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTransactionColor = (type: string) => {
    return type === 'income' ? 'text-green-500' : 'text-red-500';
  };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Выберите проект для просмотра метрик</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div 
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs transition-all",
              isConnected 
                ? "bg-success/10 text-success" 
                : "bg-destructive/10 text-destructive"
            )}
          >
            {isConnected ? (
              <>
                <Wifi className="w-3 h-3" />
                <span>Realtime подключен</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 animate-pulse" />
                <span>Переподключение...</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Обновлено: {lastUpdate.toLocaleTimeString('ru-RU')}</span>
        </div>
      </div>

      {/* Realtime Metrics Cards with animated counters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const change = metric.value - metric.previousValue;
          const isPositive = change >= 0;
          
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`relative overflow-hidden transition-all duration-300 ${pulseEffect === 'daily_data' ? 'ring-2 ring-primary' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className={metric.color}>{metric.icon}</div>
                    {change !== 0 && metric.previousValue !== 0 && (
                      <Badge variant={isPositive ? 'default' : 'destructive'} className="text-xs">
                        {isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                        {Math.abs(change).toFixed(0)}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-4">
                    <motion.p 
                      className="text-xl md:text-2xl font-semibold tabular-nums"
                      key={metric.value}
                      initial={{ scale: 1.1, color: isPositive ? '#22c55e' : '#ef4444' }}
                      animate={{ scale: 1, color: 'inherit' }}
                      transition={{ duration: 0.5 }}
                    >
                      {formatValue(metric.value, metric.format)}
                    </motion.p>
                    <p className="text-xs text-muted-foreground mt-1">{metric.label}</p>
                  </div>
                  {isConnected && (
                    <div className="absolute top-2 right-2">
                      <Zap className="h-3 w-3 text-yellow-500" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <Card className={`transition-all duration-300 ${pulseEffect === 'leads' ? 'ring-2 ring-blue-500' : ''}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Последние лиды
              <Badge variant="outline" className="ml-auto">Live</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="popLayout">
              {recentLeads.length === 0 ? (
                <p className="text-muted-foreground text-sm">Нет лидов</p>
              ) : (
                <div className="space-y-3">
                  {recentLeads.map((lead) => (
                    <motion.div
                      key={lead.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(lead.status)}`} />
                        <div>
                          <p className="font-medium">{lead.name || 'Без имени'}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(lead.created_at).toLocaleTimeString('ru-RU')}
                          </p>
                        </div>
                      </div>
                      {lead.deal_amount && lead.deal_amount > 0 && (
                        <span className="text-sm font-medium text-green-500">
                          {new Intl.NumberFormat('ru-RU').format(lead.deal_amount)} ₸
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className={`transition-all duration-300 ${pulseEffect === 'transactions' ? 'ring-2 ring-green-500' : ''}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Последние транзакции
              <Badge variant="outline" className="ml-auto">Live</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="popLayout">
              {recentTransactions.length === 0 ? (
                <p className="text-muted-foreground text-sm">Нет транзакций</p>
              ) : (
                <div className="space-y-3">
                  {recentTransactions.map((tx) => (
                    <motion.div
                      key={tx.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{tx.category}</p>
                        <p className="text-xs text-muted-foreground">
                          {tx.created_at ? new Date(tx.created_at).toLocaleTimeString('ru-RU') : '-'}
                        </p>
                      </div>
                      <span className={`text-sm font-medium ${getTransactionColor(tx.type)}`}>
                        {tx.type === 'income' ? '+' : '-'}
                        {new Intl.NumberFormat('ru-RU').format(tx.amount)} ₸
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
