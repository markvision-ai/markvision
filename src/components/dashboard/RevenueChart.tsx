import { useMemo, useState, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DailyData {
  date: string;
  spend: number;
  impressions: number;
  leads: number;
  diagnostics: number;
  sales: number;
  revenue: number;
  clicks?: number;
}

interface RevenueChartProps {
  data: Record<string, DailyData>;
  daysInMonth: Date[];
}

// ИСПРАВЛЕНО: Только "млн" для миллионов
const formatCurrency = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1).replace('.0', '')} млн`;
  return new Intl.NumberFormat('ru-RU').format(Math.round(value));
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-border/40">
        <p className="font-medium text-[11px] mb-2 text-foreground">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs mb-1">
            <div 
              className="w-1.5 h-1.5 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground/70">
              {entry.name === 'revenue' ? 'Выручка' : 'Расходы'}:
            </span>
            <span className="font-semibold text-foreground">
              {new Intl.NumberFormat('ru-RU').format(entry.value)} ₸
            </span>
          </div>
        ))}
        {payload.length === 2 && (
          <div className="mt-2 pt-2 border-t border-border/30">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground/70">Прибыль:</span>
              <span className={cn(
                "font-semibold",
                payload[0].value - payload[1].value >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              )}>
                {new Intl.NumberFormat('ru-RU').format(payload[0].value - payload[1].value)} ₸
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const RevenueChart = ({ data, daysInMonth }: RevenueChartProps) => {
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);

  const chartData = useMemo(() => {
    return daysInMonth.map(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const dayData = data[dateKey];
      return {
        date: dateKey,
        displayDate: format(day, 'd MMM', { locale: ru }),
        revenue: dayData?.revenue || 0,
        spend: dayData?.spend || 0,
      };
    }).filter(d => d.revenue > 0 || d.spend > 0);
  }, [data, daysInMonth]);

  const totals = useMemo(() => {
    const revenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
    const spend = chartData.reduce((sum, d) => sum + d.spend, 0);
    const profit = revenue - spend;
    const profitPercent = spend > 0 ? (profit / spend) * 100 : 0;
    return { revenue, spend, profit, profitPercent };
  }, [chartData]);

  const handleMouseEnter = useCallback((metric: string) => setHoveredMetric(metric), []);
  const handleMouseLeave = useCallback(() => setHoveredMetric(null), []);

  if (chartData.length === 0) {
    return (
      <div className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-xl p-4">
        <h3 className="text-sm font-medium text-foreground mb-3">Динамика показателей</h3>
        <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground/70">
          Нет данных
        </div>
      </div>
    );
  }

  return (
    <div className="group bg-card/50 backdrop-blur-sm border border-border/40 hover:border-border/60 hover:bg-card/60 rounded-xl p-4 transition-all duration-200">
      {/* Header with totals */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div className="flex-shrink-0">
          <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Динамика показателей</h3>
          <p className="text-xs text-muted-foreground/70">Выручка vs Расходы</p>
        </div>
        <div className="flex gap-4 flex-wrap">
          <div 
            className="cursor-pointer transition-opacity min-w-0"
            style={{ opacity: hoveredMetric === 'spend' ? 0.5 : 1 }}
            onMouseEnter={() => handleMouseEnter('revenue')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              <span className="text-[10px] text-muted-foreground/70 font-medium">Выручка</span>
            </div>
            <p className="text-sm font-semibold text-primary truncate">
              {formatCurrency(totals.revenue)} ₸
            </p>
          </div>
          <div 
            className="cursor-pointer transition-opacity min-w-0"
            style={{ opacity: hoveredMetric === 'revenue' ? 0.5 : 1 }}
            onMouseEnter={() => handleMouseEnter('spend')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="w-2 h-2 rounded-full bg-secondary flex-shrink-0" />
              <span className="text-[10px] text-muted-foreground/70 font-medium">Расходы</span>
            </div>
            <p className="text-sm font-semibold text-muted-foreground truncate">
              {formatCurrency(totals.spend)} ₸
            </p>
          </div>
        </div>
      </div>

      {/* Profit indicator - minimal */}
      <div className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium mb-3",
        totals.profit >= 0 
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
          : 'bg-red-500/10 text-red-600 dark:text-red-400'
      )}>
        {totals.profit >= 0 ? (
          <TrendingUp className="w-3 h-3" />
        ) : (
          <TrendingDown className="w-3 h-3" />
        )}
        {new Intl.NumberFormat('ru-RU').format(totals.profit)} ₸
        <span className="opacity-70 text-[10px]">({totals.profitPercent.toFixed(1)}%)</span>
      </div>

      {/* Chart - compact */}
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              vertical={false}
            />
            <XAxis 
              dataKey="displayDate" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tickFormatter={formatCurrency}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2.5}
              fill="url(#revenueGradient)"
              style={{ opacity: hoveredMetric === 'spend' ? 0.3 : 1 }}
            />
            <Area 
              type="monotone" 
              dataKey="spend" 
              stroke="hsl(var(--secondary))" 
              strokeWidth={2}
              fill="url(#spendGradient)"
              style={{ opacity: hoveredMetric === 'revenue' ? 0.3 : 1 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
