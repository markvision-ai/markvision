import { useState, useMemo } from 'react';
import { useCompetitors } from '@/hooks/useCompetitors';
import { useInstagramPostsStats } from '@/hooks/useInstagramPostsStats';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
    RefreshCw, Trash2, Instagram, TrendingUp, Plus, BarChart3, 
    Bell, User, LayoutDashboard, ArrowUpRight, ArrowDownRight, 
    Sparkles, ExternalLink, MessageCircle, Eye, Lightbulb, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
    LineChart, Line, AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CompetitorMonitorProps {
  projectId: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const CompetitorMonitor = ({ projectId }: CompetitorMonitorProps) => {
  const { competitors, loading, addCompetitor, removeCompetitor, refreshCompetitorData } = useCompetitors(projectId);
  const { posts: myPosts, loading: myStatsLoading } = useInstagramPostsStats(projectId);
  const [newHandle, setNewHandle] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'dashboard' | 'list'>('dashboard');

  const handleAdd = async () => {
    if (!newHandle) return;
    await addCompetitor(newHandle);
    setNewHandle('');
    setIsAddOpen(false);
    toast.success('Конкурент добавлен');
  };

  const handleRefresh = async (id: string) => {
    setRefreshingId(id);
    await refreshCompetitorData(id);
    setRefreshingId(null);
  };

  const handleSendToGenerator = async (handle: string, platform: string) => {
      try {
          // Get current user for author_id
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
              toast.error('Ошибка авторизации');
              return;
          }

          const { error } = await supabase.from('content_factory').insert({
              project_id: projectId,
              title: `Анализ конкурента: @${handle}`,
              platform_type: 'dental_video', // Default type
              status: 'ideation',
              author_id: user.id,
              body_text: JSON.stringify({
                  main_idea: `Проанализировать контент конкурента @${handle} (${platform}) и создать улучшенную версию.`,
                  source_url: `https://instagram.com/${handle}`,
                  tone: 'Expert'
              }),
              body: {
                avatar_status: 'idle',
                sora_status: 'idle',
                carousel_status: 'idle',
                threads_status: 'idle',
                telegram_status: 'idle',
                article_status: 'idle'
              }
          });

          if (error) throw error;
          toast.success(`@${handle} отправлен в Цех Идей!`);
      } catch (e) {
          console.error('Error sending to generator:', e);
          toast.error('Ошибка при отправке в генератор');
      }
  };

  // --- Derived Metrics & Data Preparation ---

  // 1. Market Overview
  const totalCompetitors = competitors.length;
  const avgEngagement = totalCompetitors > 0 
    ? (competitors.reduce((acc, c) => acc + (c.engagement_rate || 0), 0) / totalCompetitors).toFixed(2)
    : "0.00";
  
  const totalMarketFollowers = competitors.reduce((acc, c) => acc + (c.followers_count || 0), 0);
  const maxFollowers = Math.max(...competitors.map(c => c.followers_count || 0), 0);

  // 2. My Stats Aggregation
  const myTotalLikes = myPosts.reduce((acc, p) => acc + (p.likes || 0), 0);
  const myTotalComments = myPosts.reduce((acc, p) => acc + (p.comments || 0), 0);
  const myTotalImpressions = myPosts.reduce((acc, p) => acc + (p.impressions || 0), 0);
  const myAvgEngagement = myPosts.length > 0
    ? ((myTotalLikes + myTotalComments) / myTotalImpressions * 100).toFixed(2) // Rough estimate if impressions > 0
    : "0.00"; // Placeholder logic, ideally use proper ER formula if available per post

  // 3. Chart Data: Followers Comparison
  const followersChartData = useMemo(() => {
    const data = competitors
        .map(c => ({
            name: c.handle,
            followers: c.followers_count || 0,
            engagement: c.engagement_rate || 0
        }))
        .sort((a, b) => b.followers - a.followers)
        .slice(0, 10); // Top 10
    
    // Add "Me" if we had real follower count for current user (mocked for now as we only have post stats)
    // data.push({ name: 'Вы', followers: 1200, engagement: parseFloat(myAvgEngagement) });
    
    return data;
  }, [competitors, myAvgEngagement]);

  // 4. Chart Data: Engagement Comparison
  const engagementChartData = useMemo(() => {
      return competitors
        .map(c => ({
            name: c.handle,
            er: c.engagement_rate || 0
        }))
        .sort((a, b) => b.er - a.er)
        .slice(0, 10);
  }, [competitors]);

  // 5. AI Insights (Mocked based on dental context)
  const aiInsights = useMemo(() => [
      { 
          title: 'Тренд: "Все на 4"', 
          desc: '3 конкурента опубликовали посты об All-on-4 за последнюю неделю. Высокий ER (4.8%).',
          type: 'trend',
          score: 92
      },
      { 
          title: 'Формат: Reels до/после', 
          desc: 'Видео с результатами лечения набирают в 2.5 раза больше охватов у лидеров ниши.',
          type: 'format',
          score: 88
      },
      { 
          title: 'Упущенная тема: Гарантии', 
          desc: 'Никто из топ-5 конкурентов не раскрыл тему пожизненной гарантии на импланты. Возможность для отстройки.',
          type: 'opportunity',
          score: 95
      }
  ], [competitors]);

  return (
    <div className="h-full flex flex-col space-y-6 p-1">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <LayoutDashboard className="w-6 h-6 text-primary" />
                Конкурентная Разведка
            </h2>
            <p className="text-muted-foreground text-sm">
                Анализ {competitors.length} конкурентов и поиск точек роста
            </p>
        </div>
        <div className="flex items-center gap-2">
             <Button variant="outline" size="sm" className="gap-2" onClick={() => {
                const csvContent = "data:text/csv;charset=utf-8," 
                    + "Handle,Followers,Engagement,Posts\n"
                    + competitors.map(c => `${c.handle},${c.followers_count},${c.engagement_rate},${c.posts_count}`).join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", "competitors_report.csv");
                document.body.appendChild(link);
                link.click();
            }}>
                <BarChart3 className="w-4 h-4" />
                Экспорт CSV
            </Button>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                    <Button size="sm" className="gap-2 shadow-lg shadow-primary/20">
                        <Plus className="w-4 h-4" />
                        Добавить Конкурента
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Добавить конкурента</DialogTitle>
                        <CardDescription>Введите Instagram username (например, @dr.smile)</CardDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input 
                            placeholder="@username" 
                            value={newHandle}
                            onChange={(e) => setNewHandle(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button onClick={handleAdd}>Начать слежку</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      </div>

      <ScrollArea className="flex-1 -mx-4 px-4">
        <div className="space-y-6 pb-10">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* My Stats Card */}
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <User className="w-16 h-16" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Моя Вовлеченность</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold">{myPosts.length > 0 ? 'Wait...' : '—'}</span> 
                            {/* Placeholder for real calc */}
                            <span className="text-xs text-muted-foreground">ER</span>
                        </div>
                         <div className="mt-2 flex items-center text-xs">
                             {myPosts.length === 0 ? (
                                 <span className="text-muted-foreground">Нет данных</span>
                             ) : (
                                 <span className="text-emerald-500 flex items-center gap-1">
                                     <ArrowUpRight className="w-3 h-3" />
                                     Подключить Instagram
                                 </span>
                             )}
                         </div>
                    </CardContent>
                </Card>

                {/* Market Avg ER */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Средний ER Рынка</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold">{avgEngagement}%</span>
                        </div>
                        <div className="mt-2 flex items-center text-xs text-muted-foreground">
                            По {competitors.length} аккаунтам
                        </div>
                    </CardContent>
                </Card>

                 {/* Total Audience */}
                 <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Аудитория Конкурентов</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold">{(totalMarketFollowers / 1000).toFixed(1)}k</span>
                        </div>
                        <div className="mt-2 flex items-center text-xs text-muted-foreground">
                            Суммарный охват
                        </div>
                    </CardContent>
                </Card>

                 {/* Active Posts */}
                 <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Активность (Неделя)</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold">~{Math.round(competitors.reduce((acc, c) => acc + (c.posts_count || 0), 0) / 50)}</span>
                        </div>
                        <div className="mt-2 flex items-center text-xs text-emerald-500">
                             <ArrowUpRight className="w-3 h-3 mr-1" />
                             +12% к прошлой неделе
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Лидеры по подписчикам</CardTitle>
                        <CardDescription>Сравнение объема аудитории топ-10 конкурентов</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={followersChartData} layout="vertical" margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.2} />
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    width={100} 
                                    tick={{fontSize: 12}} 
                                    tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    cursor={{fill: 'transparent'}}
                                />
                                <Bar dataKey="followers" fill="#8884d8" radius={[0, 4, 4, 0]}>
                                    {followersChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#94a3b8'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 border-primary/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-500" />
                            AI Инсайты
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {aiInsights.map((insight, i) => (
                            <div key={i} className="p-3 bg-background/50 backdrop-blur-sm rounded-lg border border-border/50 text-sm">
                                <div className="flex items-center justify-between mb-1">
                                    <span className={cn(
                                        "font-semibold text-xs px-2 py-0.5 rounded-full border",
                                        insight.type === 'trend' && "bg-blue-500/10 text-blue-500 border-blue-500/20",
                                        insight.type === 'format' && "bg-purple-500/10 text-purple-500 border-purple-500/20",
                                        insight.type === 'opportunity' && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                                    )}>
                                        {insight.type.toUpperCase()}
                                    </span>
                                    <span className="text-xs font-mono text-muted-foreground">{insight.score}% conf.</span>
                                </div>
                                <h4 className="font-medium mb-1">{insight.title}</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">{insight.desc}</p>
                            </div>
                        ))}
                        <Button className="w-full text-xs" variant="outline">
                            Сгенерировать новые идеи
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Competitors List Grid */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Детальный список</h3>
                    <div className="flex gap-2">
                         <Input 
                            placeholder="Поиск..." 
                            className="h-8 w-[200px] text-xs"
                         />
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                     {loading ? (
                        Array.from({length: 4}).map((_, i) => (
                            <Card key={i} className="animate-pulse h-[200px] bg-muted/10" />
                        ))
                    ) : competitors.map((comp) => (
                        <Card key={comp.id} className="group relative overflow-hidden hover:shadow-md transition-all hover:border-primary/30">
                            <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 border border-border">
                                        <AvatarImage src={comp.avatar_url || undefined} />
                                        <AvatarFallback>
                                            {comp.handle ? comp.handle[0].toUpperCase() : <User className="w-4 h-4" />}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col min-w-0">
                                        <CardTitle className="text-sm font-medium truncate w-[120px]" title={comp.handle}>@{comp.handle}</CardTitle>
                                        <span className="text-xs text-muted-foreground capitalize">{comp.platform}</span>
                                    </div>
                                </div>
                                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                     <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRefresh(comp.id)}>
                                        <RefreshCw className={cn("w-3 h-3", refreshingId === comp.id && "animate-spin")} />
                                     </Button>
                                     <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeCompetitor(comp.id)}>
                                        <Trash2 className="w-3 h-3" />
                                     </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                                    <div>
                                        <p className="text-muted-foreground">Подписчики</p>
                                        <p className="font-medium text-base">{(comp.followers_count || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">ER</p>
                                        <p className={cn("font-medium text-base", (comp.engagement_rate || 0) > 3 ? "text-emerald-500" : "text-amber-500")}>
                                            {comp.engagement_rate}%
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Посты</p>
                                        <p className="font-medium">{comp.posts_count}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Stories 24h</p>
                                        <p className="font-medium">{comp.stories_count}</p>
                                    </div>
                                </div>
                                
                                <div className="mt-4 flex flex-col gap-2">
                                    <Button 
                                        variant="default" 
                                        className="w-full text-xs h-8 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0 shadow-md"
                                        onClick={() => handleSendToGenerator(comp.handle, comp.platform)}
                                    >
                                        <Zap className="w-3 h-3 mr-2" />
                                        В ГЕНЕРАТОР MarkVision
                                    </Button>
                                    
                                    <Button 
                                        variant="ghost" 
                                        className="w-full text-xs h-7 text-muted-foreground hover:text-primary"
                                        onClick={() => window.open(`https://instagram.com/${comp.handle}`, '_blank')}
                                    >
                                        <ExternalLink className="w-3 h-3 mr-2" />
                                        Открыть профиль
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

        </div>
      </ScrollArea>
    </div>
  );
};
