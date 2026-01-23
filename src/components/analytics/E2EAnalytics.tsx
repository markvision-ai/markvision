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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/externalSupabase';
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
    diagnostics: number;
    sales: number;
    revenue: number;
  };
  projectId?: string | null;
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
  diagnostics: number;
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

// Diagnostic statuses
const DIAGNOSTIC_STATUSES = ['diagnostic', 'qualified', 'proposal', 'purchased'];
const SALE_STATUSES = ['purchased'];

export const E2EAnalytics = ({ totals, projectId }: E2EAnalyticsProps) => {
  const [activeTab, setActiveTab] = useState<'sales-roi' | 'split-tests' | 'sources'>('sales-roi');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });

  // Fetch leads data
  const fetchLeads = useCallback(async () => {
    if (!projectId) {
      setLeads([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, name, status, deal_amount, utm_source, utm_campaign, created_at, extra_data')
        .eq('project_id', projectId);

      if (error) throw error;
      setLeads((data || []) as Lead[]);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching leads:', error);
      }
    }
  }, [projectId]);

  // Fetch daily marketing data
  const fetchDailyData = useCallback(async () => {
    if (!projectId) {
      setDailyData([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('daily_data')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: true });

      if (error) throw error;
      setDailyData((data || []) as DailyData[]);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching daily data:', error);
      }
    }
  }, [projectId]);

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
    if (!projectId) return;

    const channel = supabase
      .channel('e2e-analytics-leads')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, fetchLeads]);

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
      diagnostics: acc.diagnostics + Number(day.diagnostics || 0),
      sales: acc.sales + Number(day.sales || 0),
      revenue: acc.revenue + Number(day.revenue || 0),
    }), { spend: 0, clicks: 0, impressions: 0, leads: 0, diagnostics: 0, sales: 0, revenue: 0 });

    // If no daily data, use leads data
    if (filteredDailyData.length === 0) {
      const leadsCount = filteredLeads.length;
      const diagCount = filteredLeads.filter(l => DIAGNOSTIC_STATUSES.includes(l.status || '')).length;
      const salesCount = filteredLeads.filter(l => SALE_STATUSES.includes(l.status || '')).length;
      const revenueSum = filteredLeads.filter(l => l.status === 'purchased').reduce((sum, l) => sum + (l.deal_amount || 0), 0);
      
      return {
        ...totals,
        leads: leadsCount || totals.leads,
        diagnostics: diagCount || totals.diagnostics,
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
      diagnostics: number; 
      sales: number; 
      revenue: number;
    }> = {};

    filteredLeads.forEach(lead => {
      const siteUrl = lead.extra_data?.site_url || lead.utm_campaign || 'Не указан';
      if (!sites[siteUrl]) {
        sites[siteUrl] = { leads: 0, diagnostics: 0, sales: 0, revenue: 0 };
      }
      sites[siteUrl].leads++;
      if (DIAGNOSTIC_STATUSES.includes(lead.status || '')) {
        sites[siteUrl].diagnostics++;
      }
      if (lead.status === 'purchased') {
        sites[siteUrl].sales++;
        sites[siteUrl].revenue += lead.deal_amount || 0;
      }
    });

    return Object.entries(sites).map(([site, data]) => ({
      site,
      leads: data.leads,
      diagnostics: data.diagnostics,
      sales: data.sales,
      revenue: data.revenue,
      cr2: data.leads > 0 ? (data.sales / data.leads) * 100 : 0,
      roi: data.revenue > 0 ? ((data.revenue - (filteredTotals.spend * (data.leads / (filteredLeads.length || 1)))) / (filteredTotals.spend * (data.leads / (filteredLeads.length || 1)))) * 100 : 0
    })).sort((a, b) => b.revenue - a.revenue);
  }, [filteredLeads, filteredTotals]);

  const siteRevenuePieData = useMemo(() => {
    return siteStats.filter(s => s.revenue > 0).map((s, i) => ({
      name: s.site.length > 20 ? s.site.substring(0, 20) + '...' : s.site,
      value: s.revenue,
      fill: PIE_COLORS[i % PIE_COLORS.length]
    }));
  }, [siteStats]);

  // ==================== TAB 2: Split Tests (by site_url / offer) ====================
  const splitTestStats = useMemo(() => {
    const offers: Record<string, { leads: number }> = {};
    
    filteredLeads.forEach(lead => {
      const offer = lead.extra_data?.site_url || lead.utm_campaign || 'Не указан';
      if (!offers[offer]) {
        offers[offer] = { leads: 0 };
      }
      offers[offer].leads++;
    });

    const totalLeads = filteredLeads.length || 1;

    return Object.entries(offers).map(([offer, data]) => {
      const proportionalSpend = (data.leads / totalLeads) * filteredTotals.spend;
      const proportionalClicks = (data.leads / totalLeads) * filteredTotals.clicks;
      const cr1 = proportionalClicks > 0 ? (data.leads / proportionalClicks) * 100 : 0;
      const cpl = data.leads > 0 ? Math.round(proportionalSpend / data.leads) : 0;
      
      return {
        offer,
        spend: proportionalSpend,
        clicks: proportionalClicks,
        leads: data.leads,
        cr1,
        cpl
      };
    }).sort((a, b) => b.leads - a.leads);
  }, [filteredLeads, filteredTotals]);

  // Daily leads dynamics for Split Tests tab
  const dailyLeadsDynamics = useMemo(() => {
    const daily: Record<string, { date: string; leads: number }> = {};

    filteredLeads.forEach(lead => {
      const dateKey = format(startOfDay(parseISO(lead.created_at)), 'yyyy-MM-dd');
      if (!daily[dateKey]) {
        daily[dateKey] = { date: dateKey, leads: 0 };
      }
      daily[dateKey].leads++;
    });

    return Object.values(daily)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(day => ({
        ...day,
        dateLabel: format(parseISO(day.date), 'd MMM', { locale: ru })
      }));
  }, [filteredLeads]);

  // ==================== TAB 3: Traffic Sources (by utm_source) ====================
  const sourceStats = useMemo(() => {
    const sources: Record<string, { leads: number; diagnostics: number; sales: number; revenue: number }> = {};

    filteredLeads.forEach(lead => {
      const source = getSourceCategory(lead.utm_source);
      if (!sources[source]) {
        sources[source] = { leads: 0, diagnostics: 0, sales: 0, revenue: 0 };
      }
      sources[source].leads++;
      if (DIAGNOSTIC_STATUSES.includes(lead.status || '')) {
        sources[source].diagnostics++;
      }
      if (lead.status === 'purchased') {
        sources[source].sales++;
        sources[source].revenue += lead.deal_amount || 0;
      }
    });

    const totalLeads = filteredLeads.length || 1;

    return Object.entries(sources).map(([source, data]) => {
      const config = SOURCE_CONFIG[source] || SOURCE_CONFIG.other;
      const proportionalSpend = (data.leads / totalLeads) * filteredTotals.spend;
      const costPerDiagnostic = data.diagnostics > 0 ? proportionalSpend / data.diagnostics : 0;
      
      return {
        source,
        label: config.label,
        icon: config.icon,
        color: config.color,
        leads: data.leads,
        diagnostics: data.diagnostics,
        sales: data.sales,
        revenue: data.revenue,
        spend: proportionalSpend,
        costPerDiagnostic
      };
    }).sort((a, b) => b.leads - a.leads);
  }, [filteredLeads, filteredTotals]);

  // Source conversion bar chart data
  const sourceConversionData = useMemo(() => {
    return sourceStats.map(s => ({
      name: s.label,
      leads: s.leads,
      diagnostics: s.diagnostics,
      sales: s.sales,
      conversion: s.leads > 0 ? (s.diagnostics / s.leads) * 100 : 0
    }));
  }, [sourceStats]);

  // AI context based on active tab
  const aiContext = useMemo(() => {
    const baseContext = {
      spend: filteredTotals.spend,
      impressions: filteredTotals.impressions,
      clicks: filteredTotals.clicks,
      leads: filteredTotals.leads,
      diagnostics: filteredTotals.diagnostics,
      sales: filteredTotals.sales,
      revenue: filteredTotals.revenue,
      cpl: filteredTotals.leads > 0 ? filteredTotals.spend / filteredTotals.leads : 0,
      cac: filteredTotals.sales > 0 ? filteredTotals.spend / filteredTotals.sales : 0,
      aov: filteredTotals.sales > 0 ? filteredTotals.revenue / filteredTotals.sales : 0,
      romi: filteredTotals.spend > 0 ? ((filteredTotals.revenue - filteredTotals.spend) / filteredTotals.spend) * 100 : 0,
      projectId: projectId || undefined
    };

    // Add tab-specific context
    if (activeTab === 'sales-roi') {
      return {
        ...baseContext,
        tabName: 'Эффективность сайтов',
        topSites: siteStats.slice(0, 3).map(s => `${s.site}: ${s.leads} лидов, ${formatCurrency(s.revenue)} выручки`).join('; ')
      };
    } else if (activeTab === 'split-tests') {
      return {
        ...baseContext,
        tabName: 'Сплит-тесты маркетинга',
        topOffers: splitTestStats.slice(0, 3).map(s => `${s.offer}: ${formatCurrency(s.cpl)} CPL`).join('; ')
      };
    } else {
      return {
        ...baseContext,
        tabName: 'Источники трафика',
        topSources: sourceStats.slice(0, 3).map(s => `${s.label}: ${s.leads} лидов`).join('; ')
      };
    }
  }, [activeTab, filteredTotals, siteStats, splitTestStats, sourceStats, projectId]);

  const romi = filteredTotals.spend > 0 ? ((filteredTotals.revenue - filteredTotals.spend) / filteredTotals.spend) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-background border rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Сквозная аналитика</h2>
            </div>
            <p className="text-muted-foreground">
              Анализируйте эффективность рекламы от клика до прибыли
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <DateRangePicker 
              dateRange={dateRange} 
              onDateRangeChange={setDateRange} 
            />
            <Badge variant="secondary" className="text-xs">
              ROMI: {romi.toFixed(0)}%
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Layout: Content only (AI Analyst removed - available on dashboard) */}
      <div className="space-y-6">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="sales-roi" className="gap-2 py-3">
                <DollarSign className="w-4 h-4" />
                <span className="hidden sm:inline">Эффективность сайтов</span>
                <span className="sm:hidden">Sales ROI</span>
              </TabsTrigger>
              <TabsTrigger value="split-tests" className="gap-2 py-3">
                <SplitSquareVertical className="w-4 h-4" />
                <span className="hidden sm:inline">Сплит-тесты</span>
                <span className="sm:hidden">Сплит</span>
              </TabsTrigger>
              <TabsTrigger value="sources" className="gap-2 py-3">
                <Radio className="w-4 h-4" />
                <span className="hidden sm:inline">Источники трафика</span>
                <span className="sm:hidden">Источники</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Sales ROI */}
            <TabsContent value="sales-roi" className="space-y-6 mt-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Site Performance Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-primary" />
                        Эффективность по сайтам (Sales ROI)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {siteStats.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>Нет данных. Добавьте site_url в extra_data лидов</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-secondary/50">
                              <tr>
                                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Сайт</th>
                                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Лиды</th>
                                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Диагностики</th>
                                <th className="text-right p-3 text-sm font-medium text-muted-foreground">CR2 %</th>
                                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Выручка</th>
                                <th className="text-right p-3 text-sm font-medium text-muted-foreground">ROI</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {siteStats.map((site) => (
                                <tr key={site.site} className="hover:bg-secondary/30 transition-colors">
                                  <td className="p-3 font-medium max-w-[200px] truncate">{site.site}</td>
                                  <td className="p-3 text-right">{site.leads}</td>
                                  <td className="p-3 text-right">{site.diagnostics}</td>
                                  <td className="p-3 text-right">
                                    <Badge variant="outline">{site.cr2.toFixed(1)}%</Badge>
                                  </td>
                                  <td className="p-3 text-right font-medium text-green-500">
                                    {formatCurrency(site.revenue)}
                                  </td>
                                  <td className="p-3 text-right">
                                    <Badge className={site.roi >= 100 ? 'bg-green-500/20 text-green-500' : site.roi >= 0 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'}>
                                      {site.roi.toFixed(0)}%
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Revenue Pie Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5 text-primary" />
                        Доля выручки по сайтам
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {siteRevenuePieData.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>Нет данных о выручке</p>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={siteRevenuePieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            >
                              {siteRevenuePieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: number) => formatCurrency(value)}
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* TAB 2: Split Tests */}
            <TabsContent value="split-tests" className="space-y-6 mt-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Split Test Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <SplitSquareVertical className="w-5 h-5 text-primary" />
                        Сплит-тесты (Маркетинг)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {splitTestStats.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>Нет данных по офферам</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-secondary/50">
                              <tr>
                                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Сайт (Оффер)</th>
                                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Расходы</th>
                                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Клики</th>
                                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Лиды</th>
                                <th className="text-right p-3 text-sm font-medium text-muted-foreground">CR1 %</th>
                                <th className="text-right p-3 text-sm font-medium text-muted-foreground">CPL</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {splitTestStats.map((offer) => (
                                <tr key={offer.offer} className="hover:bg-secondary/30 transition-colors">
                                  <td className="p-3 font-medium max-w-[200px] truncate">{offer.offer}</td>
                                  <td className="p-3 text-right">{formatCurrency(offer.spend)}</td>
                                  <td className="p-3 text-right">{formatNumber(offer.clicks)}</td>
                                  <td className="p-3 text-right font-medium">{offer.leads}</td>
                                  <td className="p-3 text-right">
                                    <Badge variant="outline">{offer.cr1.toFixed(1)}%</Badge>
                                  </td>
                                  <td className="p-3 text-right font-medium text-primary">
                                    {formatCurrency(offer.cpl)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Leads Dynamics Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <LineChartIcon className="w-5 h-5 text-primary" />
                        Динамика лидов по дням
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {dailyLeadsDynamics.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>Нет данных для отображения</p>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={dailyLeadsDynamics}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis 
                              dataKey="dateLabel" 
                              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                              stroke="hsl(var(--border))"
                            />
                            <YAxis 
                              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                              stroke="hsl(var(--border))"
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="leads" 
                              stroke="hsl(221.2 83.2% 53.3%)" 
                              strokeWidth={2}
                              dot={{ fill: 'hsl(221.2 83.2% 53.3%)', r: 4 }}
                              name="Лиды"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* TAB 3: Traffic Sources */}
            <TabsContent value="sources" className="space-y-6 mt-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Source Performance Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Radio className="w-5 h-5 text-primary" />
                        Эффективность по источникам трафика
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {sourceStats.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>Нет данных по источникам</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-secondary/50">
                              <tr>
                                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Источник</th>
                                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Расход</th>
                                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Лиды</th>
                                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Диагностики</th>
                                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Цена 1 диагностики</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {sourceStats.map((source) => (
                                <tr key={source.source} className="hover:bg-secondary/30 transition-colors">
                                  <td className="p-3">
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                                        style={{ backgroundColor: source.color + '20' }}
                                      >
                                        <span className="text-sm">{source.icon}</span>
                                      </div>
                                      <span className="font-medium">{source.label}</span>
                                    </div>
                                  </td>
                                  <td className="p-3 text-right">{formatCurrency(source.spend)}</td>
                                  <td className="p-3 text-right font-medium">{source.leads}</td>
                                  <td className="p-3 text-right">{source.diagnostics}</td>
                                  <td className="p-3 text-right font-medium text-primary">
                                    {formatCurrency(source.costPerDiagnostic)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Conversion Bar Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        Конверсия по источникам
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {sourceConversionData.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>Нет данных для отображения</p>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={sourceConversionData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis 
                              type="number"
                              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                              stroke="hsl(var(--border))"
                            />
                            <YAxis 
                              type="category"
                              dataKey="name"
                              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                              stroke="hsl(var(--border))"
                              width={100}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                              }}
                            />
                            <Legend />
                            <Bar 
                              dataKey="leads" 
                              fill="hsl(221.2 83.2% 53.3%)" 
                              name="Лиды"
                              radius={[0, 4, 4, 0]}
                            />
                            <Bar 
                              dataKey="diagnostics" 
                              fill="hsl(262.1 83.3% 57.8%)" 
                              name="Диагностики"
                              radius={[0, 4, 4, 0]}
                            />
                            <Bar 
                              dataKey="sales" 
                              fill="hsl(142.1 76.2% 36.3%)" 
                              name="Продажи"
                              radius={[0, 4, 4, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
    </div>
  );
};
