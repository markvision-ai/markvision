import { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Users, TrendingUp } from 'lucide-react';

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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover/95 backdrop-blur-md rounded-lg p-3 shadow-xl border border-border text-xs">
        <p className="font-medium text-[11px] mb-2 text-foreground/80">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-2">
              <div
                className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]"
                style={{ backgroundColor: entry.color, color: entry.color }}
              />
              <span className="text-muted-foreground">
                {entry.name}:
              </span>
            </div>
            <span className="font-mono font-medium text-foreground">
              {['Расходы', 'Выручка'].includes(entry.name)
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
  const [activeTab, setActiveTab] = useState<'finance' | 'funnel'>('finance');

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
    }).filter(d => activeTab === 'finance'
      ? (d.spend > 0 || d.revenue > 0)
      : (d.leads > 0 || d.visits > 0 || d.sales > 0)
    );
  }, [data, daysInMonth, activeTab]);

  const totals = useMemo(() => {
    const spend = chartData.reduce((sum, d) => sum + d.spend, 0);
    const leads = chartData.reduce((sum, d) => sum + d.leads, 0);
    const visits = chartData.reduce((sum, d) => sum + d.visits, 0);
    const sales = chartData.reduce((sum, d) => sum + d.sales, 0);
    const revenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
    return { spend, leads, visits, sales, revenue };
  }, [chartData]);

  const profit = totals.revenue - totals.spend;

  if (chartData.length === 0) {
    return (
      <div className="glass-card border border-border/40 rounded-xl p-6 min-h-[350px] flex flex-col items-center justify-center">
        <h3 className="text-sm font-semibold text-foreground/90 flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-primary" />
          Динамика показателей
        </h3>
        <div className="text-xs text-muted-foreground">
          Нет данных за выбранный период
        </div>
      </div>
    );
  }

  return (
    <div className="group glass-card border border-border/40 rounded-xl p-5 transition-all duration-300 hover:border-border/60 hover:shadow-2xl hover:shadow-primary/5 min-h-[350px] flex flex-col bg-card backdrop-blur-xl">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground/90 flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-primary" />
            Динамика показателей
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {activeTab === 'finance' ? 'Финансовые потоки (Выручка vs Расходы)' : 'Конверсионная воронка (Лиды → Продажи)'}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full sm:w-auto">
          <TabsList className="bg-muted/50 border border-border/20 p-1 h-9">
            <TabsTrigger value="finance" className="text-xs px-3 h-7 data-[state=active]:bg-background shadow-sm">
              <DollarSign className="w-3 h-3 mr-1.5" />
              Финансы
            </TabsTrigger>
            <TabsTrigger value="funnel" className="text-xs px-3 h-7 data-[state=active]:bg-background shadow-sm">
              <Users className="w-3 h-3 mr-1.5" />
              Воронка
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Totals Summary */}
      <div className="flex gap-4 sm:gap-6 mb-6 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
        {activeTab === 'finance' ? (
          <>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Выручка</span>
              <span className="text-lg font-bold text-emerald-500 dark:text-emerald-400">{formatCurrency(totals.revenue)} ₸</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Расходы</span>
              <span className="text-lg font-bold text-red-500 dark:text-red-400">{formatCurrency(totals.spend)} ₸</span>
            </div>
            <div className="flex flex-col pl-4 border-l border-border/20">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Прибыль</span>
              <span className={`text-lg font-bold ${profit >= 0 ? 'text-primary' : 'text-red-500'}`}>
                {profit > 0 ? '+' : ''}{formatCurrency(profit)} ₸
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Лиды</span>
              <span className="text-lg font-bold text-blue-500 dark:text-blue-400">{totals.leads}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Диагностика</span>
              <span className="text-lg font-bold text-amber-500 dark:text-amber-400">{totals.visits}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Продажи</span>
              <span className="text-lg font-bold text-purple-500 dark:text-purple-400">{totals.sales}</span>
            </div>
            <div className="flex flex-col pl-4 border-l border-border/20">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Конверсия</span>
              <span className="text-lg font-bold text-foreground">
                {totals.leads > 0 ? ((totals.sales / totals.leads) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </>
        )}
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(239, 68, 68)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="rgb(239, 68, 68)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity={0} />
              </linearGradient>

              <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="visitsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(245, 158, 11)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="rgb(245, 158, 11)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border) / 0.5)"
              vertical={false}
            />
            <XAxis
              dataKey="displayDate"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => activeTab === 'finance'
                ? (value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value)
                : value
              }
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--muted-foreground) / 0.2)', strokeWidth: 1 }} />

            {activeTab === 'finance' ? (
              <>
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Выручка"
                  stroke="rgb(16, 185, 129)"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                  animationDuration={1500}
                />
                <Area
                  type="monotone"
                  dataKey="spend"
                  name="Расходы"
                  stroke="rgb(239, 68, 68)"
                  strokeWidth={2}
                  fill="url(#spendGradient)"
                  animationDuration={1500}
                />
              </>
            ) : (
              <>
                <Area
                  type="monotone"
                  dataKey="leads"
                  name="Лиды"
                  stroke="rgb(59, 130, 246)"
                  strokeWidth={2}
                  fill="url(#leadsGradient)"
                  animationDuration={1500}
                />
                <Area
                  type="monotone"
                  dataKey="visits"
                  name="Диагностика"
                  stroke="rgb(245, 158, 11)"
                  strokeWidth={2}
                  fill="url(#visitsGradient)"
                  animationDuration={1500}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="Продажи"
                  stroke="rgb(168, 85, 247)"
                  strokeWidth={2}
                  fillOpacity={0} // Only line for sales to keep clean
                  animationDuration={1500}
                />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
