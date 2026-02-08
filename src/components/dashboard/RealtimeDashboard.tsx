// @ts-nocheck
import { useState, useEffect } from 'react';
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
  ShoppingCart,
  Facebook,
  Webhook,
  UserPlus,
  MessageCircle,
  Stethoscope,
  Radio,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useProjectData } from '@/hooks/useProjectData';
import { format } from 'date-fns';

interface RealtimeMetric {
  label: string;
  value: number;
  previousValue: number;
  format: 'currency' | 'number' | 'percent';
  icon: React.ReactNode;
  color: string;
  borderColor: string;
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

  const [metrics, setMetrics] = useState<RealtimeMetric[]>([
    { label: 'Выручка сегодня', value: 0, previousValue: 0, format: 'currency', icon: <DollarSign className="h-5 w-5" />, color: 'text-emerald-400', borderColor: 'border-emerald-500/30' },
    { label: 'Лиды сегодня', value: 0, previousValue: 0, format: 'number', icon: <Users className="h-5 w-5" />, color: 'text-blue-400', borderColor: 'border-blue-500/30' },
    { label: 'Продажи', value: 0, previousValue: 0, format: 'number', icon: <ShoppingCart className="h-5 w-5" />, color: 'text-purple-400', borderColor: 'border-purple-500/30' },
    { label: 'Новые подписчики', value: 0, previousValue: 0, format: 'number', icon: <UserPlus className="h-5 w-5" />, color: 'text-pink-400', borderColor: 'border-pink-500/30' },
    { label: 'Диагностика', value: 0, previousValue: 0, format: 'number', icon: <Stethoscope className="h-5 w-5" />, color: 'text-indigo-400', borderColor: 'border-indigo-500/30' },
    { label: 'Активность', value: 0, previousValue: 0, format: 'number', icon: <Activity className="h-5 w-5" />, color: 'text-orange-400', borderColor: 'border-orange-500/30' },
  ]);

