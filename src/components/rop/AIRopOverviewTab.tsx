import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    TrendingUp,
    DollarSign,
    Target,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw,
    Brain,
    Calendar as CalendarIcon
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    FunnelChart,
    Funnel,
    LabelList
} from 'recharts';
import { motion } from 'framer-motion';
import { format, subDays, startOfMonth } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AIRopTask, AIRopAudit } from '@/hooks/useAIRop';
import { DateRange } from 'react-day-picker';
import { supabase } from '@/integrations/supabase/client';

interface AIRopOverviewTabProps {
    tasks: AIRopTask[];
    audits: AIRopAudit[];
    projectId: string | null;
    onRefresh: () => void;
}

type OverviewStats = {
    revenue: number;
    leadsCount: number;
    salesCount: number;
    conversion: number;
    activeDeals: number;
};

type FunnelStep = { value: number; name: string; fill: string };
type ActivityDay = { name: string; leads: number; sales: number };

const formatTenge = (value: number) => {
    if (value >= 1_000_000) return (value / 1_000_000).toFixed(1).replace(/\.0$/, '') + ' млн ₸';
    if (value >= 1_000) return (value / 1_000).toFixed(0) + 'K ₸';
    return Math.round(value).toLocaleString('ru-RU') + ' ₸';
};

const KPICard = ({ title, value, change, icon: Icon, trend, color }: any) => (
    <Card className="bg-white/10 backdrop-blur-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white rounded-[28px] overflow-hidden group hover:shadow-xl transition-all duration-500">
        <CardContent className="p-6">
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">{title}</p>
                    <h3 className="text-2xl font-black text-foreground uppercase tracking-tight group-hover:scale-105 transition-transform origin-left">{value}</h3>
                    <div className={cn("flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-full w-fit text-[10px] font-black uppercase tracking-widest",
                        trend === 'up' ? "bg-emerald-50 text-emerald-600 border border-emerald-100/50" : "bg-rose-50 text-rose-600 border border-rose-100/50"
                    )}>
                        {trend === 'up' ? <ArrowUpRight className="w-3 h-3 stroke-[3]" /> : <ArrowDownRight className="w-3 h-3 stroke-[3]" />}
                        <span>{change}</span>
                    </div>
                </div>
                <div className={cn("p-4 rounded-[20px] shadow-lg group-hover:rotate-6 transition-transform", color)}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
        </CardContent>
    </Card>
);

