// @ts-nocheck
import { useState, useEffect, useMemo } from 'react';
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
  Clock,
  TrendingUp,
  Globe,
  Instagram,
  Zap,
  Target,
  Search,
  MessageSquare,
  ArrowUpDown,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useProjectData } from '@/hooks/useProjectData';
import { useMetaAccountAnalytics } from '@/hooks/useMetaAccountAnalytics';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { GlassCard } from '@/components/ui/GlassCard';
import { usePageVisibility } from '@/hooks/usePageVisibility';

interface RealtimeMetric {
  label: string;
  value: number;
  previousValue: number;
  format: 'currency' | 'number' | 'percent';
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  subValue?: string;
}

interface RealtimeLead {
  id: string;
  name: string | null;
  status: string | null;
  created_at: string;
  deal_amount: number | null;
  utm_source: string | null;
  utm_campaign: string | null;
}

interface RealtimeTransaction {
  id: string;
  type: string;
  amount: number;
  category: string;
  created_at: string | null;
}

interface SourceStat {
  source: string;
  label: string;
  icon: React.ReactNode;
  leads: number;
  sales: number;
  revenue: number;
  conversion: number;
  color: string;
}

interface CampaignStat {
  name: string;
  leads: number;
  status: 'active' | 'paused';
  spend?: number;
}

interface RealtimeDashboardProps {
  projectId: string | null;
}

const SOURCE_CONFIG: Record<string, { label: string, icon: any, color: string }> = {
  meta: { label: 'Meta Ads', icon: Facebook, color: 'text-blue-500' },
  instagram: { label: 'Instagram', icon: Instagram, color: 'text-pink-500' },
  google: { label: 'Google Ads', icon: Search, color: 'text-red-500' },
  tiktok: { label: 'TikTok', icon: Zap, color: 'text-slate-900' },
  organic: { label: 'Органика', icon: Globe, color: 'text-emerald-500' },
  whatsapp: { label: 'WhatsApp', icon: MessageSquare, color: 'text-green-500' },
  direct: { label: 'Прямой заход', icon: Radio, color: 'text-indigo-500' },
};