  const [recentLeads, setRecentLeads] = useState<RealtimeLead[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RealtimeTransaction[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [pulseEffect, setPulseEffect] = useState<string | null>(null);
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

    setMetrics([
      { label: 'Выручка сегодня', value: revenue, previousValue: 0, format: 'currency', icon: <DollarSign className="h-5 w-5" />, color: 'text-emerald-400', borderColor: 'border-emerald-500/30' },
      { label: 'Лиды сегодня', value: todayData?.leads || 0, previousValue: 0, format: 'number', icon: <Users className="h-5 w-5" />, color: 'text-blue-400', borderColor: 'border-blue-500/30' },
      { label: 'Продажи', value: todayData?.sales || 0, previousValue: 0, format: 'number', icon: <ShoppingCart className="h-5 w-5" />, color: 'text-purple-400', borderColor: 'border-purple-500/30' },
      { label: 'Новые подписчики', value: followersToday, previousValue: 0, format: 'number', icon: <UserPlus className="h-5 w-5" />, color: 'text-pink-400', borderColor: 'border-pink-500/30' },
      { label: 'Диагностика', value: todayData?.visits || 0, previousValue: 0, format: 'number', icon: <Stethoscope className="h-5 w-5" />, color: 'text-indigo-400', borderColor: 'border-indigo-500/30' },
      { label: 'Активность', value: todayData?.clicks || 0, previousValue: 0, format: 'number', icon: <Activity className="h-5 w-5" />, color: 'text-orange-400', borderColor: 'border-orange-500/30' },
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
    const checkConnection = () => {
      const channels = supabase.getChannels();
      const isActive = channels.some(ch => ch.state === 'joined');
      setIsConnected(isActive);
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  // Use Realtime
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`realtime-dashboard-local-${projectId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_data', filter: `project_id=eq.${projectId}` }, (payload) => {
        setLastUpdate(new Date());
        setPulseEffect('daily_data');
        setTimeout(() => setPulseEffect(null), 1000);

        if (payload.new && typeof payload.new === 'object') {
          const newData = payload.new as any;
          const newFollowers = newData.followers_today || newData.new_followers || newData.ig_followers_new || newData.followers || 0;
          setMetrics(prev => [
            { ...prev[0], value: newData.leads || 0 },
            { ...prev[1], value: newFollowers },
            { ...prev[2], value: Math.round(newData.revenue || 0) },
            { ...prev[3], value: newData.sales || 0 },
            { ...prev[4], value: newData.visits || newData.diagnostics || 0 },
            { ...prev[5], value: newData.clicks || 0 },
          ]);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads', filter: `project_id=eq.${projectId}` }, (payload) => {
        setLastUpdate(new Date());
        setPulseEffect('leads');
        setTimeout(() => setPulseEffect(null), 1000);
        if (payload.new) {
          const newLead = payload.new as RealtimeLead;
          setRecentLeads(prev => [newLead, ...prev.slice(0, 9)]);
          setMetrics(prev => [{ ...prev[0], value: prev[0].value + 1 }, ...prev.slice(1)]);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions', filter: `project_id=eq.${projectId}` }, (payload) => {
        setLastUpdate(new Date());
        setPulseEffect('transactions');
        setTimeout(() => setPulseEffect(null), 1000);
        if (payload.new) {
          const newTransaction = payload.new as RealtimeTransaction;
          setRecentTransactions(prev => [newTransaction, ...prev.slice(0, 9)]);
          if (newTransaction.type === 'income') {
            const amount = Math.round(newTransaction.amount);
            toast.success(`Новая выручка: +${new Intl.NumberFormat('ru-RU').format(amount)} ₸`);
            setTodayRevenue(prev => prev + amount);
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
      case 'new': return 'bg-blue-400 shadow-[0_0_8px_#60a5fa]';
      case 'in_progress': return 'bg-yellow-400 shadow-[0_0_8px_#facc15]';
      case 'appointment': return 'bg-purple-400 shadow-[0_0_8px_#c084fc]';
      case 'paid': return 'bg-emerald-400 shadow-[0_0_8px_#34d399]';
      case 'cancelled': return 'bg-red-400 shadow-[0_0_8px_#f87171]';
      default: return 'bg-slate-500';
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
      <div className="flex items-center justify-center h-64 interstellar-card border-white/10 text-white/40">
        <p>Выберите проект для просмотра живой ленты</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header with System Status */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <Radio className="w-6 h-6 text-blue-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white/90">Живая лента</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_#4ade80] animate-ping" />
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">System Online</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* System Status Panel "LCD" */}
          <div className="flex items-center gap-3 px-4 py-2 bg-[#05060A] border border-white/10 rounded-lg shadow-inner">
            <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold border-r border-white/10 pr-3 mr-1">Status Check</span>

            {/* Meta */}
            <div className="flex items-center gap-1.5">
              <div className={cn("w-1.5 h-1.5 rounded-full", systemStatus.meta ? "bg-blue-500 shadow-[0_0_5px_#3b82f6]" : "bg-red-500 animate-pulse")} />
              <Facebook className={cn("w-3.5 h-3.5", systemStatus.meta ? "text-blue-400" : "text-white/30")} />
            </div>
            {/* n8n */}
            <div className="flex items-center gap-1.5 border-l border-white/10 pl-3">
              <div className={cn("w-1.5 h-1.5 rounded-full", systemStatus.n8n ? "bg-orange-500 shadow-[0_0_5px_#f97316]" : "bg-red-500 animate-pulse")} />
              <Webhook className={cn("w-3.5 h-3.5", systemStatus.n8n ? "text-orange-400" : "text-white/30")} />
            </div>
            {/* WhatsApp */}
            <div className="flex items-center gap-1.5 border-l border-white/10 pl-3">
              <div className={cn("w-1.5 h-1.5 rounded-full", systemStatus.whatsapp ? "bg-emerald-500 shadow-[0_0_5px_#10b981]" : "bg-red-500 animate-pulse")} />
              <MessageCircle className={cn("w-3.5 h-3.5", systemStatus.whatsapp ? "text-emerald-400" : "text-white/30")} />
            </div>
          </div>

          {/* Connection Indicator */}
          <div className={cn(
            "px-3 py-1.5 rounded-lg border flex items-center gap-2 transition-all",
            isConnected ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"
          )}>
            {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span className="text-xs font-bold tracking-wide">{isConnected ? 'REALTIME' : 'OFFLINE'}</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map((metric, index) => {
          const isBig = index < 3;
          const isRevenue = metric.label === 'Выручка сегодня';
          const isPulse = pulseEffect === 'daily_data';

          // ROMI Calculation
          const romi = isRevenue && todaySpend > 0 ? ((metric.value - todaySpend) / todaySpend) * 100 : 0;
          const romiText = isRevenue ? (todaySpend > 0 ? `ROMI: ${romi >= 0 ? '+' : ''}${romi.toFixed(0)}%` : 'ROMI: —') : null;

          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={cn(
                "interstellar-card relative overflow-hidden group p-5 h-full transition-all duration-300",
                isPulse && "scale-[1.02] shadow-[0_0_30px_rgba(255,255,255,0.1)]",
                `hover:border-${metric.color.split('-')[1]}-500/50` // Dynamic hover border
              )}>
                {/* Dynamic Gradient Glow */}
                <div className={cn(
                  "absolute -inset-0.5 bg-gradient-to-r opacity-0 group-hover:opacity-30 transition-opacity blur-xl -z-10",
                  metric.color.replace('text-', 'from-').replace('400', '600'),
                  "to-transparent"
                )} />

                <div className="flex justify-between items-start mb-4">
                  <div className={cn(
                    "p-2 rounded-lg border bg-white/[0.03] transition-colors",
                    `border-${metric.color.split('-')[1]}-500/30`,
                    metric.color
                  )}>
                    {metric.icon}
                  </div>
                  <div className={cn(
                    "text-[10px] font-mono px-2 py-0.5 rounded border border-white/5 bg-white/[0.02] text-white/30 group-hover:text-white/60 transition-colors uppercase tracking-widest"
                  )}>
                    Live
                  </div>
                </div>

                <div className="space-y-1">
                  <div className={cn(
                    "font-mono font-bold tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.15)]",
                    isBig ? "text-3xl" : "text-2xl"
                  )}>
                    {formatValue(metric.value, metric.format)}
                  </div>
                  <div className="text-sm font-medium text-white/50">{metric.label}</div>

                  {isRevenue && (
                    <div className={cn(
                      "text-xs font-mono mt-2 inline-flex items-center px-1.5 py-0.5 rounded border border-white/5 bg-white/5",
                      romi >= 0 ? "text-emerald-400" : "text-white/30"
                    )}>
                      {romiText}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Activity Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads Feed */}
        <div className={cn("interstellar-card relative p-0 flex flex-col h-[400px]", pulseEffect === 'leads' && "ring-1 ring-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.2)]")}>
          <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-white/90">
              <Users className="w-4 h-4 text-blue-400" />
              Последние лиды
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Feed Active</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            <AnimatePresence initial={false}>
              {recentLeads.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/20">
                  <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mb-2">
                    <Users className="w-6 h-6 opacity-30" />
                  </div>
                  <span className="text-xs">Ожидание данных...</span>
                </div>
              ) : (
                recentLeads.map((lead) => (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, x: -20, backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                    animate={{ opacity: 1, x: 0, backgroundColor: "rgba(255, 255, 255, 0.02)" }}
                    className="flex items-center justify-between p-3 rounded-lg border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("w-2 h-2 rounded-full ring-2 ring-black/20", getStatusColor(lead.status))} />
                      <div>
                        <div className="text-sm font-bold text-white/90 group-hover:text-blue-200 transition-colors">
                          {lead.name || 'Аноним'}
                        </div>
                        <div className="text-[10px] text-white/40 flex items-center gap-2">
                          {getStatusLabel(lead.status)}
                          <span className="w-1 h-1 rounded-full bg-white/20" />
                          {new Date(lead.created_at).toLocaleTimeString('ru-RU')}
                        </div>
                      </div>
                    </div>
                    {lead.deal_amount && lead.deal_amount > 0 && (
                      <div className="text-sm font-mono font-bold text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.3)]">
                        {new Intl.NumberFormat('ru-RU').format(lead.deal_amount)} ₸
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Recent Transactions Feed */}
        <div className={cn("interstellar-card relative p-0 flex flex-col h-[400px]", pulseEffect === 'transactions' && "ring-1 ring-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]")}>
          <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-white/90">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Последние транзакции
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Stream Active</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            <AnimatePresence initial={false}>
              {recentTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/20">
                  <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mb-2">
                    <BarChart3 className="w-6 h-6 opacity-30" />
                  </div>
                  <span className="text-xs">Ожидание транзакций...</span>
                </div>
              ) : (
                recentTransactions.map((tx) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -20, backgroundColor: "rgba(16, 185, 129, 0.1)" }}
                    animate={{ opacity: 1, x: 0, backgroundColor: "rgba(255, 255, 255, 0.02)" }}
                    className="flex items-center justify-between p-3 rounded-lg border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-1.5 rounded-md border text-xs font-bold uppercase w-8 h-8 flex items-center justify-center",
                        tx.type === 'income' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                      )}>
                        {tx.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white/90">
                          {getCategoryLabel(tx.category)}
                        </div>
                        <div className="text-[10px] text-white/40 font-mono">
                          {tx.created_at ? new Date(tx.created_at).toLocaleTimeString('ru-RU') : '-'}
                        </div>
                      </div>
                    </div>
                    <div className={cn(
                      "text-sm font-mono font-bold",
                      tx.type === 'income' ? "text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.3)]" : "text-red-400"
                    )}>
                      {tx.type === 'income' ? '+' : '-'}{new Intl.NumberFormat('ru-RU').format(tx.amount)} ₸
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

