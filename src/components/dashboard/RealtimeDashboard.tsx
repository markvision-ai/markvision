// @ts-nocheck
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Users,
  DollarSign,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Wifi,
  WifiOff,
  Facebook,
  Webhook,
  MessageCircle,
  UserPlus,
  Stethoscope,
  Radio,
  BarChart3,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useProjectData } from '@/hooks/useProjectData';
import { format } from 'date-fns';
import { GlassCard } from '@/components/ui/GlassCard';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { AgencyAccountsDashboard } from '../ads/AgencyAccountsDashboard';

interface RealtimeMetric {
  label: string;
  value: number;
  previousValue: number;
  format: 'currency' | 'number' | 'percent';
  icon: React.ReactNode;
  color: string;
  bgColor: string;
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
  const { dailyData: projectDailyData } = useProjectData(projectId);
  const isVisible = usePageVisibility();

  const [metrics, setMetrics] = useState<RealtimeMetric[]>([
    { label: 'Выручка сегодня', value: 0, previousValue: 0, format: 'currency', icon: <DollarSign className="h-5 w-5" />, color: 'text-emerald-600', bgColor: 'bg-emerald-100/50' },
    { label: 'Лиды сегодня', value: 0, previousValue: 0, format: 'number', icon: <Users className="h-5 w-5" />, color: 'text-blue-600', bgColor: 'bg-blue-100/50' },
    { label: 'Продажи', value: 0, previousValue: 0, format: 'number', icon: <ShoppingCart className="h-5 w-5" />, color: 'text-purple-600', bgColor: 'bg-purple-100/50' },
    { label: 'Новые подписчики', value: 0, previousValue: 0, format: 'number', icon: <UserPlus className="h-5 w-5" />, color: 'text-pink-600', bgColor: 'bg-pink-100/50' },
    { label: 'Диагностика', value: 0, previousValue: 0, format: 'number', icon: <Stethoscope className="h-5 w-5" />, color: 'text-indigo-600', bgColor: 'bg-indigo-100/50' },
    { label: 'Активность', value: 0, previousValue: 0, format: 'number', icon: <Activity className="h-5 w-5" />, color: 'text-orange-600', bgColor: 'bg-orange-100/50' },
  ]);

