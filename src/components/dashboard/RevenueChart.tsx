import { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DollarSign, Users, TrendingUp, Activity, BarChart3 } from 'lucide-react';
import { cn } from "@/lib/utils";

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

const formatCurrency = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1).replace('.0', '')} млн`;
  return new Intl.NumberFormat('ru-RU').format(Math.round(value));
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0B0C15]/90 backdrop-blur-xl rounded-xl p-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/10 ring-1 ring-white/5">
        <p className="font-mono text-xs text-white/50 mb-3 border-b border-white/5 pb-2 uppercase tracking-widest">{label}</p>

        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]"
                  style={{ backgroundColor: entry.color, color: entry.color }}
                />
                <span className="text-xs text-white/70 font-medium">
                  {entry.name}
                </span>
              </div>
              <span className="font-mono text-sm font-bold text-white drop-shadow-md">
                {['Расходы', 'Выручка'].includes(entry.name)
                  ? `${new Intl.NumberFormat('ru-RU').format(entry.value)} ₸`
                  : new Intl.NumberFormat('ru-RU').format(entry.value)}
              </span>
            </div>
          ))}
        </div>
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
      <div className="interstellar-card border border-white/10 rounded-2xl p-8 min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-500">
            <Activity className="w-8 h-8 text-white/20" />
          </div>
          <h3 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-2">Нет данных</h3>
          <p className="text-xs text-white/30">За выбранный период активность не зафиксирована</p>
        </div>
      </div>
    );
  }

  return (
    <div className="interstellar-card border border-white/10 rounded-2xl p-0 relative overflow-hidden flex flex-col min-h-[420px] bg-[#0B0C15]">
      {/* Ambient Background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-600/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />

      {/* Header */}
      <div className="relative p-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border border-white/10 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <BarChart3 className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white/90 tracking-tight flex items-center gap-2">
              Динамика показателей
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </h3>
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold mt-0.5">Live Analytics • 24h Update</p>
          </div>
        </div>

        {/* Custom Tabs Toggle */}
        <div className="bg-[#0f111a] p-1 rounded-lg border border-white/10 flex relative">
          <div
            className={cn(
              "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white/10 rounded-md transition-all duration-300 ease-out border border-white/5 shadow-inner",
              activeTab === 'finance' ? "left-1 bg-gradient-to-r from-blue-500/20 to-indigo-500/20" : "left-[calc(50%)] bg-gradient-to-r from-purple-500/20 to-pink-500/20"
            )}
          />
          <button
            onClick={() => setActiveTab('finance')}
            className={cn(
              "relative z-10 px-4 py-1.5 text-xs font-bold transition-colors w-24 text-center rounded-md",
              activeTab === 'finance' ? "text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.2)]" : "text-white/40 hover:text-white/70"
            )}
          >
            Финансы
          </button>
          <button
            onClick={() => setActiveTab('funnel')}
            className={cn(
              "relative z-10 px-4 py-1.5 text-xs font-bold transition-colors w-24 text-center rounded-md",
              activeTab === 'funnel' ? "text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.2)]" : "text-white/40 hover:text-white/70"
            )}
          >
            Воронка
          </button>
        </div>
      </div>

      {/* Metrics HUD */}
      <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 p-5">
        {activeTab === 'finance' ? (
          <>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group">
              <div className="text-[10px] text-white/40 uppercase tracking-wider font-bold mb-1 group-hover:text-emerald-400 transition-colors">Выручка</div>
              <div className="text-xl font-bold font-mono text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                {formatCurrency(totals.revenue)} <span className="text-xs text-white/30">₸</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group">
              <div className="text-[10px] text-white/40 uppercase tracking-wider font-bold mb-1 group-hover:text-red-400 transition-colors">Расходы</div>
              <div className="text-xl font-bold font-mono text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]">
                {formatCurrency(totals.spend)} <span className="text-xs text-white/30">₸</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 col-span-2 md:col-span-1 hover:border-emerald-500/40 transition-colors">
              <div className="text-[10px] text-emerald-300/60 uppercase tracking-wider font-bold mb-1">Чистая прибыль</div>
              <div className="text-xl font-bold font-mono text-emerald-300">
                {profit > 0 ? '+' : ''}{formatCurrency(profit)} <span className="text-xs opacity-50">₸</span>
              </div>
            </div>
          </>
        ) : (
          <>
            {[
              { label: "Лиды", value: totals.leads, color: "text-blue-400", border: "group-hover:text-blue-400" },
              { label: "Диагностика", value: totals.visits, color: "text-amber-400", border: "group-hover:text-amber-400" },
              { label: "Продажи", value: totals.sales, color: "text-purple-400", border: "group-hover:text-purple-400" },
              { label: "Конверсия", value: `${totals.leads > 0 ? ((totals.sales / totals.leads) * 100).toFixed(1) : 0}%`, color: "text-white", border: "group-hover:text-white" }
            ].map((stat) => (
              <div key={stat.label} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group">
                <div className={cn("text-[10px] text-white/40 uppercase tracking-wider font-bold mb-1 transition-colors", stat.border)}>{stat.label}</div>
                <div className={cn("text-xl font-bold font-mono drop-shadow-[0_0_5px_rgba(255,255,255,0.1)]", stat.color)}>
                  {stat.value}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 w-full min-h-[300px] relative">
        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
            <defs>
              <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="visitsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="displayDate"
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={false}
              dy={15}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => activeTab === 'finance'
                ? (value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value)
                : value
              }
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }} />

            {activeTab === 'finance' ? (
              <>
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Выручка"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                  animationDuration={1500}
                />
                <Area
                  type="monotone"
                  dataKey="spend"
                  name="Расходы"
                  stroke="#EF4444"
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
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#leadsGradient)"
                  animationDuration={1500}
                />
                <Area
                  type="monotone"
                  dataKey="visits"
                  name="Диагностика"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  fill="url(#visitsGradient)"
                  animationDuration={1500}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="Продажи"
                  stroke="#A855F7"
                  strokeWidth={2}
                  fillOpacity={0}
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

