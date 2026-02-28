import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    MessageSquare,
    Bot,
    User,
    Clock,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    CheckCircle2,
    RefreshCw,
    Lightbulb,
    Zap,
    AlertTriangle,
    Calendar as CalendarIcon,
    ArrowUpRight,
    ArrowDownRight,
    Search as SearchIcon,
    Target
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
    Bar
} from 'recharts';
import { format, subDays, startOfMonth } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

interface ChatAnalyticsTabProps {
    projectId: string | null;
}

// --- CONSTANTS (Defined OUTSIDE component to prevent re-creation) ---

const STATIC_TREND_DATA = [
    { name: '02.02', managers: 30, bot: 50, responseTime: 45 },
    { name: '03.02', managers: 45, bot: 60, responseTime: 50 },
    { name: '04.02', managers: 35, bot: 55, responseTime: 40 },
    { name: '05.02', managers: 50, bot: 70, responseTime: 35 },
    { name: '06.02', managers: 40, bot: 65, responseTime: 55 },
    { name: '07.02', managers: 60, bot: 80, responseTime: 30 },
    { name: '08.02', managers: 55, bot: 75, responseTime: 42 },
];

const STATIC_HOURLY_DATA = [
    { hour: '09:00', volume: 20, response: 30 },
    { hour: '10:00', volume: 45, response: 40 },
    { hour: '11:00', volume: 60, response: 55 },
    { hour: '12:00', volume: 50, response: 45 },
    { hour: '13:00', volume: 40, response: 35 },
    { hour: '14:00', volume: 55, response: 50 },
    { hour: '15:00', volume: 70, response: 60 },
    { hour: '16:00', volume: 65, response: 55 },
    { hour: '17:00', volume: 60, response: 50 },
    { hour: '18:00', volume: 45, response: 40 },
];

const STATIC_DIALOGS = [
    { id: 1, manager: 'Анна С.', client: 'Иван Петров', date: 'Сегодня 14:30', messages: 24, duration: 340, sentiment: 'positive', status: 'deal' },
    { id: 2, manager: 'Михаил Д.', client: 'ООО "Вектор"', date: 'Сегодня 12:15', messages: 15, duration: 180, sentiment: 'neutral', status: 'pending' },
    { id: 3, manager: 'Елена В.', client: 'Мария К.', date: 'Вчера 16:45', messages: 42, duration: 650, sentiment: 'positive', status: 'deal' },
    { id: 4, manager: 'Дмитрий К.', client: 'Сергей (Лид)', date: 'Вчера 10:20', messages: 8, duration: 45, sentiment: 'negative', status: 'closed' },
    { id: 5, manager: 'Анна С.', client: 'Алексей М.', date: '06.02 09:15', messages: 35, duration: 420, sentiment: 'positive', status: 'meeting' },
];

const STATIC_ERRORS = [
    { type: 'Непонимание контекста', count: 12, trend: '+2', example: 'Клиент спросил про "условия доставки", бот ответил про "самовывоз".' },
    { type: 'Круговая логика', count: 5, trend: '-1', example: 'Бот застрял в цикле приветствия.' },
    { type: 'Отказ оператора', count: 3, trend: '0', example: 'Не удалось перевести на оператора (нет свободных).' },
];

const STATIC_RECOMMENDATIONS = [
    "Добавьте примеры ответов на вопросы о сроках доставки.",
    "Уточните скрипт для обработки возражений по цене.",
    "Сократите приветственное сообщение для лучшей читаемости."
];

// --- Subcomponents ---

