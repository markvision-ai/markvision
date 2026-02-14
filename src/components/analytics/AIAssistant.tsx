import { useState, useRef, useEffect, forwardRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Send,
  User,
  Trash2,
  Sparkles,
  TrendingUp,
  Target,
  Lightbulb,
  MessageSquare,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Maximize2,
  RefreshCcw,
  Bot,
  Settings2,
  Calendar as CalendarIcon,
  Filter,
  ChevronDown,
  ChevronUp,
  Terminal,
  Cpu,
  Activity,
  Copy,
  Check,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAIChat, ChatMessage } from '@/hooks/useAIChat';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface AIAssistantProps {
  hideDashboard?: boolean;
  context?: {
    spend?: number;
    impressions?: number;
    clicks?: number;
    leads?: number;
    visits?: number;
    sales?: number;
    revenue?: number;
    cpl?: number;
    cac?: number;
    aov?: number;
    romi?: number;
    projectId?: string;
  };
}

const suggestedQuestions = [
  { text: 'Проанализируй воронку продаж', icon: TrendingUp },
  { text: 'Как снизить стоимость лида?', icon: Target },
  { text: 'Прогноз на следующую неделю', icon: Lightbulb },
  { text: 'Оптимизация бюджета', icon: BarChart3 },
];

const MARK_ONLINE_THRESHOLD_SEC = 300; // 5 min

const useMarkStatus = () => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const checkStatus = (lastSeenStr: string | null) => {
      if (!lastSeenStr) return false;
      const lastSeen = new Date(lastSeenStr);
      const diffSeconds = (Date.now() - lastSeen.getTime()) / 1000;
      return diffSeconds < MARK_ONLINE_THRESHOLD_SEC;
    };

    const fetchStatus = async () => {
      // 1) system_health (ai_worker) — основной источник, обновляется воркером
      const { data: health } = await supabase
        .from('system_health')
        .select('last_check_at')
        .eq('service_name', 'ai_worker')
        .order('last_check_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (health?.last_check_at && checkStatus(health.last_check_at)) {
        setIsOnline(true);
        return;
      }

      // 2) system_status (mark-ai-worker) — legacy
      const { data: status } = await supabase
        .from('system_status')
        .select('last_seen')
        .eq('id', 'mark-ai-worker')
        .maybeSingle();

      if (status?.last_seen && checkStatus(status.last_seen)) {
        setIsOnline(true);
        return;
      }

      // 3) ai_bridge_tasks — недавняя активность
      const { data: tasks } = await supabase
        .from('ai_bridge_tasks')
        .select('updated_at, status')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (tasks && tasks.length > 0) {
        const t = tasks[0] as { updated_at: string; status: string };
        const recent = (Date.now() - new Date(t.updated_at).getTime()) < 5 * 60 * 1000;
        const ok = ['running', 'completed', 'pending'].includes(t.status);
        if (recent && ok) {
          setIsOnline(true);
          return;
        }
      }

      setIsOnline(false);
    };

    fetchStatus();

    const channel = supabase.channel('mark_status')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_health', filter: 'service_name=eq.ai_worker' }, (p: any) => {
        if (p.new?.last_check_at) setIsOnline(checkStatus(p.new.last_check_at));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_status', filter: 'id=eq.mark-ai-worker' }, (p: any) => {
        if (p.new?.last_seen) setIsOnline(checkStatus(p.new.last_seen));
      })
      .subscribe();

    const interval = setInterval(fetchStatus, 30000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  return isOnline;
};

