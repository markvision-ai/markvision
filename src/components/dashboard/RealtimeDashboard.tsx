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
  organic: { label: 'Органика', icon: Globe, color: 'text-blue-500' },
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
      // 1. Leads
      // Use simpler date filter to avoid TZ issues
      const startOfMoMonth = new Date();
      startOfMoMonth.setDate(1);
      startOfMoMonth.setHours(0, 0, 0, 0);
      const startOfMoStr = startOfMoMonth.toISOString();

      const { data: leads } = await supabase
        .from('leads')
        .select('id, name, status, created_at, deal_amount, utm_source, utm_campaign')
        .eq('project_id', projectId)
        .gte('created_at', startOfMoStr)
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
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
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
      organic: { source: 'organic', label: 'Органика', icon: <Globe className="w-4 h-4" />, leads: 0, sales: 0, revenue: 0, conversion: 0, color: 'text-blue-500' },
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
        // If metaRows exists but is empty, we still want to show Meta leads from CRM
        // We only return (skip) if metaRows actually has data for Meta
        const hasOfficialMetaData = metaRows && metaRows.length > 0;
        if (hasOfficialMetaData) return;
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
      case 'paid': case 'success': case 'purchased': return 'bg-blue-500';
      case 'appointment': return 'bg-purple-500';
      case 'cancelled': case 'rejected': return 'bg-red-500';
      default: return 'bg-amber-500';
    }
  };

  if (!projectId) return <div className="p-12 text-center text-muted-foreground">Выберите проект</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 font-sans">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-primary/20 backdrop-blur-xl rounded-2xl text-primary shadow-interstellar border border-primary/20">
            <Radio className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-widest uppercase text-white">
              Контроль <span className="text-primary">трафика</span>
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-primary animate-ping" />
              <span className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">System Operational</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 px-6 py-3 bg-card/40 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-interstellar">
            {[
              { icon: Facebook, key: 'meta', label: 'Meta' },
              { icon: Webhook, key: 'n8n', label: 'n8n' },
              { icon: MessageCircle, key: 'whatsapp', label: 'WA' }
            ].map((s) => (
              <div key={s.key} className="flex items-center gap-2.5" title={s.label}>
                <div className={cn("w-2.5 h-2.5 rounded-full", systemStatus[s.key] ? "bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "bg-red-500")} />
                <s.icon className="w-4 h-4 text-white/40 hover:text-white transition-colors" />
              </div>
            ))}
          </div>

          <Badge variant="outline" className="px-5 py-2.5 border-white/10 bg-white/5 text-white/60 font-black uppercase tracking-[0.15em] text-[10px] gap-2 rounded-xl backdrop-blur-md">
            <Clock className="w-3.5 h-3.5 text-primary" />
            {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </Badge>
        </div>
      </div>

      {/* TOP METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {metrics.map((m, idx) => (
          <GlassCard key={m.label} className="p-8 transition-all hover:-translate-y-2 rounded-[2.5rem] border border-white/10 bg-card/30 backdrop-blur-3xl shadow-interstellar group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[60px] group-hover:bg-primary/10 transition-colors" />

            <div className="flex justify-between items-start mb-6">
              <div className={cn("p-4 rounded-2xl shadow-lg border border-white/10", m.bgColor)}>
                <div className={cn("text-primary")}>{m.icon}</div>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary border border-primary/20 text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-full">
                {m.subValue}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="text-5xl font-black tracking-tighter text-white">
                {formatValue(m.value, m.format)}
              </div>
              <div className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">{m.label}</div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* MIDDLE SECTION: SOURCES & CAMPAIGNS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Source Performance */}
        <GlassCard className="lg:col-span-2 p-0 flex flex-col overflow-hidden rounded-[2.5rem] border border-white/10 bg-card/30 backdrop-blur-3xl shadow-interstellar transition-all relative group">
          <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between backdrop-blur-3xl">
            <div className="flex items-center gap-3 font-black text-white uppercase tracking-widest text-[10px]">
              <Target className="w-4 h-4 text-primary" />
              Эффективность каналов <span className="text-[10px] font-black text-white/30 ml-4 tracking-normal font-sans">MTD</span>
            </div>
            <Badge className="bg-primary/20 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
              Real-time Attribution
            </Badge>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-white/40 text-[10px] uppercase font-black border-b border-white/5 tracking-widest">
                <tr>
                  <th
                    className="px-8 py-5 text-left cursor-pointer hover:text-white transition-colors"
                    onClick={() => toggleSourceSort('label')}
                  >
                    <div className="flex items-center">Источник <SortIcon currentKey="label" configKey={sourceSortConfig.key} direction={sourceSortConfig.direction} /></div>
                  </th>
                  <th
                    className="px-8 py-5 text-right cursor-pointer hover:text-white transition-colors"
                    onClick={() => toggleSourceSort('leads')}
                  >
                    <div className="flex items-center justify-end">Лиды <SortIcon currentKey="leads" configKey={sourceSortConfig.key} direction={sourceSortConfig.direction} /></div>
                  </th>
                  <th
                    className="px-8 py-5 text-right cursor-pointer hover:text-white transition-colors"
                    onClick={() => toggleSourceSort('revenue')}
                  >
                    <div className="flex items-center justify-end">Выручка <SortIcon currentKey="revenue" configKey={sourceSortConfig.key} direction={sourceSortConfig.direction} /></div>
                  </th>
                  <th
                    className="px-8 py-5 text-right cursor-pointer hover:text-white transition-colors"
                    onClick={() => toggleSourceSort('conversion')}
                  >
                    <div className="flex items-center justify-end">Конверсия <SortIcon currentKey="conversion" configKey={sourceSortConfig.key} direction={sourceSortConfig.direction} /></div>
                  </th>
                  <th className="px-8 py-5 text-right">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sourceStats.map(s => (
                  <tr key={s.source} className="group hover:bg-white/5 transition-colors">
                    <td className="px-8 py-6 flex items-center gap-4">
                      <div className={cn("p-2.5 rounded-xl bg-card/40 backdrop-blur-2xl border border-white/10 shadow-interstellar", s.color)}>{s.icon}</div>
                      <span className="font-black text-white/90 uppercase tracking-wider text-[11px]">{s.label}</span>
                    </td>
                    <td className="px-8 py-6 text-right font-black text-white/80 tabular-nums">{s.leads}</td>
                    <td className="px-8 py-6 text-right font-black text-primary tabular-nums text-lg">{s.revenue > 0 ? formatValue(s.revenue, 'currency') : '—'}</td>
                    <td className="px-8 py-6 text-right">
                      <span className={cn("px-4 py-2 rounded-full font-black text-[10px] tracking-widest shadow-lg uppercase", s.conversion > 10 ? "bg-primary/20 text-primary border border-primary/20" : "bg-white/5 text-white/40")}>
                        {s.conversion.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right font-black text-secondary tabular-nums">
                      {s.revenue > 0 && todaySpend > 0 ? ((s.revenue / (todaySpend / sourceStats.length)) * 100).toFixed(0) + '%' : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Top Campaigns */}
        <GlassCard className="p-0 flex flex-col overflow-hidden rounded-[2.5rem] border border-white/10 bg-card/30 backdrop-blur-3xl shadow-interstellar transition-all relative group">
          <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between backdrop-blur-3xl">
            <div className="flex items-center gap-3 font-black text-white uppercase tracking-widest text-[10px]">
              <Zap className="w-4 h-4 text-secondary" />
              Топ кампаний
            </div>
            <div
              className="p-1.5 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
              onClick={() => toggleCampaignSort('leads')}
            >
              <SortIcon currentKey="leads" configKey={campaignSortConfig.key} direction={campaignSortConfig.direction} />
            </div>
          </div>
          <div className="p-8 space-y-6">
            {campaignStats.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm italic">Нет данных по кампаниям</div>
            ) : (
              campaignStats.map((c, i) => (
                <div key={c.name} className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div className="text-[10px] font-black text-white uppercase tracking-widest truncate max-w-[180px]" title={c.name}>
                      <span className="text-primary mr-2">#{i + 1}</span> {c.name}
                    </div>
                    <div className="text-[10px] font-black text-primary uppercase tracking-widest">{c.leads} лидов</div>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(c.leads / Math.max(...campaignStats.map(s => s.leads))) * 100}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-primary to-secondary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>

      {/* ACTIVITY FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Leads Feed */}
        <GlassCard className="flex flex-col h-[500px] p-0 overflow-hidden rounded-[2.5rem] border border-white/10 bg-card/30 backdrop-blur-3xl shadow-interstellar transition-all relative group">
          <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between sticky top-0 z-10 backdrop-blur-3xl">
            <div className="flex items-center gap-3 font-black text-white uppercase tracking-widest text-[10px]">
              <Users className="w-4 h-4 text-primary" />
              Поток лидов
            </div>
            <div className="flex items-center gap-2 font-black text-[10px] text-primary tracking-widest uppercase">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
              </span>
              REALTIME CHANNEL
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
            <AnimatePresence mode="popLayout">
              {recentLeads.map(lead => (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center justify-between p-5 rounded-[2rem] border border-white/5 bg-white/5 backdrop-blur-3xl hover:bg-white/10 transition-all group shadow-sm hover:shadow-xl"
                >
                  <div className="flex items-center gap-5">
                    <div className={cn("w-3 h-3 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]", getStatusColor(lead.status))} />
                    <div>
                      <div className="text-sm font-black text-white/90 uppercase tracking-widest group-hover:text-primary transition-colors">{lead.name || 'Аноним'}</div>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">{lead.status === 'new' ? 'Новый' : lead.status}</div>
                        <span className="text-white/10">•</span>
                        <div className="text-[9px] text-white/30 font-black tracking-widest uppercase">{format(new Date(lead.created_at), 'HH:mm')}</div>
                        {lead.utm_source && (
                          <>
                            <span className="text-white/10">•</span>
                            <Badge variant="outline" className="text-[8px] px-2 py-0.5 h-auto border-primary/20 bg-primary/10 text-primary uppercase font-black tracking-widest rounded-full">{lead.utm_source}</Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {lead.deal_amount > 0 && (
                    <div className="text-sm font-black text-primary tabular-nums">+{Math.round(lead.deal_amount).toLocaleString('ru-RU')} ₸</div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </GlassCard>

        {/* Transactions Feed */}
        <GlassCard className="flex flex-col h-[450px] p-0 overflow-hidden rounded-3xl border border-white/10 bg-[#020617]/60 backdrop-blur-3xl shadow-interstellar hover:shadow-2xl hover:shadow-primary/10 transition-all relative group">
          <div className="p-5 border-b border-white/5 bg-white/5 flex items-center justify-between sticky top-0 z-10 backdrop-blur-xl">
            <div className="flex items-center gap-2 font-black text-white/90 uppercase tracking-tight text-xs">
              <DollarSign className="w-4 h-4 text-primary" />
              Транзакции
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-primary">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
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
                  className="flex items-center justify-between p-5 rounded-[2rem] border border-white/5 bg-white/5 backdrop-blur-3xl hover:bg-white/10 transition-all shadow-sm hover:shadow-xl"
                >
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg backdrop-blur-md",
                      tx.type === 'income' ? "bg-primary/20 text-primary border-primary/20" : "bg-red-500/20 text-red-500 border-red-500/20"
                    )}>
                      {tx.type === 'income' ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="text-sm font-black text-white/90 uppercase tracking-widest">{tx.category === 'sales' ? 'Продажа' : tx.category}</div>
                      <div className="text-[9px] text-white/30 font-black tracking-widest uppercase mt-2">
                        {tx.created_at ? format(new Date(tx.created_at), 'HH:mm:ss') : '--:--'}
                      </div>
                    </div>
                  </div>
                  <div className={cn("text-xl font-black tracking-tighter tabular-nums", tx.type === 'income' ? "text-primary" : "text-red-500")}>
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
