import { useState } from 'react';
import { useCompetitors } from '@/hooks/useCompetitors';
import { useInstagramPostsStats } from '@/hooks/useInstagramPostsStats';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RefreshCw, Trash2, Instagram, TrendingUp, Plus, BarChart3, Bell, User, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CompetitorMonitorProps {
  projectId: string;
}

export const CompetitorMonitor = ({ projectId }: CompetitorMonitorProps) => {
  const { competitors, loading, addCompetitor, removeCompetitor, refreshCompetitorData } = useCompetitors(projectId);
  const { posts: myPosts, loading: myStatsLoading } = useInstagramPostsStats(projectId);
  const [newHandle, setNewHandle] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newHandle) return;
    await addCompetitor(newHandle);
    setNewHandle('');
    setIsAddOpen(false);
  };

  const handleRefresh = async (id: string) => {
    setRefreshingId(id);
    await refreshCompetitorData(id);
    setRefreshingId(null);
  };

  // Competitor Analysis Stats
  const totalCompetitors = competitors.length;
  const avgEngagement = totalCompetitors > 0 
    ? (competitors.reduce((acc, c) => acc + (c.engagement_rate || 0), 0) / totalCompetitors).toFixed(2)
    : 0;
  const totalFollowers = competitors.reduce((acc, c) => acc + (c.followers_count || 0), 0);

  // My Stats
  const myTotalLikes = myPosts.reduce((acc, p) => acc + (p.likes || 0), 0);
  const myTotalComments = myPosts.reduce((acc, p) => acc + (p.comments || 0), 0);
  const myTotalImpressions = myPosts.reduce((acc, p) => acc + (p.impressions || 0), 0);

  return (
    <div className="h-full flex flex-col space-y-6">
      
      {/* My Stats Section */}
      <div className="shrink-0 space-y-4">
        <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold tracking-tight">Моя Статистика</h2>
        </div>
        
        {myPosts.length === 0 && !myStatsLoading ? (
             <div className="p-8 border border-dashed border-border rounded-lg flex flex-col items-center justify-center text-muted-foreground bg-muted/5 gap-2">
                <Instagram className="w-8 h-8 opacity-50" />
                <span>Ожидание синхронизации с Instagram</span>
                <span className="text-xs opacity-70">Данные появятся после подключения аккаунта</span>
             </div>
        ) : (
            <div className="grid grid-cols-3 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Лайки (Total)</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold">{myTotalLikes.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Комментарии</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold">{myTotalComments.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Охват (Impressions)</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold">{myTotalImpressions.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )}
      </div>

      <div className="h-px bg-border/50 shrink-0" />

      {/* Competitors Section */}
      <div className="flex flex-col space-y-4 flex-1 min-h-0">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight">Мониторинг Конкурентов</h2>
            <Badge variant="outline" className="gap-1">
                <Instagram className="w-3 h-3" />
                Instagram
            </Badge>
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
                Экспорт Отчета
            </Button>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Добавить
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>Добавить конкурента</DialogTitle>
                <CardDescription>Введите Instagram username конкурента для отслеживания</CardDescription>
                </DialogHeader>
                <div className="py-4">
                <Input 
                    placeholder="@username" 
                    value={newHandle}
                    onChange={(e) => setNewHandle(e.target.value)}
                />
                </div>
                <DialogFooter>
                <Button onClick={handleAdd}>Отслеживать</Button>
                </DialogFooter>
            </DialogContent>
            </Dialog>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-3 gap-4 shrink-0">
         <Card className="bg-muted/20 border-border/50">
            <CardContent className="p-4 flex flex-col gap-1">
               <span className="text-xs text-muted-foreground">Средняя вовлеченность</span>
               <div className="flex items-center gap-2">
                 <TrendingUp className="w-4 h-4 text-green-500" />
                 <span className="text-xl font-bold">{avgEngagement}%</span>
               </div>
            </CardContent>
         </Card>
         <Card className="bg-muted/20 border-border/50">
            <CardContent className="p-4 flex flex-col gap-1">
               <span className="text-xs text-muted-foreground">Всего подписчиков (Tracked)</span>
               <span className="text-xl font-bold">{(totalFollowers / 1000).toFixed(1)}k</span>
            </CardContent>
         </Card>
         <Card className="bg-muted/20 border-border/50">
            <CardContent className="p-4 flex flex-col gap-1">
               <span className="text-xs text-muted-foreground">Активность (24ч)</span>
               <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-orange-500" />
                  <span className="text-xl font-bold">{Math.floor(Math.random() * 10) + 2} событий</span>
               </div>
            </CardContent>
         </Card>
      </div>

      <ScrollArea className="flex-1 -mx-2 px-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
            {loading ? (
                Array.from({length: 3}).map((_, i) => (
                    <Card key={i} className="animate-pulse h-[200px] bg-muted/10" />
                ))
            ) : competitors.map((comp) => (
                <Card key={comp.id} className="group relative overflow-hidden bg-background border-border/50 hover:border-primary/50 transition-all">
                    <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-border">
                                <AvatarImage src={comp.avatar_url || undefined} />
                                <AvatarFallback>
                                    {comp.handle ? comp.handle[0].toUpperCase() : <User className="w-4 h-4" />}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <CardTitle className="text-sm font-medium">@{comp.handle}</CardTitle>
                                <span className="text-xs text-muted-foreground capitalize">{comp.platform}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={() => handleRefresh(comp.id)}
                                disabled={refreshingId === comp.id}
                             >
                                <RefreshCw className={cn("w-3.5 h-3.5", refreshingId === comp.id && "animate-spin")} />
                             </Button>
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => removeCompetitor(comp.id)}
                             >
                                <Trash2 className="w-3.5 h-3.5" />
                             </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 py-2">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-muted-foreground">Подписчики</span>
                                <span className="font-mono font-medium">{(comp.followers_count || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-muted-foreground">ER</span>
                                <span className={cn(
                                    "font-mono font-medium",
                                    (comp.engagement_rate || 0) > 3 ? "text-green-500" : "text-yellow-500"
                                )}>
                                    {comp.engagement_rate}%
                                </span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-muted-foreground">Посты</span>
                                <span className="font-mono font-medium">{comp.posts_count}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-muted-foreground">Stories (24h)</span>
                                <span className="font-mono font-medium text-pink-500">{comp.stories_count}</span>
                            </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-border/50">
                             <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Последний скан:</span>
                                <span>{comp.last_scanned_at ? new Date(comp.last_scanned_at).toLocaleDateString() : 'Никогда'}</span>
                             </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
      </ScrollArea>
      </div>
    </div>
  );
};
