import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    TrendingUp,
    TrendingDown,
    Users,
    DollarSign,
    Target,
    CheckCircle2,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw,
    Zap,
    LayoutDashboard,
    Brain,
    Calendar as CalendarIcon,
    MessageSquare,
    Phone
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    FunnelChart,
    Funnel,
    LabelList
} from 'recharts';
import { motion } from 'framer-motion';
import { format, subDays, startOfMonth, startOfWeek, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AIRopTask, AIRopAudit } from '@/hooks/useAIRop';
import { DateRange } from 'react-day-picker';

interface AIRopOverviewTabProps {
    tasks: AIRopTask[];
    audits: AIRopAudit[];
    projectId: string | null;
    onRefresh: () => void;
}

// Mock Data Generators
const generateActivityData = (range: DateRange | undefined) => {
    const data = [];
    const days = range?.from && range?.to
        ? Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)) + 1
        : 7;

    for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        data.push({
            name: format(date, 'dd.MM', { locale: ru }),
            calls: Math.floor(Math.random() * 40) + 20,
            messages: Math.floor(Math.random() * 60) + 40,
        });
    }
    return data;
};

const funnelData = [
    { "value": 100, "name": "Лиды", "fill": "#8884d8" },
    { "value": 80, "name": "Звонки", "fill": "#83a6ed" },
    { "value": 50, "name": "Встречи", "fill": "#8dd1e1" },
    { "value": 40, "name": "КП", "fill": "#82ca9d" },
    { "value": 26, "name": "Сделки", "fill": "#a4de6c" }
];

const mockManagers = [
    { id: 1, name: 'Анна С.', role: 'Senior Manager', avatar: '/avatars/01.png', calls: 142, chats: 350, conversion: 24, deals: 8, score: 92 },
    { id: 2, name: 'Михаил Д.', role: 'Manager', avatar: '/avatars/02.png', calls: 98, chats: 410, conversion: 18, deals: 5, score: 78 },
    { id: 3, name: 'Елена В.', role: 'Junior Manager', avatar: '/avatars/03.png', calls: 185, chats: 220, conversion: 15, deals: 3, score: 65 },
    { id: 4, name: 'Дмитрий К.', role: 'Manager', avatar: '/avatars/04.png', calls: 110, chats: 290, conversion: 21, deals: 6, score: 84 },
];

