import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface DailyData {
  date: string;
  spend: number;
  impressions: number;
  leads: number;
  visits: number;
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

const metricLabels: Record<string, string> = {
  spend: 'Расходы',
  leads: 'Лиды',
  visits: 'Визиты',
  sales: 'Продажи',
  revenue: 'Выручка',
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
              {metricLabels[entry.dataKey] || entry.name}:
            </span>
            <span className="font-semibold text-foreground">
              {['spend', 'revenue'].includes(entry.dataKey)
                ? `${new Intl.NumberFormat('ru-RU').format(entry.value)} ₸`
                : new Intl.NumberFormat('ru-RU').format(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const RevenueChart = ({ data, daysInMonth }: RevenueChartProps) => {
  const chartData = useMemo(() => {
    return daysInMonth.map(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const dayData = data[dateKey];
      return {
        date: dateKey,
        displayDate: format(day, 'd MMM', { locale: ru }),
        spend: dayData?.spend || 0,
        leads: dayData?.leads || 0,
        visits: dayData?.visits || 0,
        sales: dayData?.sales || 0,
        revenue: dayData?.revenue || 0,
      };
    }).filter(d => d.spend > 0 || d.leads > 0 || d.visits > 0 || d.sales > 0 || d.revenue > 0);
  }, [data, daysInMonth]);

  const totals = useMemo(() => {
    const spend = chartData.reduce((sum, d) => sum + d.spend, 0);
    const leads = chartData.reduce((sum, d) => sum + d.leads, 0);
    const visits = chartData.reduce((sum, d) => sum + d.visits, 0);
    const sales = chartData.reduce((sum, d) => sum + d.sales, 0);
    const revenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
    return { spend, leads, visits, sales, revenue };
  }, [chartData]);

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
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex-shrink-0">
          <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Динамика показателей</h3>
          <p className="text-xs text-muted-foreground/70">Расходы • Лиды • Визиты • Продажи • Выручка</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
              <span className="text-[10px] text-muted-foreground/70 font-medium">Расходы</span>
            </div>
            <p className="text-sm font-semibold text-foreground truncate">
              {formatCurrency(totals.spend)} ₸
            </p>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
              <span className="text-[10px] text-muted-foreground/70 font-medium">Лиды</span>
            </div>
            <p className="text-sm font-semibold text-foreground truncate">
              {new Intl.NumberFormat('ru-RU').format(totals.leads)}
            </p>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0" />
              <span className="text-[10px] text-muted-foreground/70 font-medium">Визиты</span>
            </div>
            <p className="text-sm font-semibold text-foreground truncate">
              {new Intl.NumberFormat('ru-RU').format(totals.visits)}
            </p>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
              <span className="text-[10px] text-muted-foreground/70 font-medium">Продажи</span>
            </div>
            <p className="text-sm font-semibold text-foreground truncate">
              {new Intl.NumberFormat('ru-RU').format(totals.sales)}
            </p>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              <span className="text-[10px] text-muted-foreground/70 font-medium">Выручка</span>
            </div>
            <p className="text-sm font-semibold text-primary truncate">
              {formatCurrency(totals.revenue)} ₸
            </p>
          </div>
        </div>
      </div>

      {/* Chart - compact */}
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(239, 68, 68)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="rgb(239, 68, 68)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="visitsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(234, 179, 8)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="rgb(234, 179, 8)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(168, 85, 247)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="rgb(168, 85, 247)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity={0} />
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
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="spend" 
              stroke="rgb(239, 68, 68)" 
              strokeWidth={2}
              fill="url(#spendGradient)"
            />
            <Area 
              type="monotone" 
              dataKey="leads" 
              stroke="rgb(59, 130, 246)" 
              strokeWidth={2}
              fill="url(#leadsGradient)"
            />
            <Area 
              type="monotone" 
              dataKey="visits" 
              stroke="rgb(234, 179, 8)" 
              strokeWidth={2}
              fill="url(#visitsGradient)"
            />
            <Area 
              type="monotone" 
              dataKey="sales" 
              stroke="rgb(168, 85, 247)" 
              strokeWidth={2}
              fill="url(#salesGradient)"
            />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="rgb(34, 197, 94)" 
              strokeWidth={2.5}
              fill="url(#revenueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