export const RealtimeDashboard = ({ projectId }: RealtimeDashboardProps) => {
  const currentMonthRange = useMemo(() => ({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  }), []);

  const { dailyData: projectDailyData } = useProjectData(projectId);
  const { rows: metaRows, loading: metaLoading } = useMetaAccountAnalytics(projectId, currentMonthRange);
  const isVisible = usePageVisibility();

  const [metrics, setMetrics] = useState<RealtimeMetric[]>([]);
  const [recentLeads, setRecentLeads] = useState<RealtimeLead[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RealtimeTransaction[]>([]);
  const [todayRevenue, setTodayRevenue] = useState<number>(0);
  const [todaySpend, setTodaySpend] = useState<number>(0);
  const [allLeads, setAllLeads] = useState<RealtimeLead[]>([]);

  // Sorting state
  const [sourceSortConfig, setSourceSortConfig] = useState<{ key: keyof SourceStat, direction: 'asc' | 'desc' }>({ key: 'leads', direction: 'desc' });
  const [campaignSortConfig, setCampaignSortConfig] = useState<{ key: keyof CampaignStat, direction: 'asc' | 'desc' }>({ key: 'leads', direction: 'desc' });

  // System status states
  const [systemStatus, setSystemStatus] = useState({
    meta: false,
    n8n: false,
    whatsapp: false
  });

  // Fetch initial data including all leads for current month attribution
  useEffect(() => {
    if (!projectId) return;

    const fetchInitialData = async () => {
      const startOfMo = format(startOfMonth(new Date()), "yyyy-MM-dd'T'HH:mm:ssXXX");

      // 1. Leads
      const { data: leads } = await supabase
        .from('leads')
        .select('id, name, status, created_at, deal_amount, utm_source, utm_campaign')
        .eq('project_id', projectId)
        .gte('created_at', startOfMo)
        .order('created_at', { ascending: false });

      if (leads) {
        setAllLeads(leads);
        setRecentLeads(leads.slice(0, 10));
      }

      // 2. Transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('id, type, amount, category, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transactions) setRecentTransactions(transactions);

      // 3. System Status
      const [metaAccount, n8nFlows, whatsappIntegration] = await Promise.all([
        supabase.from('ad_accounts').select('status').eq('project_id', projectId).eq('platform', 'facebook').eq('status', 'active').maybeSingle(),
        supabase.from('automation_flows').select('status').eq('project_id', projectId).eq('status', 'error').limit(1),
        supabase.from('integrations').select('status').eq('project_id', projectId).eq('platform', 'greenapi').eq('status', 'active').maybeSingle()
      ]);

      setSystemStatus({
        meta: !!metaAccount.data,
        n8n: !n8nFlows.data || n8nFlows.data.length === 0,
        whatsapp: !!whatsappIntegration.data
      });
    };

    fetchInitialData();
  }, [projectId]);

  // Real-time Metrics Calculation
  useEffect(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayData = projectDailyData[todayStr];

    // Revenue logic: prioritizes transaction data if available
    const revenue = todayRevenue > 0 ? todayRevenue : (todayData?.revenue || 0);
    const leads = todayData?.leads || 0;
    const spend = todayData?.spend || 0;
    const sales = todayData?.sales || 0;

    // Performance logic
    const cpl = leads > 0 ? spend / leads : 0;
    const convRate = leads > 0 ? (sales / leads) * 100 : 0;

    setTodaySpend(spend);

    setMetrics([
      {
        label: 'Выручка сегодня',
        value: revenue,
        previousValue: 0,
        format: 'currency',
        icon: <DollarSign className="h-5 w-5" />,
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10',
        subValue: spend > 0 ? `ROI: ${(((revenue - spend) / spend) * 100).toFixed(0)}%` : 'ROI: —'
      },
      {
        label: 'Лиды сегодня',
        value: leads,
        previousValue: 0,
        format: 'number',
        icon: <Users className="h-5 w-5" />,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        subValue: `CPL: ${Math.round(cpl).toLocaleString('ru-RU')} ₸`
      },
      {
        label: 'Конверсия',
        value: convRate,
        previousValue: 0,
        format: 'percent',
        icon: <Zap className="h-5 w-5" />,
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
        subValue: `${sales} продаж`
      },
    ]);
  }, [projectDailyData, todayRevenue]);

  // Attribution & Source stats calculation
  const sourceStats = useMemo(() => {
    const stats: Record<string, SourceStat> = {
      meta: { source: 'meta', label: 'Meta Ads', icon: <Facebook className="w-4 h-4" />, leads: 0, sales: 0, revenue: 0, conversion: 0, color: 'text-blue-500' },
      google: { source: 'google', label: 'Google Ads', icon: <Search className="w-4 h-4" />, leads: 0, sales: 0, revenue: 0, conversion: 0, color: 'text-red-500' },
      instagram: { source: 'instagram', label: 'Instagram', icon: <Instagram className="w-4 h-4" />, leads: 0, sales: 0, revenue: 0, conversion: 0, color: 'text-pink-500' },
      tiktok: { source: 'tiktok', label: 'TikTok Ads', icon: <Zap className="w-4 h-4" />, leads: 0, sales: 0, revenue: 0, conversion: 0, color: 'text-slate-900' },
      organic: { source: 'organic', label: 'Органика', icon: <Globe className="w-4 h-4" />, leads: 0, sales: 0, revenue: 0, conversion: 0, color: 'text-emerald-500' },
      direct: { source: 'direct', label: 'Прямые/Прочие', icon: <Radio className="w-4 h-4" />, leads: 0, sales: 0, revenue: 0, conversion: 0, color: 'text-indigo-500' },
    };

    // Integrate Meta official data if available
    if (metaRows && metaRows.length > 0) {
      const metaTotals = metaRows.reduce((acc, r) => ({
        leads: acc.leads + (r.leads || 0),
        revenue: acc.revenue + (r.revenue || 0),
        paid: acc.paid + (r.paid || 0)
      }), { leads: 0, revenue: 0, paid: 0 });

      stats.meta.leads = metaTotals.leads;
      stats.meta.revenue = metaTotals.revenue;
      stats.meta.sales = metaTotals.paid;
    }

    allLeads.forEach(lead => {
      const src = (lead.utm_source || '').toLowerCase();
      let category = 'direct';

      if (src.includes('fb') || src.includes('meta') || src.includes('facebook')) {
        // Only count if not already counted by MetaRows (to avoid total duplication)
        // If metaRows exists, we trust it more for Meta, but for other platforms we trust leads table
        if (metaRows && metaRows.length > 0) return;
        category = 'meta';
      }
      else if (src.includes('google') || src.includes('gads')) category = 'google';
      else if (src.includes('ig') || src.includes('instagram')) category = 'instagram';
      else if (src.includes('tiktok') || src.includes('tt')) category = 'tiktok';
      else if (src.includes('organic') || src.includes('seo') || lead.utm_source === 'organic') category = 'organic';

      const target = stats[category];
      target.leads += 1;
      if (['paid', 'purchased', 'appointment', 'visit_completed', 'success'].includes(lead.status)) {
        target.sales += 1;
      }
      target.revenue += Number(lead.deal_amount || 0);
    });

    return Object.values(stats)
      .map(s => ({ ...s, conversion: s.leads > 0 ? (s.sales / s.leads) * 100 : 0 }))
      .sort((a, b) => {
        const order = sourceSortConfig.direction === 'asc' ? 1 : -1;
        const key = sourceSortConfig.key;
        return a[key] < b[key] ? -1 * order : 1 * order;
      });
  }, [allLeads, metaRows, sourceSortConfig]);

  // Campaign performance calculation
  const campaignStats = useMemo(() => {
    const campaigns: Record<string, CampaignStat> = {};
    allLeads.forEach(lead => {
      if (!lead.utm_campaign) return;
      if (!campaigns[lead.utm_campaign]) {
        campaigns[lead.utm_campaign] = { name: lead.utm_campaign, leads: 0, status: 'active' };
      }
      campaigns[lead.utm_campaign].leads += 1;
    });
    return Object.values(campaigns).sort((a, b) => {
      const order = campaignSortConfig.direction === 'asc' ? 1 : -1;
      const key = campaignSortConfig.key;
      return a[key] < b[key] ? -1 * order : 1 * order;
    }).slice(0, 5);
  }, [allLeads, campaignSortConfig]);

  const toggleSourceSort = (key: keyof SourceStat) => {
    setSourceSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const toggleCampaignSort = (key: keyof CampaignStat) => {
    setCampaignSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Real-time PostgreSQL changes
  useEffect(() => {
    if (!projectId) return;
    const channel = supabase.channel(`realtime-dashboard-pro-${projectId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads', filter: `project_id=eq.${projectId}` }, (payload) => {
        const newLead = payload.new as RealtimeLead;
        setRecentLeads(prev => [newLead, ...prev.slice(0, 9)]);
        setAllLeads(prev => [newLead, ...prev]);
        toast.success(`Новый лид: ${newLead.name || 'Аноним'}`);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions', filter: `project_id=eq.${projectId}` }, (payload) => {
        const newTx = payload.new as RealtimeTransaction;
        setRecentTransactions(prev => [newTx, ...prev.slice(0, 9)]);
        if (newTx.type === 'income') {
          const amount = Math.round(newTx.amount);
          setTodayRevenue(prev => prev + amount);
          toast.success(`Новая оплата: +${amount.toLocaleString('ru-RU')} ₸`);
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [projectId]);

  const formatValue = (value: number, format: 'currency' | 'number' | 'percent') => {
    switch (format) {
      case 'currency': return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
      case 'percent': return value.toFixed(1) + '%';
      default: return new Intl.NumberFormat('ru-RU').format(Math.round(value));
    }
  };

  const SortIcon = ({ currentKey, configKey, direction }: { currentKey: string, configKey: string, direction: 'asc' | 'desc' }) => {
    if (currentKey !== configKey) return <ArrowUpDown className="w-3 h-3 opacity-30 ml-1" />;
    return direction === 'desc' ? <ChevronDown className="w-3 h-3 text-primary ml-1" /> : <ChevronUp className="w-3 h-3 text-primary ml-1" />;
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'new': return 'bg-blue-500';
      case 'paid': case 'success': case 'purchased': return 'bg-emerald-500';
      case 'appointment': return 'bg-purple-500';
      case 'cancelled': case 'rejected': return 'bg-red-500';
      default: return 'bg-amber-500';
    }
  };

  if (!projectId) return <div className="p-12 text-center text-muted-foreground">Выберите проект</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20 shadow-inner">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground uppercase">Контроль трафика</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">System Operational</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 px-4 py-2 bg-card/50 backdrop-blur-md border border-border rounded-xl shadow-sm">
            {[
              { icon: Facebook, key: 'meta', label: 'Meta' },
              { icon: Webhook, key: 'n8n', label: 'n8n' },
              { icon: MessageCircle, key: 'whatsapp', label: 'WA' }
            ].map((s) => (
              <div key={s.key} className="flex items-center gap-2" title={s.label}>
                <div className={cn("w-2 h-2 rounded-full", systemStatus[s.key] ? "bg-emerald-500" : "bg-red-500")} />
                <s.icon className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
          </div>

          <Badge variant="outline" className={cn("px-3 py-1 border-emerald-500/20 bg-emerald-500/5 text-emerald-500 font-mono gap-1.5")}>
            <Clock className="w-3.5 h-3.5" />
            {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </Badge>
        </div>
      </div>

      {/* TOP METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.map((m, idx) => (
          <GlassCard key={m.label} className="p-6 transition-all hover:translate-y-[-2px] hover:shadow-lg border-border/50">
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-2.5 rounded-xl shadow-sm", m.bgColor)}>
                <div className={cn(m.color)}>{m.icon}</div>
              </div>
              <Badge variant="secondary" className="bg-muted/50 text-muted-foreground text-[10px] uppercase font-bold tracking-widest">{m.subValue}</Badge>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-black text-foreground tracking-tighter">
                {formatValue(m.value, m.format)}
              </div>
              <div className="text-sm font-semibold text-muted-foreground/80">{m.label}</div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* MIDDLE SECTION: SOURCES & CAMPAIGNS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Source Performance */}
        <GlassCard className="lg:col-span-2 p-0 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-border bg-muted/20 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-foreground uppercase tracking-tight text-xs">
              <Target className="w-4 h-4 text-primary" />
              Эффективность каналов <span className="text-[10px] font-normal text-muted-foreground font-mono ml-2">MTD</span>
            </div>
            <Badge className="bg-primary/20 text-primary border-primary/20 text-[10px]">Real-time Attribution</Badge>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-muted-foreground text-[10px] uppercase font-black border-b border-border/50">
                <tr>
                  <th
                    className="px-5 py-3 text-left cursor-pointer hover:text-primary transition-colors"
                    onClick={() => toggleSourceSort('label')}
                  >
                    <div className="flex items-center">Источник <SortIcon currentKey="label" configKey={sourceSortConfig.key} direction={sourceSortConfig.direction} /></div>
                  </th>
                  <th
                    className="px-5 py-3 text-right cursor-pointer hover:text-primary transition-colors"
                    onClick={() => toggleSourceSort('leads')}
                  >
                    <div className="flex items-center justify-end">Лиды <SortIcon currentKey="leads" configKey={sourceSortConfig.key} direction={sourceSortConfig.direction} /></div>
                  </th>
                  <th
                    className="px-5 py-3 text-right cursor-pointer hover:text-primary transition-colors"
                    onClick={() => toggleSourceSort('revenue')}
                  >
                    <div className="flex items-center justify-end">Выручка <SortIcon currentKey="revenue" configKey={sourceSortConfig.key} direction={sourceSortConfig.direction} /></div>
                  </th>
                  <th
                    className="px-5 py-3 text-right cursor-pointer hover:text-primary transition-colors"
                    onClick={() => toggleSourceSort('conversion')}
                  >
                    <div className="flex items-center justify-end">Конверсия <SortIcon currentKey="conversion" configKey={sourceSortConfig.key} direction={sourceSortConfig.direction} /></div>
                  </th>
                  <th className="px-5 py-3 text-right">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {sourceStats.map(s => (
                  <tr key={s.source} className="group hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4 flex items-center gap-3">
                      <div className={cn("p-1.5 rounded-lg bg-card border border-border shadow-sm", s.color)}>{s.icon}</div>
                      <span className="font-bold text-foreground">{s.label}</span>
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-bold text-foreground">{s.leads}</td>
                    <td className="px-5 py-4 text-right font-mono text-emerald-500 font-bold">{s.revenue > 0 ? formatValue(s.revenue, 'currency') : '—'}</td>
                    <td className="px-5 py-4 text-right">
                      <span className={cn("px-2 py-1 rounded-lg font-black text-[10px] shadow-sm", s.conversion > 10 ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-muted text-muted-foreground")}>
                        {s.conversion.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-primary">
                      {s.revenue > 0 && todaySpend > 0 ? ((s.revenue / (todaySpend / sourceStats.length)) * 100).toFixed(0) + '%' : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Top Campaigns */}
        <GlassCard className="p-0 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-border bg-muted/20 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-foreground uppercase tracking-tight text-xs">
              <Zap className="w-4 h-4 text-amber-500" />
              Топ кампаний
            </div>
            <div
              className="p-1 hover:bg-muted rounded-md cursor-pointer transition-colors"
              onClick={() => toggleCampaignSort('leads')}
            >
              <SortIcon currentKey="leads" configKey={campaignSortConfig.key} direction={campaignSortConfig.direction} />
            </div>
          </div>
          <div className="p-5 space-y-4">
            {campaignStats.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm italic">Нет данных по кампаниям</div>
            ) : (
              campaignStats.map((c, i) => (
                <div key={c.name} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div className="text-xs font-bold text-foreground truncate max-w-[200px]" title={c.name}>
                      <span className="text-primary mr-1">#{i + 1}</span> {c.name}
                    </div>
                    <div className="text-xs font-mono font-bold text-primary">{c.leads} лидов</div>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(c.leads / Math.max(...campaignStats.map(s => s.leads))) * 100}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>

      {/* ACTIVITY FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads Feed */}
        <GlassCard className="flex flex-col h-[450px] p-0 overflow-hidden border-border/50 shadow-sm relative">
          <div className="p-5 border-b border-border bg-muted/20 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
            <div className="flex items-center gap-2 font-black text-foreground uppercase tracking-tight text-xs">
              <Users className="w-4 h-4 text-blue-500" />
              Поток лидов
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-blue-500">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              LIVE FEED
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            <AnimatePresence mode="popLayout">
              {recentLeads.map(lead => (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center justify-between p-4 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-all group shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("w-2.5 h-2.5 rounded-full shadow-sm shadow-black/20", getStatusColor(lead.status))} />
                    <div>
                      <div className="text-sm font-black text-foreground group-hover:text-primary transition-colors">{lead.name || 'Аноним'}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase">{lead.status === 'new' ? 'Новый' : lead.status}</div>
                        <span className="text-xs text-muted-foreground/30">•</span>
                        <div className="text-[10px] text-muted-foreground font-mono">{format(new Date(lead.created_at), 'HH:mm')}</div>
                        {lead.utm_source && (
                          <>
                            <span className="text-xs text-muted-foreground/30">•</span>
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-primary/20 text-primary uppercase font-bold">{lead.utm_source}</Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {lead.deal_amount > 0 && (
                    <div className="text-sm font-black text-emerald-500">+{Math.round(lead.deal_amount).toLocaleString('ru-RU')} ₸</div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </GlassCard>

        {/* Transactions Feed */}
        <GlassCard className="flex flex-col h-[450px] p-0 overflow-hidden border-border/50 shadow-sm relative">
          <div className="p-5 border-b border-border bg-muted/20 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
            <div className="flex items-center gap-2 font-black text-foreground uppercase tracking-tight text-xs">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              Транзакции
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-emerald-500">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              CASHFLOW
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <AnimatePresence mode="popLayout">
              {recentTransactions.map(tx => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center justify-between p-4 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-all shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm",
                      tx.type === 'income' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                    )}>
                      {tx.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="text-sm font-black text-foreground uppercase">{tx.category === 'sales' ? 'Продажа' : tx.category}</div>
                      <div className="text-[10px] text-muted-foreground font-mono mt-1">
                        {tx.created_at ? format(new Date(tx.created_at), 'HH:mm:ss') : '--:--'}
                      </div>
                    </div>
                  </div>
                  <div className={cn("text-lg font-black tracking-tighter", tx.type === 'income' ? "text-emerald-500" : "text-red-500")}>
                    {tx.type === 'income' ? '+' : '-'}{Math.round(tx.amount).toLocaleString('ru-RU')} ₸
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