export const AIAssistant = ({ context, hideDashboard = false }: AIAssistantProps) => {
  const isMarkOnline = useMarkStatus();
  const [activeTab, setActiveTab] = useState(hideDashboard ? 'chat' : 'dashboard');
  const [isExpanded, setIsExpanded] = useState(false);
  const [dateRange, setDateRange] = useState('7d');
  const [visibleMetrics, setVisibleMetrics] = useState({
    spend: true,
    revenue: true,
    romi: true,
    cpl: true,
    spl: true
  });

  // Force chat tab if hideDashboard is true
  useEffect(() => {
    if (hideDashboard) {
      setActiveTab('chat');
    }
  }, [hideDashboard]);

  const safeContext = context;

  const leads = context?.leads || 0;
  const revenue = context?.revenue || 0;
  const data = {
    spend: context?.spend || 0,
    revenue,
    impressions: context?.impressions || 0,
    clicks: context?.clicks || 0,
    leads,
    sales: context?.sales || 0,
    romi: context?.romi || 0,
    cpl: context?.cpl || 0,
    spl: leads > 0 ? Math.round(revenue / leads) : 0,
  };

  const funnelData = [
    { name: 'Показы', value: data.impressions, fill: '#34d399' },
    { name: 'Клики', value: data.clicks, fill: '#10b981' },
    { name: 'Лиды', value: data.leads, fill: '#22c55e' },
    { name: 'Продажи', value: data.sales, fill: '#84cc16' },
  ];

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(val);

  return (
    <div className={cn(
      "transition-all duration-300 ease-in-out",
      isExpanded ? "fixed inset-4 z-50 bg-background rounded-xl border shadow-2xl p-6 overflow-y-auto" : "w-full"
    )}>
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">AI Центр Аналитики</h2>
                <Badge variant="outline" className={cn(
                  "ml-2 transition-colors h-5 text-[10px] px-1.5",
                  isMarkOnline === true && "bg-green-500/10 text-green-500 border-green-500/20",
                  isMarkOnline === false && "bg-red-500/10 text-red-500 border-red-500/20",
                  isMarkOnline === null && "bg-muted text-muted-foreground border-border"
                )}>
                  Марка: {isMarkOnline === true ? 'Online' : isMarkOnline === false ? 'Offline' : 'Проверка…'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">Интеллектуальный анализ ваших показателей</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!hideDashboard && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-2 hidden sm:flex">
                    <Filter className="w-4 h-4" />
                    <span className="hidden lg:inline">Фильтры</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Настройки отображения</h4>
                      <p className="text-sm text-muted-foreground">
                        Настройте период и видимость метрик.
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="date-range">Период</Label>
                        <Select value={dateRange} onValueChange={setDateRange}>
                          <SelectTrigger id="date-range" className="col-span-2 h-8">
                            <SelectValue placeholder="Выберите период" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="24h">24 часа</SelectItem>
                            <SelectItem value="7d">7 дней</SelectItem>
                            <SelectItem value="30d">30 дней</SelectItem>
                            <SelectItem value="90d">3 месяца</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 mt-2">
                        <Label>Метрики</Label>
                        <div className="grid gap-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="show-spend" className="text-sm font-normal">Расход</Label>
                            <Switch
                              id="show-spend"
                              checked={visibleMetrics.spend}
                              onCheckedChange={(c) => setVisibleMetrics(prev => ({ ...prev, spend: c }))}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="show-revenue" className="text-sm font-normal">Выручка</Label>
                            <Switch
                              id="show-revenue"
                              checked={visibleMetrics.revenue}
                              onCheckedChange={(c) => setVisibleMetrics(prev => ({ ...prev, revenue: c }))}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="show-romi" className="text-sm font-normal">ROMI</Label>
                            <Switch
                              id="show-romi"
                              checked={visibleMetrics.romi}
                              onCheckedChange={(c) => setVisibleMetrics(prev => ({ ...prev, romi: c }))}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="show-cpl" className="text-sm font-normal">CPL</Label>
                            <Switch
                              id="show-cpl"
                              checked={visibleMetrics.cpl}
                              onCheckedChange={(c) => setVisibleMetrics(prev => ({ ...prev, cpl: c }))}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="show-spl" className="text-sm font-normal">SPL (средний чек на лида)</Label>
                            <Switch
                              id="show-spl"
                              checked={visibleMetrics.spl}
                              onCheckedChange={(c) => setVisibleMetrics(prev => ({ ...prev, spl: c }))}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {!hideDashboard && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden sm:block">
                <TabsList className="grid w-[200px] grid-cols-2">
                  <TabsTrigger value="dashboard">Дашборд</TabsTrigger>
                  <TabsTrigger value="chat">Чат</TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="ml-2"
            >
              {isExpanded ? <ArrowDownRight className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-[500px]">

          {/* LEFT COLUMN: Visualizations & Metrics */}
          {!hideDashboard && (
            <div className={cn(
              "lg:col-span-2 space-y-6 flex flex-col",
              activeTab === 'chat' && "hidden lg:flex" // Hide on mobile if chat tab active
            )}>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {visibleMetrics.spend && (
                  <MetricCard
                    title="Расход"
                    value={formatCurrency(data.spend)}
                    trend="+12%"
                    trendUp={false}
                    icon={Target}
                    color="text-red-500"
                  />
                )}
                {visibleMetrics.revenue && (
                  <MetricCard
                    title="Выручка"
                    value={formatCurrency(data.revenue)}
                    trend="+24%"
                    trendUp={true}
                    icon={TrendingUp}
                    color="text-green-500"
                  />
                )}
                {visibleMetrics.romi && (
                  <MetricCard
                    title="ROMI"
                    value={`${data.romi}%`}
                    trend="+5%"
                    trendUp={true}
                    icon={BarChart3}
                    color="text-blue-500"
                  />
                )}
                {visibleMetrics.cpl && (
                  <MetricCard
                    title="CPL"
                    value={formatCurrency(data.cpl)}
                    trend="-8%"
                    trendUp={true}
                    icon={User}
                    color="text-indigo-500"
                  />
                )}
                {visibleMetrics.spl && (
                  <MetricCard
                    title="SPL"
                    value={formatCurrency(data.spl)}
                    trend="ср. чек на лида"
                    trendUp={true}
                    icon={DollarSign}
                    color="text-amber-500"
                  />
                )}
              </div>

              {/* Main Chart */}
              <Card className="flex-1 border-border/50 bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    Воронка конверсии
                  </CardTitle>
                  <CardDescription>
                    Визуализация прохождения пользователей по этапам
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                        width={60}
                        axisLine={false}
                        tickLine={false}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))'
                        }}
                        cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                        {funnelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Insights Block */}
              <Card className="border-border bg-muted/30">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-full mt-1">
                    <Lightbulb className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">AI-Инсайт дня</h4>
                    <p className="text-sm text-muted-foreground">
                      Ваша конверсия из клика в лид выросла на 15% за последние 3 дня.
                      Рекомендуем увеличить бюджет на кампании с CTR выше 2%.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* RIGHT COLUMN: Chat Interface */}
          <div className={cn(
            "h-full min-h-[500px]",
            hideDashboard ? "lg:col-span-3" : "lg:col-span-1",
            activeTab === 'dashboard' && !hideDashboard && "hidden lg:block"
          )}>
            <ChatInterface context={safeContext} suggestedQuestions={suggestedQuestions} />
          </div>

        </div>
      </div>
    </div>
  );
};

