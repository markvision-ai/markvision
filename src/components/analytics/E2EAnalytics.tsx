import { useState, useEffect, useMemo } from 'react';
import { 
  Zap, 
  TrendingUp, 
  TrendingDown,
  FileBarChart, 
  Globe, 
  ArrowRight,
  BarChart3,
  Target,
  MousePointer,
  Users,
  DollarSign,
  ShoppingCart,
  ChevronRight,
  Loader2,
  Percent,
  Clock,
  Award,
  AlertCircle,
  LineChart as LineChartIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, parseISO, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';

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

interface SourceStats {
  source: string;
  sourceLabel: string;
  icon: string;
  color: string;
  leads: number;
  sales: number;
  revenue: number;
  spend: number;
  cpl: number;
  romi: number;
  conversionRate: number;
}

interface StatusStats {
  status: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

const formatCurrency = (value: number): string => {
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

const STATUS_CONFIG: Record<string, { label: string; color: string; order: number }> = {
  new: { label: 'Новый', color: 'bg-blue-500', order: 1 },
  contacted: { label: 'Связались', color: 'bg-purple-500', order: 2 },
  diagnostic: { label: 'На диагностике', color: 'bg-yellow-500', order: 3 },
  qualified: { label: 'Квалифицирован', color: 'bg-cyan-500', order: 4 },
  proposal: { label: 'Предложение', color: 'bg-orange-500', order: 5 },
  purchased: { label: 'Купил', color: 'bg-green-500', order: 6 },
  rejected: { label: 'Отказ', color: 'bg-red-500', order: 7 },
};

const SOURCE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  google: { label: 'Google Ads', icon: '🔍', color: 'bg-red-500' },
  facebook: { label: 'Facebook', icon: '📘', color: 'bg-blue-600' },
  instagram: { label: 'Instagram', icon: '📷', color: 'bg-pink-500' },
  tiktok: { label: 'TikTok', icon: '🎵', color: 'bg-slate-800' },
  youtube: { label: 'YouTube', icon: '▶️', color: 'bg-red-600' },
  yandex: { label: 'Яндекс', icon: '🟡', color: 'bg-yellow-500' },
  vk: { label: 'VK', icon: '💬', color: 'bg-blue-500' },
  telegram: { label: 'Telegram', icon: '✈️', color: 'bg-sky-500' },
  direct: { label: 'Прямой трафик', icon: '🔗', color: 'bg-gray-500' },
  other: { label: 'Другое', icon: '📊', color: 'bg-gray-400' },
};

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
  return 'other';
};

export const E2EAnalytics = ({ totals, projectId }: E2EAnalyticsProps) => {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      if (!projectId) {
        setLeads([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .eq('project_id', projectId);

        if (error) throw error;
        setLeads(data || []);
      } catch (error) {
        console.error('Error fetching leads for analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [projectId]);

  // Calculate source statistics
  const sourceStats = useMemo((): SourceStats[] => {
    const grouped: Record<string, { leads: number; sales: number; revenue: number }> = {};

    leads.forEach(lead => {
      const source = getSourceCategory(lead.utm_source);
      if (!grouped[source]) {
        grouped[source] = { leads: 0, sales: 0, revenue: 0 };
      }
      grouped[source].leads++;
      if (lead.status === 'purchased') {
        grouped[source].sales++;
        grouped[source].revenue += lead.deal_amount || 0;
      }
    });

    // Distribute spend proportionally based on leads
    const totalLeadsFromData = leads.length || 1;
    
    return Object.entries(grouped)
      .map(([source, data]) => {
        const config = SOURCE_CONFIG[source] || SOURCE_CONFIG.other;
        const proportionalSpend = (data.leads / totalLeadsFromData) * totals.spend;
        const profit = data.revenue - proportionalSpend;
        const romi = proportionalSpend > 0 ? (profit / proportionalSpend) * 100 : 0;
        const cpl = data.leads > 0 ? proportionalSpend / data.leads : 0;
        const conversionRate = data.leads > 0 ? (data.sales / data.leads) * 100 : 0;

        return {
          source,
          sourceLabel: config.label,
          icon: config.icon,
          color: config.color,
          leads: data.leads,
          sales: data.sales,
          revenue: data.revenue,
          spend: proportionalSpend,
          cpl,
          romi,
          conversionRate
        };
      })
      .sort((a, b) => b.leads - a.leads);
  }, [leads, totals.spend]);

  // Calculate status funnel stats
  const statusStats = useMemo((): StatusStats[] => {
    const totalLeads = leads.length || 1;
    const statusCounts: Record<string, number> = {};

    leads.forEach(lead => {
      const status = lead.status || 'new';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return Object.entries(STATUS_CONFIG)
      .map(([status, config]) => ({
        status,
        label: config.label,
        count: statusCounts[status] || 0,
        percentage: ((statusCounts[status] || 0) / totalLeads) * 100,
        color: config.color,
        order: config.order
      }))
      .sort((a, b) => a.order - b.order);
  }, [leads]);

  // Calculate sales team metrics
  const salesMetrics = useMemo(() => {
    const totalLeads = leads.length;
    const salesCount = leads.filter(l => l.status === 'purchased').length;
    const rejectedCount = leads.filter(l => l.status === 'rejected').length;
    const contactedCount = leads.filter(l => l.status !== 'new').length;
    const diagCount = leads.filter(l => ['diagnostic', 'qualified', 'proposal', 'purchased'].includes(l.status || '')).length;
    
    const totalRevenue = leads
      .filter(l => l.status === 'purchased')
      .reduce((sum, l) => sum + (l.deal_amount || 0), 0);
    
    const avgDeal = salesCount > 0 ? totalRevenue / salesCount : 0;
    
    return {
      totalLeads,
      salesCount,
      rejectedCount,
      contactedCount,
      diagCount,
      totalRevenue,
      avgDeal,
      contactRate: totalLeads > 0 ? (contactedCount / totalLeads) * 100 : 0,
      diagRate: contactedCount > 0 ? (diagCount / contactedCount) * 100 : 0,
      closeRate: totalLeads > 0 ? (salesCount / totalLeads) * 100 : 0,
      rejectRate: totalLeads > 0 ? (rejectedCount / totalLeads) * 100 : 0,
    };
  }, [leads]);

  // Top campaigns by revenue
  const topCampaigns = useMemo(() => {
    const campaigns: Record<string, { leads: number; sales: number; revenue: number }> = {};

    leads.forEach(lead => {
      const campaign = lead.utm_campaign || 'Без кампании';
      if (!campaigns[campaign]) {
        campaigns[campaign] = { leads: 0, sales: 0, revenue: 0 };
      }
      campaigns[campaign].leads++;
      if (lead.status === 'purchased') {
        campaigns[campaign].sales++;
        campaigns[campaign].revenue += lead.deal_amount || 0;
      }
    });

    return Object.entries(campaigns)
      .map(([name, data]) => ({
        name,
        ...data,
        conversionRate: data.leads > 0 ? (data.sales / data.leads) * 100 : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [leads]);

  // Calculate daily dynamics for leads and sales
  const dailyDynamics = useMemo(() => {
    const dailyData: Record<string, { date: string; leads: number; sales: number; revenue: number }> = {};

    leads.forEach(lead => {
      const dateKey = format(startOfDay(parseISO(lead.created_at)), 'yyyy-MM-dd');
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { date: dateKey, leads: 0, sales: 0, revenue: 0 };
      }
      dailyData[dateKey].leads++;
      if (lead.status === 'purchased') {
        dailyData[dateKey].sales++;
        dailyData[dateKey].revenue += lead.deal_amount || 0;
      }
    });

    return Object.values(dailyData)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(day => ({
        ...day,
        dateLabel: format(parseISO(day.date), 'd MMM', { locale: ru })
      }));
  }, [leads]);

  const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const leadConv = totals.clicks > 0 ? (totals.leads / totals.clicks) * 100 : 0;
  const saleConv = totals.leads > 0 ? (totals.sales / totals.leads) * 100 : 0;
  const profit = totals.revenue - totals.spend;
  const romi = totals.spend > 0 ? (profit / totals.spend) * 100 : 0;

  const funnelSteps = [
    { 
      icon: Globe, 
      label: 'Показы', 
      value: totals.impressions, 
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-500'
    },
    { 
      icon: MousePointer, 
      label: 'Клики', 
      value: totals.clicks, 
      conversion: ctr,
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-500/10',
      textColor: 'text-cyan-500'
    },
    { 
      icon: Users, 
      label: 'Лиды', 
      value: totals.leads, 
      conversion: leadConv,
      color: 'from-violet-500 to-violet-600',
      bgColor: 'bg-violet-500/10',
      textColor: 'text-violet-500'
    },
    { 
      icon: Target, 
      label: 'Диагностики', 
      value: totals.diagnostics, 
      conversion: totals.leads > 0 ? (totals.diagnostics / totals.leads) * 100 : 0,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-500'
    },
    { 
      icon: ShoppingCart, 
      label: 'Продажи', 
      value: totals.sales, 
      conversion: saleConv,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-500'
    },
    { 
      icon: DollarSign, 
      label: 'Прибыль', 
      value: profit, 
      isCurrency: true,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-500'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-background border rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Сквозная аналитика</h2>
            </div>
            <p className="text-muted-foreground max-w-xl">
              Анализируйте эффективность рекламы от показа до прибыли
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">
            ROMI: {romi.toFixed(0)}%
          </Badge>
        </div>
      </div>

      {/* End-to-End Funnel */}
      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Путь клиента: от показа до прибыли
        </h3>
        
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-4">
          {funnelSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.label} className="flex items-center">
                <div className="flex flex-col items-center min-w-[100px]">
                  <div className={`w-14 h-14 rounded-2xl ${step.bgColor} flex items-center justify-center mb-3 transition-transform hover:scale-110`}>
                    <Icon className={`w-7 h-7 ${step.textColor}`} />
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{step.label}</p>
                  <p className="text-lg font-bold">
                    {step.isCurrency ? formatCurrency(step.value) : formatNumber(step.value)}
                  </p>
                  {step.conversion !== undefined && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      {step.conversion.toFixed(1)}%
                    </Badge>
                  )}
                </div>
                {index < funnelSteps.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-muted-foreground mx-2 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Dynamics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads Dynamics Chart */}
        <div className="bg-card border rounded-xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <LineChartIcon className="w-5 h-5 text-primary" />
            Динамика лидов по дням
          </h3>
          
          {loading ? (
            <div className="flex items-center justify-center h-[250px]">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : dailyDynamics.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Нет данных для отображения</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyDynamics}>
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
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
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
        </div>

        {/* Sales & Revenue Dynamics Chart */}
        <div className="bg-card border rounded-xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Динамика продаж по дням
          </h3>
          
          {loading ? (
            <div className="flex items-center justify-center h-[250px]">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : dailyDynamics.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Нет данных для отображения</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyDynamics}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="dateLabel" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  stroke="hsl(var(--border))"
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  stroke="hsl(var(--border))"
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  stroke="hsl(var(--border))"
                  tickFormatter={(value) => `${Math.round(value / 1000)}K`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number, name: string) => {
                    if (name === 'Выручка') return [formatCurrency(value), name];
                    return [value, name];
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="hsl(142.1 76.2% 36.3%)" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(142.1 76.2% 36.3%)', r: 4 }}
                  name="Продажи"
                  yAxisId="left"
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(262.1 83.3% 57.8%)" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(262.1 83.3% 57.8%)', r: 4 }}
                  name="Выручка"
                  yAxisId="right"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Source Performance Table */}
      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          Эффективность по источникам
        </h3>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : sourceStats.length === 0 ? (
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
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Лиды</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Расход</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">CPL</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Продажи</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Конверсия</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Выручка</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">ROMI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sourceStats.map((source) => (
                  <tr key={source.source} className="hover:bg-secondary/30 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg ${source.color} flex items-center justify-center`}>
                          <span className="text-sm">{source.icon}</span>
                        </div>
                        <span className="font-medium">{source.sourceLabel}</span>
                      </div>
                    </td>
                    <td className="p-3 text-right font-medium">{source.leads}</td>
                    <td className="p-3 text-right">{formatCurrency(source.spend)}</td>
                    <td className="p-3 text-right">{formatCurrency(source.cpl)}</td>
                    <td className="p-3 text-right font-medium text-green-500">{source.sales}</td>
                    <td className="p-3 text-right">
                      <Badge variant="outline">{source.conversionRate.toFixed(1)}%</Badge>
                    </td>
                    <td className="p-3 text-right font-medium text-green-500">{formatCurrency(source.revenue)}</td>
                    <td className="p-3 text-right">
                      <Badge className={source.romi >= 100 ? 'bg-green-500/20 text-green-500' : source.romi >= 0 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'}>
                        {source.romi.toFixed(0)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sales Team Efficiency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Metrics */}
        <div className="bg-card border rounded-xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Эффективность отдела продаж
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Всего лидов</p>
                <p className="text-2xl font-bold">{salesMetrics.totalLeads}</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Продаж</p>
                <p className="text-2xl font-bold text-green-500">{salesMetrics.salesCount}</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Средний чек</p>
                <p className="text-2xl font-bold">{formatCurrency(salesMetrics.avgDeal)}</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Выручка</p>
                <p className="text-2xl font-bold text-green-500">{formatCurrency(salesMetrics.totalRevenue)}</p>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Конверсия в контакт</span>
                  <span className="font-medium">{salesMetrics.contactRate.toFixed(1)}%</span>
                </div>
                <Progress value={salesMetrics.contactRate} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Конверсия в диагностику</span>
                  <span className="font-medium">{salesMetrics.diagRate.toFixed(1)}%</span>
                </div>
                <Progress value={salesMetrics.diagRate} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    Конверсия в продажу
                  </span>
                  <span className="font-medium text-green-500">{salesMetrics.closeRate.toFixed(1)}%</span>
                </div>
                <Progress value={salesMetrics.closeRate} className="h-2 [&>div]:bg-green-500" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <TrendingDown className="w-3 h-3 text-red-500" />
                    Процент отказов
                  </span>
                  <span className="font-medium text-red-500">{salesMetrics.rejectRate.toFixed(1)}%</span>
                </div>
                <Progress value={salesMetrics.rejectRate} className="h-2 [&>div]:bg-red-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-card border rounded-xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Percent className="w-5 h-5 text-primary" />
            Распределение по статусам
          </h3>
          
          <div className="space-y-3">
            {statusStats.map((stat) => (
              <div key={stat.status} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${stat.color}`} />
                <span className="flex-1 text-sm">{stat.label}</span>
                <span className="text-sm font-medium w-12 text-right">{stat.count}</span>
                <div className="w-24">
                  <Progress value={stat.percentage} className="h-2" />
                </div>
                <span className="text-sm text-muted-foreground w-12 text-right">{stat.percentage.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Campaigns */}
      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Топ кампании по выручке
        </h3>
        
        {topCampaigns.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileBarChart className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Нет данных по кампаниям</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topCampaigns.map((campaign, index) => (
              <div key={campaign.name} className="flex items-center gap-4 p-4 bg-secondary/50 rounded-xl hover:bg-secondary transition-colors">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center font-bold text-primary">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{campaign.name}</p>
                  <p className="text-sm text-muted-foreground">{campaign.leads} лидов → {campaign.sales} продаж</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Конверсия</p>
                  <Badge variant="outline">{campaign.conversionRate.toFixed(1)}%</Badge>
                </div>
                <div className="text-right min-w-[100px]">
                  <p className="text-sm text-muted-foreground">Выручка</p>
                  <p className="font-semibold text-green-500">{formatCurrency(campaign.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
