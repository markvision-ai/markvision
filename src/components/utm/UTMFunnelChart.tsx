import { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  Legend
} from 'recharts';
import { TrendingDown, ArrowRight } from 'lucide-react';
import { Lead } from '@/hooks/useLeads';

interface UTMFunnelChartProps {
  leads: Lead[];
}

interface SourceStats {
  source: string;
  total: number;
  new: number;
  processing: number;
  qualified: number;
  closed: number;
  rejected: number;
  revenue: number;
  conversionRate: number;
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M ₸';
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(0) + 'K ₸';
  }
  return value.toFixed(0) + ' ₸';
};

const sourceColors: Record<string, string> = {
  'yandex': '#FF0000',
  'google': '#4285F4',
  'facebook': '#1877F2',
  'instagram': '#E4405F',
  'vk': '#0077FF',
  'tiktok': '#000000',
  'direct': '#6B7280',
  'organic': '#10B981',
  'email': '#8B5CF6',
  'referral': '#F59E0B',
};

const getSourceColor = (source: string): string => {
  const lowerSource = source.toLowerCase();
  for (const [key, color] of Object.entries(sourceColors)) {
    if (lowerSource.includes(key)) return color;
  }
  return '#6366F1';
};

const statusOrder = ['new', 'processing', 'qualified', 'closed'];
const statusLabels: Record<string, string> = {
  'new': 'Новые',
  'processing': 'В работе',
  'qualified': 'Квалифицированные',
  'closed': 'Закрытые',
};

export const UTMFunnelChart = ({ leads }: UTMFunnelChartProps) => {
  const sourceStats = useMemo(() => {
    const statsMap = new Map<string, SourceStats>();
    
    leads.forEach(lead => {
      const source = lead.utm_source || 'direct';
      const existing = statsMap.get(source) || {
        source,
        total: 0,
        new: 0,
        processing: 0,
        qualified: 0,
        closed: 0,
        rejected: 0,
        revenue: 0,
        conversionRate: 0,
      };
      
      existing.total++;
      existing.revenue += lead.deal_amount || 0;
      
      const status = lead.status || 'new';
      if (status in existing) {
        (existing as any)[status]++;
      }
      
      statsMap.set(source, existing);
    });
    
    // Calculate conversion rates
    return Array.from(statsMap.values())
      .map(stat => ({
        ...stat,
        conversionRate: stat.total > 0 ? (stat.closed / stat.total) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8); // Top 8 sources
  }, [leads]);

  const funnelData = useMemo(() => {
    const totals = {
      new: leads.filter(l => l.status === 'new' || !l.status).length,
      processing: leads.filter(l => l.status === 'processing').length,
      qualified: leads.filter(l => l.status === 'qualified').length,
      closed: leads.filter(l => l.status === 'closed').length,
    };
    
    return statusOrder.map((status, index) => {
      const value = totals[status as keyof typeof totals];
      const prevValue = index > 0 ? totals[statusOrder[index - 1] as keyof typeof totals] : leads.length;
      const conversion = prevValue > 0 ? (value / prevValue) * 100 : 0;
      
      return {
        name: statusLabels[status],
        value,
        conversion: conversion.toFixed(1),
        fill: `hsl(${220 - index * 30}, 70%, ${50 + index * 5}%)`,
      };
    });
  }, [leads]);

  const totalRevenue = useMemo(() => 
    leads.reduce((sum, lead) => sum + (lead.deal_amount || 0), 0),
  [leads]);

  const overallConversion = useMemo(() => {
    const closedCount = leads.filter(l => l.status === 'closed').length;
    return leads.length > 0 ? (closedCount / leads.length) * 100 : 0;
  }, [leads]);

  if (leads.length === 0) {
    return (
      <div className="bg-card border rounded-xl p-6 text-center text-muted-foreground">
        Нет данных для визуализации воронки
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Всего заявок</div>
          <div className="text-2xl font-bold">{leads.length}</div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Закрыто</div>
          <div className="text-2xl font-bold text-success">
            {leads.filter(l => l.status === 'closed').length}
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Конверсия</div>
          <div className="text-2xl font-bold text-primary">
            {overallConversion.toFixed(1)}%
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Выручка</div>
          <div className="text-2xl font-bold text-success">
            {formatCurrency(totalRevenue)}
          </div>
        </div>
      </div>

      {/* Funnel Visualization */}
      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Воронка конверсий</h3>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {funnelData.map((stage, index) => (
            <div key={stage.name} className="flex items-center gap-2">
              <div 
                className="relative rounded-lg p-4 text-center min-w-[120px]"
                style={{ 
                  backgroundColor: stage.fill,
                  opacity: 0.9
                }}
              >
                <div className="text-white font-bold text-xl">{stage.value}</div>
                <div className="text-white/80 text-sm">{stage.name}</div>
              </div>
              {index < funnelData.length - 1 && (
                <div className="flex flex-col items-center text-muted-foreground">
                  <ArrowRight className="w-5 h-5" />
                  <span className="text-xs font-medium">{funnelData[index + 1].conversion}%</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Conversion by Source */}
      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Конверсии по источникам</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={sourceStats} 
              layout="vertical"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <XAxis type="number" />
              <YAxis 
                type="category" 
                dataKey="source" 
                tick={{ fontSize: 12 }}
                width={70}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0].payload as SourceStats;
                  return (
                    <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
                      <div className="font-semibold mb-2">{data.source}</div>
                      <div className="space-y-1 text-muted-foreground">
                        <div>Всего: <span className="text-foreground font-medium">{data.total}</span></div>
                        <div>Закрыто: <span className="text-success font-medium">{data.closed}</span></div>
                        <div>Конверсия: <span className="text-primary font-medium">{data.conversionRate.toFixed(1)}%</span></div>
                        <div>Выручка: <span className="text-foreground font-medium">{formatCurrency(data.revenue)}</span></div>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="total" name="Заявки" radius={[0, 4, 4, 0]}>
                {sourceStats.map((entry) => (
                  <Cell key={entry.source} fill={getSourceColor(entry.source)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Source Table */}
      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Детализация по источникам</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2">Источник</th>
                <th className="text-center py-3 px-2">Всего</th>
                <th className="text-center py-3 px-2">Новые</th>
                <th className="text-center py-3 px-2">В работе</th>
                <th className="text-center py-3 px-2">Квалиф.</th>
                <th className="text-center py-3 px-2">Закрыто</th>
                <th className="text-center py-3 px-2">Конверсия</th>
                <th className="text-right py-3 px-2">Выручка</th>
              </tr>
            </thead>
            <tbody>
              {sourceStats.map(stat => (
                <tr key={stat.source} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getSourceColor(stat.source) }}
                      />
                      <span className="font-medium">{stat.source}</span>
                    </div>
                  </td>
                  <td className="text-center py-3 px-2 font-medium">{stat.total}</td>
                  <td className="text-center py-3 px-2">{stat.new}</td>
                  <td className="text-center py-3 px-2">{stat.processing}</td>
                  <td className="text-center py-3 px-2">{stat.qualified}</td>
                  <td className="text-center py-3 px-2 text-success font-medium">{stat.closed}</td>
                  <td className="text-center py-3 px-2">
                    <span className={`font-medium ${stat.conversionRate >= 20 ? 'text-success' : stat.conversionRate >= 10 ? 'text-warning' : 'text-muted-foreground'}`}>
                      {stat.conversionRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-right py-3 px-2 font-medium">{formatCurrency(stat.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