// --- Subcomponents ---

const MetricCard = ({ title, value, trend, trendUp, icon: Icon, color }: any) => (
  <Card className="border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex justify-between items-start mb-2">
        <div className={cn("p-1.5 rounded-lg bg-background border", color)}>
          <Icon className="w-4 h-4" />
        </div>
        <Badge variant={trendUp ? "default" : "destructive"} className="text-[10px] px-1.5 h-5">
          {trend}
        </Badge>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-xl font-bold tracking-tight">{value}</p>
      </div>
    </CardContent>
  </Card>
);

const ChatInterface = ({ context, suggestedQuestions }: any) => {
  const [input, setInput] = useState('');
  const { messages, isLoading, sendMessage, clearChat } = useAIChat();
  const isOnline = useMarkStatus();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const message = input.trim();
    setInput('');
    await sendMessage(message, context);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="ai-chat-card h-full flex flex-col border-border shadow-sm">
      <CardHeader className="px-4 py-3 border-b flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-sm font-medium">AI Ассистент</CardTitle>
            <div className="flex items-center gap-1.5">
              <span className={cn("relative flex h-2 w-2")}>
                {isOnline === true && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-green-400" />}
                <span className={cn(
                  "relative inline-flex rounded-full h-2 w-2",
                  isOnline === true && "bg-green-500",
                  isOnline === false && "bg-red-500",
                  isOnline === null && "bg-muted-foreground"
                )} />
              </span>
              <CardDescription className="text-xs">
                {isOnline === true ? 'Online' : isOnline === false ? 'Offline' : 'Проверка…'}
              </CardDescription>
            </div>
          </div>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={clearChat} className="h-8 w-8 text-muted-foreground">
                <Trash2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Очистить чат</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden relative">
        <ScrollArea ref={scrollRef} className="h-full p-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Чем могу помочь?</h3>
                <p className="text-sm text-muted-foreground max-w-[200px] mx-auto">
                  Я проанализировал ваши данные. Спросите меня о метриках или советах по оптимизации.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 w-full">
                {suggestedQuestions.map((q: any, i: number) => (
                  <Button
                    key={i}
                    variant="outline"
                    className="justify-start h-auto py-3 px-4 text-left text-xs whitespace-normal"
                    onClick={() => sendMessage(q.text, context)}
                  >
                    <q.icon className="w-3 h-3 mr-2 shrink-0 text-primary" />
                    {q.text}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              <AnimatePresence mode="popLayout">
                {messages.map((msg, index) => (
                  <MessageBubble key={index} message={msg} />
                ))}
              </AnimatePresence>
              {isLoading && (
                <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl border border-primary/10 animate-pulse">
                  <div className="relative">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                      <Cpu className="w-4 h-4 text-primary animate-spin-slow" />
                    </div>
                    <div className="absolute inset-0 bg-primary/30 rounded-full blur-md animate-pulse" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-primary">Марк анализирует данные...</span>
                    <span className="text-xs text-muted-foreground">Подключаюсь к Claude Code Bridge</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-3 border-t bg-muted/20">
        <div className="relative w-full flex items-center gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите ваш вопрос..."
            className="pr-10 bg-background"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="absolute right-1 top-1 h-8 w-8 rounded-md"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

const LogViewer = ({ logs }: { logs: string[] }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!logs || logs.length === 0) return null;

  return (
    <div className="w-full mb-2">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 rounded-lg border border-border/50 cursor-pointer hover:bg-muted/50 transition-colors w-fit"
      >
        <Terminal className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          System Logs ({logs.length})
        </span>
        {isOpen ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-2"
          >
            <div className="bg-[#1e1e1e] text-green-400 p-3 text-[10px] font-mono leading-relaxed rounded-lg shadow-inner max-h-[200px] overflow-y-auto border border-white/10">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2 border-b border-white/5 last:border-0 py-1">
                  <span className="opacity-40 select-none text-gray-500">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="break-all">{log}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatsCard = ({ data }: { data: any }) => {
  const metrics = [
    { label: 'Расход', value: data.spend, format: 'currency' },
    { label: 'Лиды', value: data.leads, format: 'number' },
    { label: 'CTR', value: data.ctr, format: 'percent' },
    { label: 'Цена лида', value: data.cpl, format: 'currency' },
    { label: 'ROMI', value: data.romi, format: 'percent' },
    { label: 'Выручка', value: data.revenue, format: 'currency' }
  ].filter(m => m.value !== undefined && m.value !== null);

  if (metrics.length === 0) return null;

  const formatValue = (val: number, type: string) => {
    if (type === 'currency') return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(val);
    if (type === 'percent') return `${val}%`;
    return val;
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
      {metrics.map((m, i) => (
        <div key={i} className="relative overflow-hidden group bg-card border border-border rounded-xl p-3 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all duration-300">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 relative z-10">{m.label}</span>
          <span className="text-lg font-bold text-foreground relative z-10">{formatValue(m.value, m.format)}</span>
        </div>
      ))}
    </div>
  );
};

const useStreamTypewriter = (text: string, isStreaming: boolean, speed = 10) => {
  const [displayedText, setDisplayedText] = useState(isStreaming ? '' : text);

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedText(text);
      return;
    }

    if (displayedText === text) return;

    if (text.length < displayedText.length) {
      setDisplayedText(text);
      return;
    }

    const timeout = setTimeout(() => {
      setDisplayedText(text.slice(0, displayedText.length + 1));
    }, speed);

    return () => clearTimeout(timeout);
  }, [text, displayedText, isStreaming, speed]);

  return displayedText;
};

const MessageBubble = forwardRef<HTMLDivElement, { message: ChatMessage }>(({ message }, ref) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  // Try parsing JSON content
  let jsonContent = null;
  let textContent = message.content;

  try {
    if (!isUser && message.content) {
      // Check if pure JSON
      if (message.content.trim().startsWith('{')) {
        jsonContent = JSON.parse(message.content);
        textContent = ""; // Hide raw JSON if successfully parsed
      }
      // Check for JSON block
      else if (message.content.includes('```json')) {
        const match = message.content.match(/```json\n([\s\S]*?)\n```/);
        if (match) {
          jsonContent = JSON.parse(match[1]);
          // Remove the JSON block from text content to avoid duplicate display
          textContent = message.content.replace(match[0], '');
        }
      }
    }
  } catch (e) {
    // ignore parse errors
  }

  // Apply typewriter effect to text content
  const displayedText = useStreamTypewriter(textContent || '', !!message.isStreaming);

  const handleCopy = () => {
    const textToCopy = [
      jsonContent ? `Метрики:\n${JSON.stringify(jsonContent, null, 2)}` : '',
      textContent
    ].filter(Boolean).join('\n\n');

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn("flex flex-col gap-2", isUser ? "items-end" : "items-start")}
    >
      {!isUser && message.logs && message.logs.length > 0 && (
        <div className="pl-11 w-full max-w-[90%]">
          <LogViewer logs={message.logs} />
        </div>
      )}

      <div className={cn("flex gap-3 max-w-[90%]", isUser ? "flex-row-reverse" : "flex-row")}>
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border shadow-sm h-fit",
          isUser ? "bg-background" : "bg-primary/10 border-primary/20"
        )}>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-primary" />}
        </div>

        <div className="flex flex-col gap-2 w-full">
          {(isUser || textContent || jsonContent) && (
            <div className={cn(
              "rounded-2xl px-4 py-3 text-sm shadow-sm",
              isUser
                ? "bg-primary text-primary-foreground rounded-tr-sm"
                : "bg-card border rounded-tl-sm"
            )}>
              {isUser ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {jsonContent && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                        <Activity className="w-4 h-4" />
                        <span className="text-xs font-medium">Результаты анализа:</span>
                      </div>
                      <StatsCard data={jsonContent} />
                    </div>
                  )}

                  {textContent && (
                    <ReactMarkdown
                      components={{
                        h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-foreground mt-4 mb-2" {...props} />,
                        h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-foreground mt-3 mb-2" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-none space-y-1 my-2 pl-0" {...props} />,
                        li: ({ node, ...props }) => (
                          <li className="flex items-start gap-2 relative pl-4" {...props}>
                            <span className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
                            <span className="text-muted-foreground">{props.children}</span>
                          </li>
                        ),
                        p: ({ node, ...props }) => <p className="leading-relaxed mb-2 text-muted-foreground" {...props} />,
                        strong: ({ node, ...props }) => <strong className="font-semibold text-foreground" {...props} />,
                      }}
                    >
                      {displayedText}
                    </ReactMarkdown>
                  )}

                  <div className="mt-4 pt-2 border-t border-border/50 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopy}
                      className="text-[10px] text-muted-foreground hover:text-foreground gap-1.5 h-6 px-2"
                    >
                      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Скопировано' : 'Скопировать отчет'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

MessageBubble.displayName = 'MessageBubble';
