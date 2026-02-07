import { useMemo, useRef, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download } from 'lucide-react';
import { groupByPeriod, downsampleLTTB, Period, SeriesPoint } from '@/lib/chartUtils';

export interface ChartPoint {
  date: string;
  displayDate: string;
  spend: number;
  leads: number;
  visits: number;
  sales: number;
  revenue: number;
}

export interface PerformanceChartWidgetProps {
  data: ChartPoint[];
  title?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-2 border text-xs">
        <div className="font-semibold mb-1">{label}</div>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">{p.name}</span>
            <span className="font-semibold">{Math.round(p.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const PerformanceChartWidget = ({ data, title = 'Динамика показателей' }: PerformanceChartWidgetProps) => {
  const [period, setPeriod] = useState<Period>('day');
  const [visible, setVisible] = useState<Record<string, boolean>>({
    spend: true, leads: true, visits: true, sales: true, revenue: true,
  });
  const chartRef = useRef<HTMLDivElement>(null);

  const formattedData: SeriesPoint[] = useMemo(() => {
    const agg = groupByPeriod(data as SeriesPoint[], period);
    const ds = downsampleLTTB(agg, 1500, 'revenue');
    return ds;
  }, [data, period]);

  const totals = useMemo(() => {
    const spend = data.reduce((sum, d) => sum + d.spend, 0);
    const leads = data.reduce((sum, d) => sum + d.leads, 0);
    const visits = data.reduce((sum, d) => sum + d.visits, 0);
    const sales = data.reduce((sum, d) => sum + d.sales, 0);
    const revenue = data.reduce((sum, d) => sum + d.revenue, 0);
    return { spend, leads, visits, sales, revenue };
  }, [data]);

  const avgRevenue = useMemo(() => {
    if (formattedData.length === 0) return 0;
    return formattedData.reduce((s, d) => s + d.revenue, 0) / formattedData.length;
  }, [formattedData]);

  const formatCurrency = (v: number) => new Intl.NumberFormat('ru-RU').format(Math.round(v)) + ' ₸';

  const exportSVG = () => {
    const svg = chartRef.current?.querySelector('svg');
    if (!svg) return;
    const source = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chart.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPNG = async () => {
    const svg = chartRef.current?.querySelector('svg');
    if (!svg) return;
    const source = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const svg64 = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);
    await new Promise<void>(res => {
      img.onload = () => res();
      img.src = svg64;
    });
    const canvas = document.createElement('canvas');
    const bbox = svg.getBBox();
    canvas.width = Math.max(800, bbox.width);
    canvas.height = Math.max(300, bbox.height);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chart.png';
    a.click();
  };

  const exportPDF = async () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const svg = chartRef.current?.querySelector('svg');
    const source = svg ? new XMLSerializer().serializeToString(svg) : '';
    w.document.write(`<html><body>${source}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
    w.close();
  };

  return (
    <GlassCard className="stripe-emerald">
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex-shrink-0">
          <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">{title}</h3>
          <p className="text-xs text-muted-foreground/70">Расходы • Лиды • Диагностика • Продажи • Выручка</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
              <span className="text-[10px] text-muted-foreground/70 font-medium">Расходы</span>
            </div>
            <p className="text-sm font-semibold text-foreground truncate">
              {formatCurrency(totals.spend)}
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
              <span className="text-[10px] text-muted-foreground/70 font-medium">Диагностика</span>
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
              {formatCurrency(totals.revenue)}
            </p>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={(v: Period) => setPeriod(v)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Период" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">День</SelectItem>
                <SelectItem value="week">Неделя</SelectItem>
                <SelectItem value="month">Месяц</SelectItem>
                <SelectItem value="quarter">Квартал</SelectItem>
                <SelectItem value="year">Год</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={exportSVG}>
              <Download className="w-4 h-4 mr-1" /> SVG
            </Button>
            <Button variant="ghost" size="sm" onClick={exportPNG}>
              <Download className="w-4 h-4 mr-1" /> PNG
            </Button>
            <Button variant="ghost" size="sm" onClick={exportPDF}>
              <Download className="w-4 h-4 mr-1" /> PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="h-[300px] overflow-x-auto min-w-[560px]" ref={chartRef}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="displayDate" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickLine={false} axisLine={false} width={50} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={avgRevenue} stroke="rgb(34, 197, 94)" strokeDasharray="4 4" />
            {visible.spend && <Area name="Расходы" type="monotone" dataKey="spend" stroke="#d83b3b" strokeWidth={2} fill="url(#spendGradient)" dot={false} isAnimationActive={false} />}
            {visible.leads && <Area name="Лиды" type="monotone" dataKey="leads" stroke="#2563eb" strokeWidth={2} fill="url(#leadsGradient)" dot={false} isAnimationActive={false} />}
            {visible.visits && <Area name="Диагностика" type="monotone" dataKey="visits" stroke="#b45309" strokeWidth={2} fill="url(#visitsGradient)" dot={false} isAnimationActive={false} />}
            {visible.sales && <Area name="Продажи" type="monotone" dataKey="sales" stroke="#7c3aed" strokeWidth={2} fill="url(#salesGradient)" dot={false} isAnimationActive={false} />}
            {visible.revenue && <Area name="Выручка" type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2.5} fill="url(#revenueGradient)" dot={false} isAnimationActive={false} />}
            <Legend onClick={(e: any) => {
              const key = e?.dataKey as string;
              if (!key) return;
              setVisible(prev => ({ ...prev, [key]: !prev[key] }));
            }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
