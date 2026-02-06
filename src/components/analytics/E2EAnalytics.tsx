import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Zap, 
  TrendingUp, 
  TrendingDown,
  FileBarChart, 
  Globe, 
  BarChart3,
  Target,
  MousePointer,
  Users,
  DollarSign,
  ShoppingCart,
  ChevronRight,
  Loader2,
  Percent,
  Award,
  AlertCircle,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  SplitSquareVertical,
  Radio
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { format, parseISO, startOfDay, isWithinInterval } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DateRangePicker } from '@/components/dashboard/DateRangePicker';
import { AIAssistant } from './AIAssistant';

interface E2EAnalyticsProps {
  totals: {
    spend: number;
    impressions: number;
    clicks: number;
    leads: number;
    visits: number;
    sales: number;
    revenue: number;
  };
  projectId?: string | null;
}
interface MetaMetrics {
  spend: number;
  impressions: number;
  clicks: number;
  leads?: number;
}

interface Lead {
  id: string;
  name: string | null;
  status: string | null;
  deal_amount: number | null;
  utm_source: string | null;
  utm_campaign: string | null;
  created_at: string;
  extra_data: { site_url?: string } | null;
}

interface DailyData {
  id: string;
  date: string;
  spend: number;
  clicks: number;
  impressions: number;
  leads: number;
  visits: number;
  sales: number;
  revenue: number;
}

interface DateRange {
  from: Date;
  to: Date;
}

// Format currency with rounding
const formatCurrency = (value: number): string => {
  const rounded = Math.round(value);
  return new Intl.NumberFormat('ru-RU').format(rounded) + ' ₸';
};

const formatCurrencyShort = (value: number): string => {
  const rounded = Math.round(value);
  if (rounded >= 1000000) return (rounded / 1000000).toFixed(1) + 'M ₸';
  if (rounded >= 1000) return Math.round(rounded / 1000) + 'K ₸';
  return new Intl.NumberFormat('ru-RU').format(rounded) + ' ₸';
};

const formatNumber = (value: number): string => {
  if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
  if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
  return new Intl.NumberFormat('ru-RU').format(Math.round(value));
};

const SOURCE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  google: { label: 'Google Ads', icon: '🔍', color: '#EA4335' },
  facebook: { label: 'Facebook', icon: '📘', color: '#1877F2' },
  instagram: { label: 'Instagram', icon: '📷', color: '#E4405F' },
  tiktok: { label: 'TikTok', icon: '🎵', color: '#000000' },
  youtube: { label: 'YouTube', icon: '▶️', color: '#FF0000' },
  yandex: { label: 'Яндекс', icon: '🟡', color: '#FFCC00' },
  vk: { label: 'VK', icon: '💬', color: '#4680C2' },
  telegram: { label: 'Telegram', icon: '✈️', color: '#0088CC' },
  whatsapp: { label: 'WhatsApp', icon: '💬', color: '#25D366' },
  manual: { label: 'Ручной ввод', icon: '✍️', color: '#6B7280' },
  direct: { label: 'Прямой трафик', icon: '🔗', color: '#6B7280' },
  other: { label: 'Другое', icon: '📊', color: '#9CA3AF' },
};

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

const getSourceCategory = (utm_source: string | null): string => {
  if (!utm_source) return 'direct';
  const s = utm_source.toLowerCase();
  if (s.includes('google') || s.includes('gclid')) return 'google';
  if (s.includes('facebook') || s.includes('fb') || s.includes('meta')) return 'facebook';
  if (s.includes('instagram') || s.includes('ig')) return 'instagram';
  if (s.includes('tiktok') || s.includes('tt')) return 'tiktok';
  if (s.includes('youtube') || s.includes('yt')) return 'youtube';
  if (s.includes('yandex') || s.includes('ya')) return 'yandex';
  if (s.includes('vk') || s.includes('vkontakte')) return 'vk';
  if (s.includes('telegram') || s.includes('tg')) return 'telegram';
  if (s.includes('whatsapp') || s.includes('wa')) return 'whatsapp';
  if (s.includes('manual')) return 'manual';
  return 'other';
};

// Visit statuses
const VISIT_STATUSES = ['visit_completed', 'qualified', 'proposal', 'purchased']; 
const SALE_STATUSES = ['purchased'];