  const [recentLeads, setRecentLeads] = useState<RealtimeLead[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RealtimeTransaction[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [todayRevenue, setTodayRevenue] = useState<number>(0);
  const [todaySpend, setTodaySpend] = useState<number>(0);

  // System status states
  const [systemStatus, setSystemStatus] = useState({
    meta: false,
    n8n: false,
    whatsapp: false
  });

  // Fetch revenue
  useEffect(() => {
    if (!projectId) return;

    const fetchTodayRevenue = async () => {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('project_id', projectId)
        .gte('created_at', `${todayStr}T00:00:00`)
        .lt('created_at', `${todayStr}T23:59:59`);

      if (error) {
        console.error('❌ Error fetching transactions:', error);
        return;
      }

      const revenue = transactions
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;

      setTodayRevenue(Math.round(revenue));
    };

    fetchTodayRevenue();
  }, [projectId]);

  // Update metrics
  useEffect(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayData = projectDailyData[todayStr];
    const followersToday = todayData ? (todayData.followers || todayData.new_followers || todayData.ig_followers_new || 0) : 0;
    const spend = todayData?.spend || 0;
    const revenue = todayRevenue > 0 ? todayRevenue : (todayData?.revenue || 0);

    setTodaySpend(spend);

    setMetrics(prev => [
      { ...prev[0], value: revenue },
      { ...prev[1], value: todayData?.leads || 0 },
      { ...prev[2], value: todayData?.sales || 0 },
      { ...prev[3], value: followersToday },
      { ...prev[4], value: todayData?.visits || todayData?.diagnostics || 0 },
      { ...prev[5], value: todayData?.clicks || 0 },
    ]);
  }, [projectDailyData, todayRevenue]);

  // Fetch initial data
  useEffect(() => {
    if (!projectId) return;

    const fetchInitialData = async () => {
      const { data: leads } = await supabase
        .from('leads')
        .select('id, name, status, created_at, deal_amount')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (leads) setRecentLeads(leads);

      const { data: transactions } = await supabase
        .from('transactions')
        .select('id, type, amount, category, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transactions) setRecentTransactions(transactions);

      const { data: metaAccount } = await supabase
        .from('ad_accounts')
        .select('status')
        .eq('project_id', projectId)
        .eq('platform', 'facebook')
        .eq('status', 'active')
        .maybeSingle();

      const { data: n8nFlows } = await supabase
        .from('automation_flows')
        .select('status')
        .eq('project_id', projectId)
        .eq('status', 'error')
        .limit(1);

      const { data: whatsappIntegration } = await supabase
        .from('integrations')
        .select('status')
        .eq('project_id', projectId)
        .eq('platform', 'greenapi')
        .eq('status', 'active')
        .maybeSingle();

      setSystemStatus({
        meta: !!metaAccount,
        n8n: !n8nFlows || n8nFlows.length === 0,
        whatsapp: !!whatsappIntegration
      });
    };

    fetchInitialData();
  }, [projectId]);

  // Check connection
  useEffect(() => {
    if (!isVisible) return;
    const checkConnection = () => {
      const channels = supabase.getChannels();
      const isActive = channels.some(ch => ch.state === 'joined');
      setIsConnected(isActive);
    };

    checkConnection();
    const interval = setInterval(checkConnection, 20000);
    return () => clearInterval(interval);
  }, [isVisible]);

  // Use Realtime
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`realtime-dashboard-local-${projectId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_data', filter: `project_id=eq.${projectId}` }, (payload) => {
        if (payload.new && typeof payload.new === 'object') {
          const newData = payload.new as any;
          const newFollowers = newData.followers_today || newData.new_followers || newData.ig_followers_new || newData.followers || 0;
          setMetrics(prev => [
            { ...prev[0], value: newData.revenue || 0 }, // Assuming revenue updates here too, though separate logic exists
            { ...prev[1], value: newData.leads || 0 },
            { ...prev[2], value: newData.sales || 0 },
            { ...prev[3], value: newFollowers },
            { ...prev[4], value: newData.visits || newData.diagnostics || 0 },
            { ...prev[5], value: newData.clicks || 0 },
          ]);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads', filter: `project_id=eq.${projectId}` }, (payload) => {
        if (payload.new) {
          const newLead = payload.new as RealtimeLead;
          setRecentLeads(prev => [newLead, ...prev.slice(0, 9)]);
          setMetrics(prev => [{ ...prev[0], value: prev[0].value }, { ...prev[1], value: prev[1].value + 1 }, ...prev.slice(2)]);
          toast.success('Новый лид!');
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions', filter: `project_id=eq.${projectId}` }, (payload) => {
        if (payload.new) {
          const newTransaction = payload.new as RealtimeTransaction;
          setRecentTransactions(prev => [newTransaction, ...prev.slice(0, 9)]);
          if (newTransaction.type === 'income') {
            const amount = Math.round(newTransaction.amount);
            toast.success(`Новая выручка: +${new Intl.NumberFormat('ru-RU').format(amount)} ₸`);
            setTodayRevenue(prev => prev + amount);
            // Update revenue metric locally
            setMetrics(prev => [{ ...prev[0], value: prev[0].value + amount }, ...prev.slice(1)]);
          }
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setIsConnected(true);
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setIsConnected(false);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const formatValue = (value: number, format: 'currency' | 'number' | 'percent') => {
    switch (format) {
      case 'currency': return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
      case 'percent': return value.toFixed(1) + '%';
      default: return new Intl.NumberFormat('ru-RU').format(Math.round(value));
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

  const getStatusLabel = (status: string | null): string => {
    const labels: Record<string, string> = { 'new': 'Новый', 'in_progress': 'В работе', 'appointment': 'Записан', 'paid': 'Оплачен', 'cancelled': 'Отменён' };
    return labels[status || ''] || 'Новый';
  };

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = { 'marketing': 'Маркетинг', 'salary': 'Зарплата', 'rent': 'Аренда', 'software': 'Софт', 'taxes': 'Налоги', 'equipment': 'Оборудование', 'sales': 'Продажа', 'services': 'Услуги', 'refund': 'Возврат', 'other': 'Прочее' };
    return labels[category] || category;
  };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-64 border border-dashed border-border rounded-xl">
        <p className="text-muted-foreground">Выберите проект для просмотра живой ленты</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Живая лента</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-muted-foreground font-medium">System Online</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Indicators */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-lg shadow-sm">
            <div className="flex items-center gap-1.5" title="Facebook Ads">
              <div className={cn("w-2 h-2 rounded-full", systemStatus.meta ? "bg-emerald-500" : "bg-red-500")} />
              <Facebook className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="w-px h-3 bg-border" />
            <div className="flex items-center gap-1.5" title="Automation">
              <div className={cn("w-2 h-2 rounded-full", systemStatus.n8n ? "bg-emerald-500" : "bg-red-500")} />
              <Webhook className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="w-px h-3 bg-border" />
            <div className="flex items-center gap-1.5" title="WhatsApp">
              <div className={cn("w-2 h-2 rounded-full", systemStatus.whatsapp ? "bg-emerald-500" : "bg-red-500")} />
              <MessageCircle className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </div>

          <Badge variant={isConnected ? "default" : "destructive"} className={cn("gap-1.5", isConnected ? "bg-emerald-600 hover:bg-emerald-700" : "")}>
            {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {isConnected ? "ONLINE" : "OFFLINE"}
          </Badge>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map((metric, index) => {
          const isBig = index < 3;
          const isRevenue = metric.label === 'Выручка сегодня';

          // ROMI Calculation
          const romi = isRevenue && todaySpend > 0 ? ((metric.value - todaySpend) / todaySpend) * 100 : 0;
          const romiText = isRevenue ? (todaySpend > 0 ? `ROMI: ${romi >= 0 ? '+' : ''}${romi.toFixed(0)}%` : 'ROMI: —') : null;

          return (
            <GlassCard key={metric.label} className="relative overflow-hidden group p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={cn("p-2 rounded-lg", metric.bgColor)}>
                  <div className={cn(metric.color)}>{metric.icon}</div>
                </div>
                {isRevenue && (
                  <Badge variant="outline" className={cn("font-mono text-[10px]", romi >= 0 ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-muted-foreground")}>
                    {romiText}
                  </Badge>
                )}
              </div>
              <div>
                <div className={cn("font-bold tracking-tight text-foreground", isBig ? "text-2xl" : "text-xl")}>
                  {formatValue(metric.value, metric.format)}
                </div>
                <div className="text-sm text-muted-foreground font-medium mt-1">{metric.label}</div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Agency Accounts Widget */}
      <AgencyAccountsDashboard projectId={projectId} />

      {/* Activity Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <GlassCard className="flex flex-col h-[400px] p-0 overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <Users className="w-4 h-4 text-blue-600" />
              Последние лиды
            </div>
            <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-200 bg-blue-50">LIVE</Badge>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {recentLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Users className="w-8 h-8 opacity-20 mb-2" />
                <span className="text-sm">Нет новых лидов</span>
              </div>
            ) : (
              recentLeads.map(lead => (
                <div key={lead.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full", getStatusColor(lead.status))} />
                    <div>
                      <div className="text-sm font-medium text-foreground">{lead.name || 'Аноним'}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        {getStatusLabel(lead.status)}
                        <span className="text-[10px] opacity-70">•</span>
                        {new Date(lead.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  {lead.deal_amount && lead.deal_amount > 0 && (
                    <div className="text-sm font-bold text-emerald-600">
                      {new Intl.NumberFormat('ru-RU').format(lead.deal_amount)} ₸
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </GlassCard>

        {/* Recent Transactions */}
        <GlassCard className="flex flex-col h-[400px] p-0 overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Последние транзакции
            </div>
            <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200 bg-emerald-50">STREAM</Badge>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {recentTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <BarChart3 className="w-8 h-8 opacity-20 mb-2" />
                <span className="text-sm">Нет транзакций</span>
              </div>
            ) : (
              recentTransactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center border",
                      tx.type === 'income' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
                    )}>
                      {tx.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{getCategoryLabel(tx.category)}</div>
                      <div className="text-xs text-muted-foreground">
                        {tx.created_at ? new Date(tx.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </div>
                    </div>
                  </div>
                  <div className={cn("text-sm font-bold", tx.type === 'income' ? "text-emerald-600" : "text-red-600")}>
                    {tx.type === 'income' ? '+' : '-'}{new Intl.NumberFormat('ru-RU').format(tx.amount)} ₸
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