const KPICard = ({ title, value, change, icon: Icon, trend, color }: any) => (
    <Card className="bg-card/50 backdrop-blur-sm border-white/5 hover:border-white/10 transition-colors">
        <CardContent className="p-6">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <h3 className="text-2xl font-bold mt-2">{value}</h3>
                    <div className={cn("flex items-center gap-1 mt-1 text-xs",
                        trend === 'up' ? "text-emerald-500" : "text-red-500"
                    )}>
                        {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        <span>{change}</span>
                        <span className="text-muted-foreground ml-1">vs прошлый период</span>
                    </div>
                </div>
                <div className={cn("p-3 rounded-xl", color)}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
            </div>
        </CardContent>
    </Card>
);

export const AIRopOverviewTab: React.FC<AIRopOverviewTabProps> = ({ tasks, audits, onRefresh }) => {
    const [date, setDate] = useState<DateRange | undefined>({
        from: subDays(new Date(), 7),
        to: new Date(),
    });

    const [activityData, setActivityData] = useState(generateActivityData(date));
    const [activeFilter, setActiveFilter] = useState('week');

    useEffect(() => {
        setActivityData(generateActivityData(date));
    }, [date]);

    const handleQuickFilter = (filter: string) => {
        setActiveFilter(filter);
        const today = new Date();
        switch (filter) {
            case 'today':
                setDate({ from: today, to: today });
                break;
            case 'yesterday':
                const yesterday = subDays(today, 1);
                setDate({ from: yesterday, to: yesterday });
                break;
            case 'week':
                setDate({ from: subDays(today, 7), to: today });
                break;
            case 'month':
                setDate({ from: startOfMonth(today), to: today });
                break;
        }
    };

    // Mock KPI calculation based on date range duration (just for visual feedback)
    const isShortRange = date?.from && date?.to && (date.to.getTime() - date.from.getTime() < 86400000 * 2);

    const kpis = [
        {
            title: "Выручка",
            value: isShortRange ? "145K ₽" : "2.4M ₽",
            change: "+12.5%",
            trend: "up",
            icon: DollarSign,
            color: "bg-gradient-to-br from-emerald-500 to-green-600"
        },
        {
            title: "Конверсия",
            value: isShortRange ? "12.0%" : "14.2%",
            change: "+2.1%",
            trend: "up",
            icon: TrendingUp,
            color: "bg-gradient-to-br from-blue-500 to-cyan-600"
        },
        {
            title: "Активные сделки",
            value: "42",
            change: "-5%",
            trend: "down",
            icon: Target,
            color: "bg-gradient-to-br from-purple-500 to-pink-600"
        },
        {
            title: "Задачи ИИ",
            value: tasks.filter(t => t.status === 'pending').length.toString(),
            change: "Active",
            trend: "up",
            icon: Brain,
            color: "bg-gradient-to-br from-amber-500 to-orange-600"
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Обзор показателей</h2>
                    <p className="text-muted-foreground">Ключевые метрики эффективности отдела продаж</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex bg-muted/50 p-1 rounded-lg border border-border/50">
                        <Button
                            variant={activeFilter === 'today' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => handleQuickFilter('today')}
                            className="h-8 px-3 text-xs"
                        >
                            Сегодня
                        </Button>
                        <Button
                            variant={activeFilter === 'yesterday' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => handleQuickFilter('yesterday')}
                            className="h-8 px-3 text-xs"
                        >
                            Вчера
                        </Button>
                        <Button
                            variant={activeFilter === 'week' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => handleQuickFilter('week')}
                            className="h-8 px-3 text-xs"
                        >
                            7 дней
                        </Button>
                        <Button
                            variant={activeFilter === 'month' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => handleQuickFilter('month')}
                            className="h-8 px-3 text-xs"
                        >
                            Месяц
                        </Button>
                    </div>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-[36px] gap-2 border-border/50">
                                <CalendarIcon className="w-4 h-4" />
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
                        <PopoverContent className="w-auto p-0" align="end">
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

                    <Button onClick={onRefresh} variant="outline" size="sm" className="gap-2 border-border/50 h-[36px]">
                        <RefreshCw className="w-4 h-4" />
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

                {/* Activity Chart */}
                <Card className="lg:col-span-2 bg-gradient-to-br from-card/50 to-card backdrop-blur-xl border-white/5">
                    <CardHeader>
                        <CardTitle>Активность менеджеров</CardTitle>
                        <CardDescription>Динамика звонков и сообщений за выбранный период</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={activityData}>
                                    <defs>
                                        <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="calls" name="Звонки" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorCalls)" />
                                    <Area type="monotone" dataKey="messages" name="Сообщения" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorMessages)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Sales Funnel */}
                <Card className="bg-gradient-to-br from-card/50 to-card backdrop-blur-xl border-white/5">
                    <CardHeader>
                        <CardTitle>Воронка продаж</CardTitle>
                        <CardDescription>Конверсия по этапам</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <FunnelChart>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Funnel
                                        dataKey="value"
                                        data={funnelData}
                                        isAnimationActive
                                    >
                                        <LabelList position="right" fill="#fff" stroke="none" dataKey="name" />
                                    </Funnel>
                                </FunnelChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Manager Efficiency Table */}
            <Card className="bg-gradient-to-br from-card/50 to-card backdrop-blur-xl border-white/5">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Эффективность менеджеров</CardTitle>
                            <CardDescription>Ключевые показатели работы сотрудников</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowUpRight className="w-4 h-4" />
                            Подробнее
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-white/10">
                                <TableHead className="w-[250px]">Менеджер</TableHead>
                                <TableHead className="text-center">Звонки</TableHead>
                                <TableHead className="text-center">Чаты</TableHead>
                                <TableHead className="text-center">Конверсия</TableHead>
                                <TableHead className="text-center">Сделки</TableHead>
                                <TableHead className="text-right">Eff. Score</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockManagers.map((manager) => (
                                <TableRow key={manager.id} className="hover:bg-white/5 border-white/5 transition-colors">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-8 h-8 border border-white/10">
                                                <AvatarImage src={manager.avatar} />
                                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                                    {manager.name.split(' ').map(n => n[0]).join('')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">{manager.name}</div>
                                                <div className="text-xs text-muted-foreground">{manager.role}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <Phone className="w-3 h-3 text-muted-foreground" />
                                            {manager.calls}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <MessageSquare className="w-3 h-3 text-muted-foreground" />
                                            {manager.chats}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className={cn(
                                            "font-medium",
                                            manager.conversion >= 20 ? "text-emerald-500" :
                                                manager.conversion >= 15 ? "text-amber-500" : "text-red-500"
                                        )}>
                                            {manager.conversion}%
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center font-medium">{manager.deals}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant="outline" className={cn(
                                            "bg-opacity-10 w-12 justify-center",
                                            manager.score >= 90 ? "bg-emerald-500 text-emerald-500 border-emerald-500/20" :
                                                manager.score >= 75 ? "bg-amber-500 text-amber-500 border-amber-500/20" :
                                                    "bg-red-500 text-red-500 border-red-500/20"
                                        )}>
                                            {manager.score}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default AIRopOverviewTab;
