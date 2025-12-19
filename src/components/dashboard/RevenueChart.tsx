import { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { TrendingUp, TrendingDown } from 'lucide-react';

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

const formatCurrency = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return `${value}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-sm border rounded-xl p-4 shadow-xl">
        <p className="font-semibold text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">
              {entry.name === 'revenue' ? 'Выручка' : 'Расходы'}:
            </span>
            <span className="font-medium">
              {new Intl.NumberFormat('ru-RU').format(entry.value)} ₸
            </span>
          </div>
        ))}
        {payload.length === 2 && (
          <div className="mt-2 pt-2 border-t border-border">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Прибыль:</span>
              <span className={`font-medium ${payload[0].value - payload[1].value >= 0 ? 'text-success' : 'text-destructive'}`}>
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

  if (chartData.length === 0) {
    return (
      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Динамика показателей</h3>
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          Нет данных для отображения
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-xl p-6">
      {/* Header with totals */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-semibold text-lg">Динамика показателей</h3>
          <p className="text-sm text-muted-foreground">Выручка vs Расходы</p>
        </div>
        <div className="flex gap-6">
          <div 
            className="text-right cursor-pointer transition-opacity"
            style={{ opacity: hoveredMetric === 'spend' ? 0.5 : 1 }}
            onMouseEnter={() => setHoveredMetric('revenue')}
            onMouseLeave={() => setHoveredMetric(null)}
          >
            <div className="flex items-center gap-2 justify-end">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-sm text-muted-foreground">Выручка</span>
            </div>
            <p className="text-xl font-bold text-success">
              {new Intl.NumberFormat('ru-RU').format(totals.revenue)} ₸
            </p>
          </div>
          <div 
            className="text-right cursor-pointer transition-opacity"
            style={{ opacity: hoveredMetric === 'revenue' ? 0.5 : 1 }}
            onMouseEnter={() => setHoveredMetric('spend')}
            onMouseLeave={() => setHoveredMetric(null)}
          >
            <div className="flex items-center gap-2 justify-end">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <span className="text-sm text-muted-foreground">Расходы</span>
            </div>
            <p className="text-xl font-bold text-destructive">
              {new Intl.NumberFormat('ru-RU').format(totals.spend)} ₸
            </p>
          </div>
        </div>
      </div>

      {/* Profit indicator */}
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-4 ${
        totals.profit >= 0 
          ? 'bg-success/10 text-success' 
          : 'bg-destructive/10 text-destructive'
      }`}>
        {totals.profit >= 0 ? (
          <TrendingUp className="w-4 h-4" />
        ) : (
          <TrendingDown className="w-4 h-4" />
        )}
        Прибыль: {new Intl.NumberFormat('ru-RU').format(totals.profit)} ₸ 
        <span className="opacity-70">({totals.profitPercent.toFixed(1)}%)</span>
      </div>

      {/* Chart */}
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.2} />
                <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
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
              stroke="hsl(var(--success))" 
              strokeWidth={2.5}
              fill="url(#revenueGradient)"
              style={{ opacity: hoveredMetric === 'spend' ? 0.3 : 1 }}
            />
            <Area 
              type="monotone" 
              dataKey="spend" 
              stroke="hsl(var(--destructive))" 
              strokeWidth={2.5}
              fill="url(#spendGradient)"
              style={{ opacity: hoveredMetric === 'revenue' ? 0.3 : 1 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