export const AIRopOverviewTab: React.FC<AIRopOverviewTabProps> = ({ tasks, projectId, onRefresh }) => {
    const [date, setDate] = useState<DateRange | undefined>({
        from: subDays(new Date(), 7),
        to: new Date(),
    });
    const [activeFilter, setActiveFilter] = useState('week');
    const [overviewStats, setOverviewStats] = useState<OverviewStats>({
        revenue: 0,
        leadsCount: 0,
        salesCount: 0,
        conversion: 0,
        activeDeals: 0,
    });
    const [funnelData, setFunnelData] = useState<FunnelStep[]>([]);
    const [activityData, setActivityData] = useState<ActivityDay[]>([]);
    const [loading, setLoading] = useState(true);

    const dateFrom = date?.from ? format(date.from, 'yyyy-MM-dd') : null;
    const dateTo = date?.to ? format(date.to, 'yyyy-MM-dd') : null;

    useEffect(() => {
        if (!projectId || !dateFrom || !dateTo) {
            setLoading(false);
            return;
        }
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            try {
                const [dailyRes, leadsRes, activeRes, funnelRes] = await Promise.all([
                    supabase
                        .from('daily_data')
                        .select('date, revenue, leads, sales')
                        .eq('project_id', projectId)
                        .gte('date', dateFrom)
                        .lte('date', dateTo),
                    supabase
                        .from('leads')
                        .select('id, status, created_at')
                        .eq('project_id', projectId)
                        .gte('created_at', `${dateFrom}T00:00:00`)
                        .lte('created_at', `${dateTo}T23:59:59`),
                    supabase
                        .from('leads')
                        .select('id', { count: 'exact', head: true })
                        .eq('project_id', projectId)
                        .in('status', ['new', 'Новая', 'in_progress', 'no_answer', 'appointment', 'invoiced']),
                    supabase
                        .from('leads')
                        .select('status')
                        .eq('project_id', projectId)
                        .gte('created_at', `${dateFrom}T00:00:00`)
                        .lte('created_at', `${dateTo}T23:59:59`),
                ]);

                if (cancelled) return;

                const daily = (dailyRes.data || []) as { date: string; revenue: number; leads: number; sales: number }[];
                const leads = (leadsRes.data || []) as { id: string; status: string | null }[];
                const activeCount = activeRes.count ?? 0;
                const funnelLeads = (funnelRes.data || []) as { status: string | null }[];

                const revenue = daily.reduce((s, d) => s + (Number(d.revenue) || 0), 0);
                const leadsCount = daily.reduce((s, d) => s + (Number(d.leads) || 0), 0) || leads.length;
                const salesCount = daily.reduce((s, d) => s + (Number(d.sales) || 0), 0);
                const conversion = leadsCount > 0 ? Math.round((salesCount / leadsCount) * 1000) / 10 : 0;

                const statusGroups: Record<string, number> = {};
                funnelLeads.forEach(l => {
                    const st = (l.status || 'new').toLowerCase();
                    statusGroups[st] = (statusGroups[st] || 0) + 1;
                });
                const paidCount = funnelLeads.filter(l =>
                    ['paid', 'оплачено', 'won', 'success', 'closed_won'].some(s => (l.status || '').toLowerCase().includes(s))
                ).length;
                const appointmentCount = funnelLeads.filter(l =>
                    ['appointment', 'записан', 'visit', 'visit_completed'].some(s => (l.status || '').toLowerCase().includes(s))
                ).length;
                const inProgressCount = funnelLeads.filter(l =>
                    ['in_progress', 'no_answer', 'invoiced'].some(s => (l.status || '').toLowerCase().includes(s))
                ).length;
                const total = funnelLeads.length;
                const funnel: FunnelStep[] = total === 0 ? [] : [
                    { value: total, name: 'Лиды', fill: '#8884d8' },
                    { value: inProgressCount, name: 'В работе', fill: '#83a6ed' },
                    { value: appointmentCount, name: 'Встречи/Записи', fill: '#8dd1e1' },
                    { value: paidCount, name: 'Сделки', fill: '#a4de6c' },
                ].filter(s => s.value > 0);

                const byDate: Record<string, { leads: number; sales: number }> = {};
                daily.forEach(d => {
                    byDate[d.date] = {
                        leads: Number(d.leads) || 0,
                        sales: Number(d.sales) || 0,
                    };
                });
                const activity: ActivityDay[] = daily.length
                    ? daily.map(d => ({
                        name: format(new Date(d.date + 'T12:00:00'), 'dd.MM', { locale: ru }),
                        leads: Number(d.leads) || 0,
                        sales: Number(d.sales) || 0,
                    }))
                    : [];

                setOverviewStats({ revenue, leadsCount, salesCount, conversion, activeDeals: activeCount });
                setFunnelData(funnel);
                setActivityData(activity);
            } catch (e) {
                console.error('AIRopOverview load error:', e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [projectId, dateFrom, dateTo]);

    const handleQuickFilter = (filter: string) => {
        setActiveFilter(filter);
        const today = new Date();
        switch (filter) {
            case 'today':
                setDate({ from: today, to: today });
                break;
            case 'yesterday': {
                const yesterday = subDays(today, 1);
                setDate({ from: yesterday, to: yesterday });
                break;
            }
            case 'week':
                setDate({ from: subDays(today, 7), to: today });
                break;
            case 'month':
                setDate({ from: startOfMonth(today), to: today });
                break;
        }
    };

    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const kpis = [
        {
            title: "Выручка",
            value: formatTenge(overviewStats.revenue),
            change: "за период",
            trend: "up" as const,
            icon: DollarSign,
            color: "bg-gradient-to-br from-blue-500 to-green-600"
        },
        {
            title: "Конверсия",
            value: overviewStats.leadsCount ? `${overviewStats.conversion}%` : "0%",
            change: `из ${overviewStats.leadsCount} лидов`,
            trend: "up" as const,
            icon: TrendingUp,
            color: "bg-gradient-to-br from-blue-500 to-cyan-600"
        },
        {
            title: "Активные сделки",
            value: String(overviewStats.activeDeals),
            change: "в работе",
            trend: "up" as const,
            icon: Target,
            color: "bg-gradient-to-br from-purple-500 to-pink-600"
        },
        {
            title: "Задачи ИИ",
            value: String(pendingTasks),
            change: "ожидают",
            trend: "up" as const,
            icon: Brain,
            color: "bg-gradient-to-br from-[#955251] to-[#B57170]"
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Controls */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Обзор показателей</h2>
                    <p className="text-xs font-medium uppercase tracking-widest opacity-40 mt-1">Ключевые метрики эффективности отдела продаж</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-white/10/50 backdrop-blur-md p-1 rounded-2xl border border-slate-200/50">
                        <Button
                            variant={activeFilter === 'today' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => handleQuickFilter('today')}
                            className={cn("h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                activeFilter === 'today' ? "bg-white shadow-sm text-blue-600" : "text-muted-foreground hover:bg-white/50")}
                        >
                            Сегодня
                        </Button>
                        <Button
                            variant={activeFilter === 'yesterday' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => handleQuickFilter('yesterday')}
                            className={cn("h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                activeFilter === 'yesterday' ? "bg-white shadow-sm text-blue-600" : "text-muted-foreground hover:bg-white/50")}
                        >
                            Вчера
                        </Button>
                        <Button
                            variant={activeFilter === 'week' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => handleQuickFilter('week')}
                            className={cn("h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                activeFilter === 'week' ? "bg-white shadow-sm text-blue-600" : "text-muted-foreground hover:bg-white/50")}
                        >
                            7 Дней
                        </Button>
                        <Button
                            variant={activeFilter === 'month' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => handleQuickFilter('month')}
                            className={cn("h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                activeFilter === 'month' ? "bg-white shadow-sm text-blue-600" : "text-muted-foreground hover:bg-white/50")}
                        >
                            Месяц
                        </Button>
                    </div>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="lg" className="h-[46px] rounded-2xl gap-3 border-slate-200 bg-white/50 shadow-sm font-black uppercase tracking-widest text-[10px] px-6">
                                <CalendarIcon className="w-4 h-4 text-blue-600" />
                                {date?.from ? (
                                    date.to ? (
                                        <>
                                            {format(date.from, "dd MMM", { locale: ru })} -{" "}
                                            {format(date.to, "dd MMM", { locale: ru })}
                                        </>
                                    ) : (
                                        format(date.from, "dd MMM", { locale: ru })
                                    )
                                ) : (
                                    <span>Выбрать даты</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-[32px] border-white/80 overflow-hidden shadow-2xl" align="end">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={(newDate) => {
                                    setDate(newDate);
                                    setActiveFilter('custom');
                                }}
                                numberOfMonths={2}
                                locale={ru}
                            />
                        </PopoverContent>
                    </Popover>

                    <Button onClick={onRefresh} variant="outline" size="icon" className="w-[46px] h-[46px] rounded-2xl border-slate-200 bg-white/50 shadow-sm transition-all hover:rotate-180 duration-500">
                        <RefreshCw className="w-4 h-4 text-blue-600" />
                    </Button>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <KPICard {...kpi} />
                    </motion.div>
                ))}
            </div>

            {/* Main Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Activity Chart — реальные лиды и продажи по дням */}
                    <Card className="lg:col-span-2 bg-white/10 backdrop-blur-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white rounded-[32px] overflow-hidden group">
                        <CardHeader className="pb-4 border-b border-slate-50/50 bg-white/5/20">
                            <CardTitle className="text-base font-black flex items-center gap-2 text-foreground uppercase tracking-tight">
                                <span className="opacity-40">📈</span> Лиды и продажи по дням
                            </CardTitle>
                            <CardDescription className="text-[10px] font-black uppercase tracking-widest opacity-40">
                                Динамика за выбранный период по данным CRM
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="h-[320px] w-full">
                                {activityData.length === 0 && !loading ? (
                                    <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground uppercase tracking-widest font-black opacity-20">
                                        <TrendingUp className="w-12 h-12 mb-4" />
                                        Нет данных за период
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={activityData}>
                                            <defs>
                                                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                            <XAxis dataKey="name" className="text-[10px] font-black uppercase tracking-widest text-slate-400" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                                            <YAxis className="text-[10px] font-black uppercase tracking-widest text-slate-400" fontSize={10} tickLine={false} axisLine={false} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                    backdropFilter: 'blur(20px)',
                                                    border: '1px solid #f1f5f9',
                                                    borderRadius: '16px',
                                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                                    fontSize: '10px',
                                                    fontWeight: '900',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em'
                                                }}
                                                labelStyle={{ color: '#000', marginBottom: '8px' }}
                                            />
                                            <Area type="monotone" dataKey="leads" name="Лиды" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
                                            <Area type="monotone" dataKey="sales" name="Продажи" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sales Funnel — по статусам лидов */}
                    <Card className="bg-white/10 backdrop-blur-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white rounded-[32px] overflow-hidden group">
                        <CardHeader className="pb-4 border-b border-slate-50/50 bg-white/5/20">
                            <CardTitle className="text-base font-black flex items-center gap-2 text-foreground uppercase tracking-tight">
                                <span className="opacity-40">🌪️</span> Воронка продаж
                            </CardTitle>
                            <CardDescription className="text-[10px] font-black uppercase tracking-widest opacity-40">
                                По статусам лидов за период
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="h-[320px] w-full">
                                {funnelData.length === 0 && !loading ? (
                                    <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground uppercase tracking-widest font-black opacity-20">
                                        <Target className="w-12 h-12 mb-4" />
                                        Нет данных
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <FunnelChart>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                    backdropFilter: 'blur(20px)',
                                                    border: '1px solid #f1f5f9',
                                                    borderRadius: '16px',
                                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                                    fontSize: '10px',
                                                    fontWeight: '900',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em'
                                                }}
                                            />
                                            <Funnel dataKey="value" data={funnelData} isAnimationActive>
                                                <LabelList position="right" className="fill-foreground text-[8px] font-black uppercase tracking-widest opacity-60" stroke="none" dataKey="name" />
                                            </Funnel>
                                        </FunnelChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AIRopOverviewTab;
