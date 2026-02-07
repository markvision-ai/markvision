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
      <div className="bg-slate-950/90 backdrop-blur-md rounded-lg p-3 shadow-xl border border-white/10 text-xs">
        <p className="font-medium text-[11px] mb-2 text-white/80">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-2">
              <div
                className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]"
                style={{ backgroundColor: entry.color, color: entry.color }}
              />
              <span className="text-slate-400">
                {entry.name}:
              </span>
            </div>
            <span className="font-mono font-medium text-white">
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
      <div className="glass-card border border-white/10 rounded-xl p-6 min-h-[350px] flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Динамика показателей
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
          Нет данных за выбранный период
        </div>
      </div>
    );
  }

  return (
    <div className="group glass-card border border-white/10 rounded-xl p-5 transition-all duration-300 hover:border-white/20 hover:shadow-2xl hover:shadow-primary/5 min-h-[350px] flex flex-col bg-slate-950/40 backdrop-blur-xl">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-primary" />
            Динамика показателей
          </h3>
          <p className="text-[11px] text-slate-400">
            {activeTab === 'finance' ? 'Финансовые потоки (Выручка vs Расходы)' : 'Конверсионная воронка (Лиды → Продажи)'}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full sm:w-auto">
          <TabsList className="bg-slate-900/50 border border-white/5 p-1 h-9">
            <TabsTrigger value="finance" className="text-xs px-3 h-7 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <DollarSign className="w-3 h-3 mr-1.5" />
              Финансы
            </TabsTrigger>
            <TabsTrigger value="funnel" className="text-xs px-3 h-7 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
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
              <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Выручка</span>
              <span className="text-lg font-bold text-emerald-400">{formatCurrency(totals.revenue)} ₸</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Расходы</span>
              <span className="text-lg font-bold text-red-400">{formatCurrency(totals.spend)} ₸</span>
            </div>
            <div className="flex flex-col pl-4 border-l border-white/5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Прибыль</span>
              <span className={`text-lg font-bold ${profit >= 0 ? 'text-primary' : 'text-red-500'}`}>
                {profit > 0 ? '+' : ''}{formatCurrency(profit)} ₸
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Лиды</span>
              <span className="text-lg font-bold text-blue-400">{totals.leads}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Диагностика</span>
              <span className="text-lg font-bold text-amber-400">{totals.visits}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Продажи</span>
              <span className="text-lg font-bold text-purple-400">{totals.sales}</span>
            </div>
            <div className="flex flex-col pl-4 border-l border-white/5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Конверсия</span>
              <span className="text-lg font-bold text-white">
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
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>

              <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="visitsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="displayDate"
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => activeTab === 'finance'
                ? (value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value)
                : value
              }
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />

            {activeTab === 'finance' ? (
              <>
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Выручка"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                  animationDuration={1500}
                />
                <Area
                  type="monotone"
                  dataKey="spend"
                  name="Расходы"
                  stroke="#ef4444"
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
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#leadsGradient)"
                  animationDuration={1500}
                />
                <Area
                  type="monotone"
                  dataKey="visits"
                  name="Диагностика"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="url(#visitsGradient)"
                  animationDuration={1500}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="Продажи"
                  stroke="#a855f7"
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