export const E2EAnalytics = ({ totals, projectId }: E2EAnalyticsProps) => {
  const pid = projectId || '64c94e87-630c-470e-8ab1-8f7c8c835efa';
  const [activeTab, setActiveTab] = useState<'sales-roi' | 'split-tests' | 'sources'>('sales-roi');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [metaMetrics, setMetaMetrics] = useState<MetaMetrics | null>(null);

  // Fetch leads data
  const fetchLeads = useCallback(async () => {
    if (!pid) {
      setLeads([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, name, status, deal_amount, utm_source, utm_campaign, created_at, extra_data')
        .eq('project_id', pid);

      if (error) throw error;
      setLeads((data || []) as Lead[]);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching leads:', error);
      }
    }
  }, [pid]);

  // Fetch daily marketing data
  const fetchDailyData = useCallback(async () => {
    if (!pid) {
      setDailyData([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('daily_data')
        .select('*')
        .eq('project_id', pid)
        .order('date', { ascending: true });

      if (error) throw error;
      
      // Map database 'visit_results' (legacy diagnostics) field to 'visits'
      const mappedData = (data || []).map((item: any) => ({
        ...item,
        visits: item.visits || item.visit_results || item.diagnostics || 0,
      }));
      
      setDailyData(mappedData as DailyData[]);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching daily data:', error);
      }
    }
  }, [pid]);

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchLeads(), fetchDailyData()]);
      setLoading(false);
    };
    loadData();
  }, [fetchLeads, fetchDailyData]);

  // Realtime subscription for leads
  useEffect(() => {
    if (!pid) return;

    const channel = supabase
      .channel('e2e-analytics-leads')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `project_id=eq.${pid}`
        },
        () => {
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pid, fetchLeads]);

  // Filter data by date range
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const leadDate = parseISO(lead.created_at);
      return isWithinInterval(leadDate, { start: dateRange.from, end: dateRange.to });
    });
  }, [leads, dateRange]);

  const filteredDailyData = useMemo(() => {
    return dailyData.filter(day => {
      const dayDate = parseISO(day.date);
      return isWithinInterval(dayDate, { start: dateRange.from, end: dateRange.to });
    });
  }, [dailyData, dateRange]);

  // Aggregate totals from filtered data
  const filteredTotals = useMemo(() => {
    const t = filteredDailyData.reduce((acc, day) => ({
      spend: acc.spend + Number(day.spend || 0),
      clicks: acc.clicks + Number(day.clicks || 0),
      impressions: acc.impressions + Number(day.impressions || 0),
      leads: acc.leads + Number(day.leads || 0),
      visits: acc.visits + Number(day.visits || 0),
      sales: acc.sales + Number(day.sales || 0),
      revenue: acc.revenue + Number(day.revenue || 0),
    }), { spend: 0, clicks: 0, impressions: 0, leads: 0, visits: 0, sales: 0, revenue: 0 });

    // If no daily data, use leads data
    if (filteredDailyData.length === 0) {
      const leadsCount = filteredLeads.length;
      const visitCount = filteredLeads.filter(l => VISIT_STATUSES.includes(l.status || '')).length;
      const salesCount = filteredLeads.filter(l => SALE_STATUSES.includes(l.status || '')).length;
      const revenueSum = filteredLeads.filter(l => l.status === 'purchased').reduce((sum, l) => sum + (l.deal_amount || 0), 0);
      
      return {
        ...totals,
        leads: leadsCount || totals.leads,
        visits: visitCount || totals.visits,
        sales: salesCount || totals.sales,
        revenue: revenueSum || totals.revenue,
      };
    }

    return t;
  }, [filteredDailyData, filteredLeads, totals]);

  // ==================== TAB 1: Sales ROI (by site_url) ====================
  const siteStats = useMemo(() => {
    const sites: Record<string, { 
      leads: number; 
      visits: number; 
      sales: number; 
      revenue: number;
    }> = {};

    filteredLeads.forEach(lead => {
      const siteUrl = lead.extra_data?.site_url || lead.utm_campaign || 'Не указан';
      if (!sites[siteUrl]) {
        sites[siteUrl] = { leads: 0, visits: 0, sales: 0, revenue: 0 };
      }
      sites[siteUrl].leads++;
      if (VISIT_STATUSES.includes(lead.status || '')) {
        sites[siteUrl].visits++;
      }
      if (lead.status === 'purchased') {
        sites[siteUrl].sales++;
        sites[siteUrl].revenue += lead.deal_amount || 0;
      }
    });

    return Object.entries(sites).map(([url, stats]) => ({
      name: url,
      ...stats
    })).sort((a, b) => b.revenue - a.revenue);
  }, [filteredLeads]);

  // ==================== TAB 2: Split Tests (UTM Source) ====================
  const sourceStats = useMemo(() => {
    const sources: Record<string, {
      leads: number;
      visits: number;
      sales: number;
      revenue: number;
    }> = {};

    filteredLeads.forEach(lead => {
      const source = getSourceCategory(lead.utm_source);
      if (!sources[source]) {
        sources[source] = { leads: 0, visits: 0, sales: 0, revenue: 0 };
      }
      sources[source].leads++;
      if (VISIT_STATUSES.includes(lead.status || '')) {
        sources[source].visits++;
      }
      if (lead.status === 'purchased') {
        sources[source].sales++;
        sources[source].revenue += lead.deal_amount || 0;
      }
    });

    return Object.entries(sources).map(([source, stats]) => ({
      name: SOURCE_CONFIG[source]?.label || source,
      icon: SOURCE_CONFIG[source]?.icon || '📊',
      color: SOURCE_CONFIG[source]?.color || '#9CA3AF',
      ...stats
    })).sort((a, b) => b.leads - a.leads);
  }, [filteredLeads]);

  // ==================== TAB 3: Sources (Pie Charts) ====================
  const pieData = useMemo(() => {
    return sourceStats.map((s, index) => ({
      name: s.name,
      value: s.leads,
      color: PIE_COLORS[index % PIE_COLORS.length]
    }));
  }, [sourceStats]);

  const [projectCfg, setProjectCfg] = useState<{ ad_account_id?: string; cost_rate?: number } | null>(null);
  const [paymentsSummary, setPaymentsSummary] = useState<{ count: number; revenue: number } | null>(null);
  useEffect(() => {
    const loadProject = async () => {
      if (!pid) return;
      const { data } = await supabase.from('projects').select('ad_account_id, cost_rate').eq('id', pid).single();
      setProjectCfg(data as any);
    };
    const loadPayments = async () => {
      if (!pid) return;
      const { data } = await supabase.from('payments').select('amount').eq('project_id', pid);
      const amounts = (data as any[] || []).map(d => Number(d.amount || 0));
      setPaymentsSummary({ count: amounts.length, revenue: amounts.reduce((a,b)=>a+b,0) });
    };
    loadProject();
    loadPayments();
  }, [pid]);

  const visitsCount = useMemo(() => {
    return filteredLeads.filter(l => (l.status || '').toLowerCase().includes('запис') || (l.status || '').toLowerCase().includes('visit') ).length;
  }, [filteredLeads]);

  const aov = useMemo(() => {
    return paymentsSummary?.count ? (paymentsSummary.revenue || 0) / (paymentsSummary.count || 1) : 0;
  }, [paymentsSummary]);

  const totalSpend = useMemo(() => {
    return Number(metaMetrics?.spend || 0);
  }, [metaMetrics]);

  const salesCount = paymentsSummary?.count || 0;
  const revenueSum = paymentsSummary?.revenue || 0;
  const cogs = (projectCfg?.cost_rate ? projectCfg.cost_rate : 0) * revenueSum;
  const profit = Math.max(0, revenueSum - totalSpend - cogs);
  const leadsCount = filteredLeads.length;
  const impressions = metaMetrics?.impressions || 0;
  const clicks = metaMetrics?.clicks || 0;
  const cpl = leadsCount ? totalSpend / leadsCount : 0;
  const cac = salesCount ? totalSpend / salesCount : 0;
  const roi = totalSpend ? (revenueSum - totalSpend) / totalSpend : 0;

  useEffect(() => {
    const saveLog = async () => {
      if (!pid) return;
      const day = new Date().toISOString().slice(0,10);
      await supabase.from('ad_performance_logs').insert({
        project_id: pid,
        date: day,
        source: 'meta',
        spend: totalSpend,
        impressions,
        clicks,
        leads: leadsCount,
        visits: visitsCount,
        sales: salesCount,
        revenue: revenueSum,
        profit
      } as any);
    };
    saveLog();
  }, [pid, totalSpend, impressions, clicks, leadsCount, visitsCount, salesCount, revenueSum, profit]);

  const syncMeta = useCallback(async () => {
    try {
      setMetaLoading(true);
      setMetaError(null);
      const sessionRes: any = await supabase.auth.getSession();
      const token = sessionRes?.data?.session?.provider_token;
      const accountId = projectCfg?.ad_account_id || (sessionRes?.data?.session?.user?.user_metadata?.ad_account_id) || null;
      if (!token || !accountId) {
        setMetaError('Meta не подключена или отсутствует ad_account_id');
        setMetaLoading(false);
        return;
      }
      const url = `https://graph.facebook.com/v18.0/act_${accountId}/insights?fields=spend,impressions,clicks,actions&date_preset=today&time_increment=1&access_token=${encodeURIComponent(token)}`;
      const res = await fetch(url);
      if (!res.ok) {
        setMetaError('Ошибка запроса к Meta Graph API');
        setMetaLoading(false);
        return;
      }
      const json = await res.json();
      const row = json?.data?.[0] || {};
      const spend = Number(row.spent || row.spend || 0);
      const impressions = Number(row.impressions || 0);
      const clicks = Number(row.clicks || 0);
      const actions = Array.isArray(row.actions) ? row.actions : [];
      const leadsAction = actions.find((a: any) => (a.action_type || '').includes('lead'));
      const leadsVal = Number(leadsAction?.value || 0);
      setMetaMetrics({ spend, impressions, clicks, leads: leadsVal });
    } catch (e: any) {
      setMetaError('Не удалось синхронизировать Meta');
    } finally {
      setMetaLoading(false);
    }
  }, [pid]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Date Picker & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <DateRangePicker 
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
        <Button variant="outline" size="sm" onClick={() => { fetchLeads(); fetchDailyData(); }}>
          <Loader2 className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/60">Meta Ads (Beta)</CardTitle>
            <Globe className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={syncMeta} disabled={metaLoading}>
                {metaLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Синхронизировать
              </Button>
              {metaError && <Badge variant="destructive">{metaError}</Badge>}
            </div>
            {metaMetrics && (
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 bg-white/5 rounded">
                  <div className="text-white/60">Расход</div>
                  <div className="font-bold text-white">{formatCurrencyShort(metaMetrics.spend)}</div>
                </div>
                <div className="p-2 bg-white/5 rounded">
                  <div className="text-white/60">Показы</div>
                  <div className="font-bold text-white">{formatNumber(metaMetrics.impressions)}</div>
                </div>
                <div className="p-2 bg-white/5 rounded">
                  <div className="text-white/60">Клики</div>
                  <div className="font-bold text-white">{formatNumber(metaMetrics.clicks)}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/60">Расходы (РК)</CardTitle>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrencyShort(filteredTotals.spend)}</div>
            <p className="text-xs text-white/40 mt-1">Бюджет рекламных кампаний</p>
          </CardContent>
        </Card>
        
        <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/60">Лиды</CardTitle>
            <Users className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatNumber(filteredTotals.leads)}</div>
            <p className="text-xs text-white/40 mt-1">CPL: {filteredTotals.leads > 0 ? formatCurrency(filteredTotals.spend / filteredTotals.leads) : '0 ₸'}</p>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/60">Диагностика</CardTitle>
            <Target className="w-4 h-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{filteredTotals.visits}</div>
            <p className="text-xs text-white/40 mt-1">Conv: {filteredTotals.leads > 0 ? ((filteredTotals.visits / filteredTotals.leads) * 100).toFixed(1) : 0}%</p>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/5 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/60">Выручка</CardTitle>
            <ShoppingCart className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrencyShort(filteredTotals.revenue)}</div>
            <p className="text-xs text-white/40 mt-1">ROI: {filteredTotals.spend > 0 ? (((filteredTotals.revenue - filteredTotals.spend) / filteredTotals.spend) * 100).toFixed(0) : 0}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="premium-card p-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-white/80 text-sm">MarkVision Online</CardTitle>
            <CardDescription className="text-white/60 text-sm">Капитан Запойнов, система готова к анализу прибыли.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <AIAssistant context={{ projectId: pid, romi: roi, cac, cpl, revenue: revenueSum, spend: totalSpend, impressions, clicks, leads: leadsCount, sales: salesCount }} />
          </CardContent>
        </Card>
        <Card className="premium-card p-6 col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-white/80 text-sm">Impression → Profit</CardTitle>
            <CardDescription className="text-white/60 text-xs">Путь клиента от показа до прибыли</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              <div className="welcome-hero-kpi">
                <div className="kpi-value">{formatNumber(impressions)}</div>
                <div className="kpi-label">Показы</div>
              </div>
              <div className="welcome-hero-kpi">
                <div className="kpi-value">{formatNumber(clicks)}</div>
                <div className="kpi-label">Клики</div>
              </div>
              <div className="welcome-hero-kpi">
                <div className="kpi-value">{formatNumber(leadsCount)}</div>
                <div className="kpi-label">Лиды</div>
              </div>
              <div className="welcome-hero-kpi">
                <div className="kpi-value">{formatNumber(visitsCount)}</div>
                <div className="kpi-label">Визиты</div>
              </div>
              <div className="welcome-hero-kpi">
                <div className="kpi-value">{formatNumber(salesCount)}</div>
                <div className="kpi-label">Продажи</div>
              </div>
              <div className="welcome-hero-kpi">
                <div className="kpi-value">{formatCurrencyShort(profit)}</div>
                <div className="kpi-label">Чистая прибыль</div>
              </div>
            </div>
            <div className="ui-divider" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="welcome-hero-kpi">
                <div className="kpi-value">{formatCurrencyShort(cpl)}</div>
                <div className="kpi-label">CPL</div>
              </div>
              <div className="welcome-hero-kpi">
                <div className="kpi-value">{formatCurrencyShort(cac)}</div>
                <div className="kpi-label">CAC</div>
              </div>
              <div className="welcome-hero-kpi">
                <div className="kpi-value">{(roi*100).toFixed(0)}%</div>
                <div className="kpi-label">ROI</div>
              </div>
              <div className="welcome-hero-kpi">
                <div className="kpi-value">{formatCurrencyShort(aov)}</div>
                <div className="kpi-label">AOV</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="sales-roi" className="w-full" onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="bg-black/40 border border-white/5 p-1">
          <TabsTrigger value="sales-roi" className="data-[state=active]:bg-white/10">
            <TrendingUp className="w-4 h-4 mr-2" />
            ROI и Продажи
          </TabsTrigger>
          <TabsTrigger value="split-tests" className="data-[state=active]:bg-white/10">
            <SplitSquareVertical className="w-4 h-4 mr-2" />
            Сплит-тесты (Источники)
          </TabsTrigger>
          <TabsTrigger value="sources" className="data-[state=active]:bg-white/10">
            <PieChartIcon className="w-4 h-4 mr-2" />
            Распределение
          </TabsTrigger>
        </TabsList>

        {/* Tab Content: ROI Table */}
        <TabsContent value="sales-roi" className="mt-4">
          <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg text-white">Эффективность посадочных страниц (Site URL)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-white/40 uppercase bg-white/5">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">Страница (URL)</th>
                      <th className="px-4 py-3 text-right">Лиды</th>
                      <th className="px-4 py-3 text-right">Диагностика</th>
                      <th className="px-4 py-3 text-right">Продажи</th>
                      <th className="px-4 py-3 text-right rounded-r-lg">Выручка</th>
                    </tr>
                  </thead>
                  <tbody>
                    {siteStats.map((site, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 font-medium text-white truncate max-w-[200px]">{site.name}</td>
                        <td className="px-4 py-3 text-right text-white/80">{site.leads}</td>
                        <td className="px-4 py-3 text-right text-purple-400">{site.visits}</td>
                        <td className="px-4 py-3 text-right text-emerald-400">{site.sales}</td>
                        <td className="px-4 py-3 text-right text-white font-bold">{formatCurrencyShort(site.revenue)}</td>
                      </tr>
                    ))}
                    {siteStats.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-white/40">Нет данных за выбранный период</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Content: Split Tests */}
        <TabsContent value="split-tests" className="mt-4">
          <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg text-white">Анализ источников трафика</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                {sourceStats.map((source, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-black/40 border border-white/10 text-xl">
                        {source.icon}
                      </div>
                      <div>
                        <div className="font-medium text-white">{source.name}</div>
                        <div className="text-xs text-white/40">Лидов: {source.leads}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-sm text-white/60">Диагностика</div>
                        <div className="font-mono text-purple-400">{source.visits}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-white/60">Продажи</div>
                        <div className="font-mono text-emerald-400">{source.sales}</div>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <div className="text-sm text-white/60">Выручка</div>
                        <div className="font-bold text-white">{formatCurrencyShort(source.revenue)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Content: Sources Pie */}
        <TabsContent value="sources" className="mt-4">
          <Card className="bg-black/40 border-white/5 backdrop-blur-xl h-[400px]">
            <CardHeader>
              <CardTitle className="text-lg text-white">Распределение лидов</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.5)" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* AI Assistant Section */}
      <div className="mt-8">
        <AIAssistant context={{
          spend: filteredTotals.spend,
          impressions: filteredTotals.impressions,
          clicks: filteredTotals.clicks,
          leads: filteredTotals.leads,
          visits: filteredTotals.visits,
          sales: filteredTotals.sales,
          revenue: filteredTotals.revenue,
          romi: filteredTotals.spend > 0 ? (((filteredTotals.revenue - filteredTotals.spend) / filteredTotals.spend) * 100) : 0,
          projectId: pid
        }} />
      </div>

    </div>
  );
};
