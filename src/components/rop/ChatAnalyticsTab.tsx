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
    <Card className="bg-card/50 backdrop-blur-sm border-white/5 hover:border-white/10 transition-colors">
        <CardContent className="p-6">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <h3 className="text-2xl font-bold mt-2">{value}{suffix}</h3>
                    <div className={cn("flex items-center gap-1 mt-1 text-xs",
                        trend === 'up' ? "text-emerald-500" :
                            trend === 'down' ? "text-red-500" : "text-muted-foreground"
                    )}>
                        {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        <span>{change}</span>
                    </div>
                </div>
                <div className={cn("p-3 rounded-xl", color)}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
            </div>
        </CardContent>
    </Card>
);

const SentimentBadge = ({ sentiment }: { sentiment: string }) => {
    const configs: any = {
        positive: { label: 'Pozitiv', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
        neutral: { label: 'Neutral', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
        negative: { label: 'Negative', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
    };
    const config = configs[sentiment] || configs.neutral;
    return <Badge variant="outline" className={config.color}>{config.label}</Badge>;
};

const StatusBadge = ({ status }: { status: string }) => {
    const configs: any = {
        deal: { label: 'Сделка', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
        meeting: { label: 'Встреча', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
        pending: { label: 'В работе', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
        closed: { label: 'Закрыто', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
    };
    const config = configs[status] || configs.pending;
    return <Badge variant="outline" className={config.color}>{config.label}</Badge>;
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Аналитика чатов</h2>
                    <p className="text-muted-foreground">Мониторинг эффективности коммуникаций</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex bg-muted/50 p-1 rounded-lg border border-border/50">
                        <Button variant="ghost" size="sm" className="h-8 px-3 text-xs">Сегодня</Button>
                        <Button variant="ghost" size="sm" className="h-8 px-3 text-xs">Вчера</Button>
                        <Button variant="secondary" size="sm" className="h-8 px-3 text-xs">7 дней</Button>
                        <Button variant="ghost" size="sm" className="h-8 px-3 text-xs">Месяц</Button>
                    </div>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-[36px] gap-2 border-border/50">
                                <CalendarIcon className="w-4 h-4" />
                                {date?.from ? (
                                    date.to ? (
                                        <>{formatDate(date.from)} - {formatDate(date.to)}</>
                                    ) : (
                                        formatDate(date.from)
                                    )
                                ) : <span>Выбрать даты</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={2}
                                locale={ru}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* --- Tabs --- */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full md:w-[400px] grid-cols-2">
                    <TabsTrigger value="managers" className="gap-2"><User className="w-4 h-4" /> Менеджеры</TabsTrigger>
                    <TabsTrigger value="bot" className="gap-2"><Bot className="w-4 h-4" /> ИИ-Бот</TabsTrigger>
                </TabsList>

                {/* --- Managers View --- */}
                <TabsContent value="managers" className="space-y-6 mt-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <KPICard title="Всего диалогов" value="142" change="+12%" trend="up" icon={MessageSquare} color="bg-blue-500" />
                        <KPICard title="Ср. время ответа" value="45" suffix="с" change="-5%" trend="up" icon={Clock} color="bg-purple-500" />
                        <KPICard title="Конверсия в сделку" value="18" suffix="%" change="+2.4%" trend="up" icon={Target} color="bg-emerald-500" />
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2 bg-gradient-to-br from-card/50 to-card backdrop-blur-xl border-white/5">
                            <CardHeader>
                                <CardTitle>Динамика сообщений</CardTitle>
                                <CardDescription>Объем переписки по дням</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={STATIC_TREND_DATA}>
                                            <defs>
                                                <linearGradient id="colorManagers" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                            <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                            <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                                            <Area type="monotone" dataKey="managers" stroke="#3b82f6" fill="url(#colorManagers)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-card/50 to-card backdrop-blur-xl border-white/5">
                            <CardHeader>
                                <CardTitle>Время ответа</CardTitle>
                                <CardDescription>Распределение по часам (Heatmap)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={STATIC_HOURLY_DATA}>
                                            <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} cursor={{ fill: 'transparent' }} />
                                            <Bar dataKey="response" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Dialogs Table */}
                    <Card className="bg-card/50 backdrop-blur-xl border-white/5">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Активные диалоги</CardTitle>
                                <div className="relative w-64">
                                    <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <input
                                        placeholder="Поиск по клиенту или менеджеру..."
                                        className="w-full bg-background/50 border border-white/10 rounded-lg pl-8 p-2 text-sm focus:outline-none focus:border-primary/50"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-white/10 hover:bg-transparent">
                                        <TableHead>Менеджер</TableHead>
                                        <TableHead>Клиент</TableHead>
                                        <TableHead>Дата</TableHead>
                                        <TableHead className="text-center">Сообщений</TableHead>
                                        <TableHead className="text-center">Длит.</TableHead>
                                        <TableHead className="text-center">Настроение</TableHead>
                                        <TableHead className="text-right">Статус</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {STATIC_DIALOGS.map((dialog) => (
                                        <TableRow key={dialog.id} className="border-white/5 hover:bg-white/5">
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                                            {dialog.manager.split(' ').map(n => n[0]).join('')}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium text-sm">{dialog.manager}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{dialog.client}</TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {dialog.date}
                                            </TableCell>
                                            <TableCell className="text-center">{dialog.messages}</TableCell>
                                            <TableCell className="text-center text-sm">{Math.floor(dialog.duration / 60)}м {dialog.duration % 60}с</TableCell>
                                            <TableCell className="text-center">
                                                <SentimentBadge sentiment={dialog.sentiment} />
                                            </TableCell>
                                            <TableCell className="text-right">
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <KPICard title="Всего диалогов" value="450" change="+12%" trend="up" icon={Bot} color="bg-blue-500" />
                        <KPICard title="Успешность (Goal)" value="85" suffix="%" change="+5%" trend="up" icon={CheckCircle2} color="bg-emerald-500" />
                        <KPICard title="Передано людям" value="12" suffix="%" change="-2%" trend="up" icon={User} color="bg-amber-500" />
                        <KPICard title="Ошибки" value="3" suffix="%" change="-1%" trend="up" icon={AlertTriangle} color="bg-red-500" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Bot Trend Chart */}
                        <Card className="lg:col-span-2 bg-gradient-to-br from-card/50 to-card backdrop-blur-xl border-white/5">
                            <CardHeader>
                                <CardTitle>Нагрузка на бота</CardTitle>
                                <CardDescription>Количество автоматических диалогов</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={STATIC_TREND_DATA}>
                                            <defs>
                                                <linearGradient id="colorBot" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                            <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                            <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                                            <Area type="monotone" dataKey="bot" stroke="#8b5cf6" fill="url(#colorBot)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Prompt Recommendations */}
                        <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-primary">
                                    <Lightbulb className="w-5 h-5" />
                                    AI-Советы
                                </CardTitle>
                                <CardDescription>Как улучшить конверсию бота</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {STATIC_RECOMMENDATIONS.map((rec, i) => (
                                    <div key={i} className="flex gap-3 p-3 rounded-lg bg-card/40 border border-primary/10 hover:border-primary/30 transition-all cursor-pointer">
                                        <Zap className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                        <p className="text-sm font-medium leading-tight">{rec}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Bot Errors */}
                    <Card className="bg-gradient-to-br from-red-950/20 to-transparent border-red-500/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-400">
                                <AlertCircle className="w-5 h-5" />
                                Анализ ошибок
                            </CardTitle>
                            <CardDescription>Основные причины сбоев в диалогах</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {STATIC_ERRORS.map((err, i) => (
                                    <Card key={i} className="bg-card/50 border-white/5 hover:border-red-500/30 transition-all">
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge variant="outline" className="border-red-500/30 text-red-500">{err.count} случаев</Badge>
                                                <span className={cn("text-xs", err.trend.startsWith('+') ? "text-red-500" : "text-emerald-500")}>
                                                    {err.trend} на этой неделе
                                                </span>
                                            </div>
                                            <h4 className="font-semibold mb-1">{err.type}</h4>
                                            <p className="text-xs text-muted-foreground italic">"{err.example}"</p>
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