const KPICard = ({ title, value, change, icon: Icon, trend, color, suffix = "" }: any) => (
    <Card className="bg-white/80 backdrop-blur-3xl shadow-sm border border-white rounded-[28px] overflow-hidden group hover:shadow-xl transition-all duration-500">
        <CardContent className="p-6">
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">{title}</p>
                    <h3 className="text-3xl font-black text-foreground tracking-tighter mt-1">{value}{suffix}</h3>
                    <div className={cn("flex items-center gap-1.5 mt-2 text-[10px] font-black uppercase tracking-widest",
                        trend === 'up' ? "text-emerald-600" :
                            trend === 'down' ? "text-rose-600" : "text-slate-400"
                    )}>
                        {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{change}</span>
                    </div>
                </div>
                <div className={cn("p-4 rounded-2xl border bg-slate-50 border-slate-100 group-hover:rotate-6 transition-transform shadow-sm", color)}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </CardContent>
    </Card>
);

const SentimentBadge = ({ sentiment }: { sentiment: string }) => {
    const configs: any = {
        positive: { label: 'Pozitiv', color: 'bg-emerald-50 text-emerald-600 border-emerald-100/50' },
        neutral: { label: 'Neutral', color: 'bg-slate-50 text-slate-500 border-slate-100/50' },
        negative: { label: 'Negative', color: 'bg-rose-50 text-rose-600 border-rose-100/50' },
    };
    const config = configs[sentiment] || configs.neutral;
    return <Badge variant="outline" className={cn("px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border shadow-sm", config.color)}>{config.label}</Badge>;
};

const StatusBadge = ({ status }: { status: string }) => {
    const configs: any = {
        deal: { label: 'Сделка', color: 'bg-blue-50 text-blue-600 border-blue-100/50' },
        meeting: { label: 'Встреча', color: 'bg-indigo-50 text-indigo-600 border-indigo-100/50' },
        pending: { label: 'В работе', color: 'bg-amber-50 text-amber-600 border-amber-100/50' },
        closed: { label: 'Закрыто', color: 'bg-slate-50 text-slate-500 border-slate-100/50' },
    };
    const config = configs[status] || configs.pending;
    return <Badge variant="outline" className={cn("px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border shadow-sm", config.color)}>{config.label}</Badge>;
};

export const ChatAnalyticsTab: React.FC<ChatAnalyticsTabProps> = ({ projectId }) => {
    // State - Minimal
    const [date, setDate] = useState<DateRange | undefined>({
        from: subDays(new Date(), 7),
        to: new Date(),
    });

    const [activeFilter, setActiveFilter] = useState('week');
    const [activeTab, setActiveTab] = useState('managers');

    // Helper for date display
    const formatDate = (d: Date) => {
        try {
            return format(d, "dd MMM", { locale: ru });
        } catch (e) {
            return '...';
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* --- Controls Bar --- */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-[20px] bg-white border border-slate-100 shadow-sm relative group overflow-hidden">
                        <div className="absolute inset-0 bg-blue-500/10 rounded-[20px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <MessageSquare className="w-8 h-8 text-blue-600 relative z-10 group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Аналитика чатов</h2>
                        <p className="text-xs font-medium uppercase tracking-widest opacity-40 mt-1">Мониторинг эффективности коммуникаций в реальном времени</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-100 backdrop-blur-md">
                        {['Сегодня', 'Вчера', '7 дней', 'Месяц'].map((f) => (
                            <Button
                                key={f}
                                variant="ghost"
                                size="sm"
                                onClick={() => setActiveFilter(f.toLowerCase())}
                                className={cn(
                                    "h-8 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                                    (activeFilter === f.toLowerCase() || (activeFilter === 'week' && f === '7 дней'))
                                        ? "bg-white text-blue-600 shadow-sm"
                                        : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                                )}
                            >
                                {f}
                            </Button>
                        ))}
                    </div>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="lg" className="h-11 rounded-2xl bg-white/50 border-slate-100 shadow-sm gap-3 font-black uppercase tracking-widest text-[10px] hover:bg-white transition-all">
                                <CalendarIcon className="w-4 h-4 text-blue-600" />
                                {date?.from ? (
                                    date.to ? (
                                        <>{format(date.from, "d MMM", { locale: ru })} — {format(date.to, "d MMM", { locale: ru })}</>
                                    ) : (
                                        format(date.from, "d MMMM", { locale: ru })
                                    )
                                ) : <span>Выбрать период</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 border-white/80 bg-white/95 backdrop-blur-3xl shadow-2xl rounded-[32px] overflow-hidden" align="end">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={2}
                                locale={ru}
                                className="p-4"
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* --- Tabs --- */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-slate-100/50 p-1.5 rounded-[22px] border border-slate-100 backdrop-blur-md mb-8 w-fit">
                    <TabsTrigger value="managers" className="rounded-[18px] px-8 py-2.5 text-xs font-black uppercase tracking-widest gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-xl data-[state=active]:shadow-blue-500/10 transition-all duration-300">
                        <User className="w-4 h-4" /> Менеджеры
                    </TabsTrigger>
                    <TabsTrigger value="bot" className="rounded-[18px] px-8 py-2.5 text-xs font-black uppercase tracking-widest gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-xl data-[state=active]:shadow-blue-500/10 transition-all duration-300">
                        <Bot className="w-4 h-4" /> ИИ-Бот
                    </TabsTrigger>
                </TabsList>

                {/* --- Managers View --- */}
                <TabsContent value="managers" className="space-y-6 mt-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <KPICard title="Всего диалогов" value="142" change="+12%" trend="up" icon={MessageSquare} color="text-blue-600" />
                        <KPICard title="Ср. время ответа" value="45" suffix="с" change="-5%" trend="up" icon={Clock} color="text-indigo-600" />
                        <KPICard title="Конверсия в сделку" value="18" suffix="%" change="+2.4%" trend="up" icon={Target} color="text-emerald-600" />
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <Card className="lg:col-span-2 bg-white/80 backdrop-blur-3xl shadow-sm border border-white rounded-[32px] overflow-hidden">
                            <div className="p-8 border-b border-slate-50 bg-slate-50/30">
                                <h4 className="text-sm font-black text-foreground uppercase tracking-tight">Динамика сообщений</h4>
                                <p className="text-[10px] font-black text-muted-foreground uppercase opacity-40 tracking-widest mt-1">Объем переписки по дням</p>
                            </div>
                            <CardContent className="p-8">
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={STATIC_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorManagers" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.01} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                                            <XAxis
                                                dataKey="name"
                                                stroke="#94a3b8"
                                                fontSize={10}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(val) => val}
                                                style={{ fontWeight: 900, textTransform: 'uppercase' }}
                                            />
                                            <YAxis
                                                stroke="#94a3b8"
                                                fontSize={10}
                                                tickLine={false}
                                                axisLine={false}
                                                style={{ fontWeight: 900 }}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                    backdropFilter: 'blur(10px)',
                                                    border: '1px solid #f1f5f9',
                                                    borderRadius: '16px',
                                                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
                                                    padding: '12px'
                                                }}
                                                itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', color: '#1e293b' }}
                                                labelStyle={{ fontSize: '10px', fontWeight: 900, color: '#64748b', marginBottom: '4px' }}
                                            />
                                            <Area type="monotone" dataKey="managers" stroke="#2563eb" strokeWidth={3} fill="url(#colorManagers)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white/80 backdrop-blur-3xl shadow-sm border border-white rounded-[32px] overflow-hidden">
                            <div className="p-8 border-b border-slate-50 bg-slate-50/30">
                                <h4 className="text-sm font-black text-foreground uppercase tracking-tight">Время ответа</h4>
                                <p className="text-[10px] font-black text-muted-foreground uppercase opacity-40 tracking-widest mt-1">Распределение по часам</p>
                            </div>
                            <CardContent className="p-8">
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={STATIC_HOURLY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                                            <XAxis
                                                dataKey="hour"
                                                stroke="#94a3b8"
                                                fontSize={8}
                                                tickLine={false}
                                                axisLine={false}
                                                style={{ fontWeight: 900 }}
                                            />
                                            <YAxis
                                                stroke="#94a3b8"
                                                fontSize={10}
                                                tickLine={false}
                                                axisLine={false}
                                                style={{ fontWeight: 900 }}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                    backdropFilter: 'blur(10px)',
                                                    border: '1px solid #f1f5f9',
                                                    borderRadius: '16px',
                                                    padding: '12px'
                                                }}
                                                itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', color: '#4f46e5' }}
                                                cursor={{ fill: '#f8fafc', radius: 8 }}
                                            />
                                            <Bar dataKey="response" fill="#4f46e5" radius={[6, 6, 6, 6]} barSize={12} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Dialogs Table */}
                    <Card className="bg-white/80 backdrop-blur-3xl shadow-sm border border-white rounded-[32px] overflow-hidden">
                        <div className="p-8 border-b border-slate-50 bg-slate-50/30">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                                <h4 className="text-lg font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                                    <span className="opacity-40">📜</span> Активные диалоги
                                </h4>
                                <div className="relative w-full sm:w-80">
                                    <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <input
                                        placeholder="ПОИСК ПО КЛИЕНТУ ИЛИ МЕНЕДЖЕРУ..."
                                        className="w-full bg-slate-100/50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all shadow-inner"
                                    />
                                </div>
                            </div>
                        </div>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-slate-100 hover:bg-transparent bg-slate-50/20">
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-12">Менеджер</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest px-8">Клиент</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest px-8">Дата</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 text-center">Сообщ.</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 text-center">Длит.</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 text-center">Тон</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 text-right">Статус</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {STATIC_DIALOGS.map((dialog) => (
                                        <TableRow key={dialog.id} className="border-slate-50 hover:bg-slate-50/50 group transition-all">
                                            <TableCell className="px-8 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9 border-2 border-white shadow-sm ring-1 ring-slate-100">
                                                        <AvatarFallback className="bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest">
                                                            {dialog.manager.split(' ').map(n => n[0]).join('')}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-black text-xs text-foreground uppercase tracking-tighter">{dialog.manager}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-8 py-4">
                                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{dialog.client}</span>
                                            </TableCell>
                                            <TableCell className="px-8 py-4">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">{dialog.date}</span>
                                            </TableCell>
                                            <TableCell className="px-8 py-4 text-center">
                                                <Badge variant="secondary" className="bg-slate-100/50 text-slate-600 rounded-lg text-[10px] font-black">{dialog.messages}</Badge>
                                            </TableCell>
                                            <TableCell className="px-8 py-4 text-center">
                                                <span className="text-[10px] font-black text-slate-600">{Math.floor(dialog.duration / 60)}м {dialog.duration % 60}с</span>
                                            </TableCell>
                                            <TableCell className="px-8 py-4 text-center">
                                                <SentimentBadge sentiment={dialog.sentiment} />
                                            </TableCell>
                                            <TableCell className="px-8 py-4 text-right">
                                                <StatusBadge status={dialog.status} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- AI Bot View --- */}
                <TabsContent value="bot" className="space-y-6 mt-6">
                    {/* Bot KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <KPICard title="Всего диалогов" value="450" change="+12%" trend="up" icon={Bot} color="text-blue-600" />
                        <KPICard title="Успешность (Goal)" value="85" suffix="%" change="+5%" trend="up" icon={CheckCircle2} color="text-emerald-600" />
                        <KPICard title="Передано людям" value="12" suffix="%" change="-2%" trend="up" icon={User} color="text-amber-600" />
                        <KPICard title="Ошибки" value="3" suffix="%" change="-1%" trend="up" icon={AlertTriangle} color="text-rose-600" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Bot Trend Chart */}
                        <Card className="lg:col-span-2 bg-white/80 backdrop-blur-3xl shadow-sm border border-white rounded-[32px] overflow-hidden">
                            <div className="p-8 border-b border-slate-50 bg-slate-50/30">
                                <h4 className="text-sm font-black text-foreground uppercase tracking-tight">Нагрузка на бота</h4>
                                <p className="text-[10px] font-black text-muted-foreground uppercase opacity-40 tracking-widest mt-1">Количество автоматических диалогов</p>
                            </div>
                            <CardContent className="p-8">
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={STATIC_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorBot" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.01} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                                            <XAxis
                                                dataKey="name"
                                                stroke="#94a3b8"
                                                fontSize={10}
                                                tickLine={false}
                                                axisLine={false}
                                                style={{ fontWeight: 900, textTransform: 'uppercase' }}
                                            />
                                            <YAxis
                                                stroke="#94a3b8"
                                                fontSize={10}
                                                tickLine={false}
                                                axisLine={false}
                                                style={{ fontWeight: 900 }}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                    backdropFilter: 'blur(10px)',
                                                    border: '1px solid #f1f5f9',
                                                    borderRadius: '16px',
                                                    padding: '12px'
                                                }}
                                                itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', color: '#7c3aed' }}
                                                labelStyle={{ fontSize: '10px', fontWeight: 900, color: '#64748b', marginBottom: '4px' }}
                                            />
                                            <Area type="monotone" dataKey="bot" stroke="#8b5cf6" strokeWidth={3} fill="url(#colorBot)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Prompt Recommendations */}
                        <Card className="bg-gradient-to-br from-indigo-700 to-blue-800 border-0 rounded-[32px] overflow-hidden shadow-xl relative group">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
                            <div className="p-8 border-b border-white/10 bg-white/5 relative z-10">
                                <h4 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                                    <Lightbulb className="w-5 h-4 text-yellow-300" /> AI-ОПТИМИЗАЦИЯ
                                </h4>
                                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mt-1">Как улучшить конверсию бота</p>
                            </div>
                            <CardContent className="p-8 space-y-4 relative z-10">
                                {STATIC_RECOMMENDATIONS.map((rec, i) => (
                                    <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 transition-all cursor-pointer group/item">
                                        <div className="p-2 rounded-xl bg-yellow-400 text-yellow-950 shadow-[0_0_15px_rgba(250,204,21,0.4)] group-hover/item:scale-110 transition-transform">
                                            <Zap className="w-3 h-3 fill-current" />
                                        </div>
                                        <p className="text-[10px] font-black leading-relaxed text-white uppercase tracking-widest">{rec}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Bot Errors */}
                    <Card className="bg-rose-50/30 border-rose-100 rounded-[32px] overflow-hidden border">
                        <div className="p-8 border-b border-rose-100 bg-rose-50/50">
                            <h4 className="text-sm font-black text-rose-900 uppercase tracking-tight flex items-center gap-2">
                                <AlertCircle className="w-5 h-5" /> АНАЛИЗ ОШИБОК ДИАЛОГОВ
                            </h4>
                            <p className="text-[10px] font-black text-rose-600/60 uppercase tracking-widest mt-1">Критические сбои и непонимания контекста</p>
                        </div>
                        <CardContent className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {STATIC_ERRORS.map((err, i) => (
                                    <Card key={i} className="bg-white border-white shadow-sm hover:shadow-md transition-all rounded-2xl group overflow-hidden border relative">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-rose-400 opacity-40" />
                                        <CardContent className="p-5">
                                            <div className="flex justify-between items-start mb-4">
                                                <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-100 text-[8px] font-black uppercase tracking-widest rounded-full">{err.count} случаев</Badge>
                                                <span className={cn("text-[9px] font-black uppercase tracking-widest", err.trend.startsWith('+') ? "text-rose-600" : "text-emerald-600")}>
                                                    {err.trend} ТРЕНД
                                                </span>
                                            </div>
                                            <h4 className="text-xs font-black uppercase tracking-widest text-foreground mb-2">{err.type}</h4>
                                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 italic">
                                                <p className="text-[10px] text-muted-foreground leading-relaxed">"{err.example}"</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ChatAnalyticsTab;
