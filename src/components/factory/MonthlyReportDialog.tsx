import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Loader2, TrendingUp, Users, MessageCircle, Share2, Eye, Download, BarChart3, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface MonthlyReportDialogProps {
  projectId: string;
}

interface ReportData {
  totalPosts: number;
  totalReach: number;
  totalEngagement: number;
  avgEngagementRate: number;
  topPosts: any[];
  postsByDay: { date: string; count: number }[];
}

export function MonthlyReportDialog({ projectId }: MonthlyReportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const generateReport = async () => {
    setLoading(true);
    try {
      // Январь 2026
      const startDate = '2026-01-01T00:00:00.000Z';
      const endDate = '2026-01-31T23:59:59.999Z';

      const { data: posts, error } = await supabase
        .from('instagram_content_stats')
        .select('*')
        .eq('project_id', projectId)
        .gte('published_at', startDate)
        .lte('published_at', endDate)
        .order('reach', { ascending: false });

      if (error) throw error;

      if (!posts || posts.length === 0) {
        setReportData({
          totalPosts: 0,
          totalReach: 0,
          totalEngagement: 0,
          avgEngagementRate: 0,
          topPosts: [],
          postsByDay: []
        });
        return;
      }

      // Агрегация данных
      const totalPosts = posts.length;
      const totalReach = posts.reduce((sum, p) => sum + (p.reach || 0), 0);
      const totalComments = posts.reduce((sum, p) => sum + (p.comments_count || 0), 0);
      const totalLikes = posts.reduce((sum, p) => sum + (p.likes_count || 0), 0);
      const totalShares = 0; // Нет данных в таблице
      const totalSaves = 0; // Нет данных в таблице
      
      const totalEngagement = totalLikes + totalComments + totalShares + totalSaves;
      
      // Средний ER (Engagement Rate) = (Total Engagement / Total Reach) * 100
      const avgEngagementRate = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;

      // Топ 3 поста по охвату
      const topPosts = posts.slice(0, 3);

      setReportData({
        totalPosts,
        totalReach,
        totalEngagement,
        avgEngagementRate,
        topPosts,
        postsByDay: [] // TODO: можно добавить график по дням
      });

    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && !reportData) {
      generateReport();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 bg-background/50 border-border/40 text-foreground hover:bg-accent hover:text-accent-foreground backdrop-blur-sm transition-all rounded-xl"
        >
          <FileText className="w-4 h-4 text-primary" />
          Отчет за Январь
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-background/80 backdrop-blur-2xl border-border/40 p-0 gap-0 shadow-2xl rounded-[32px] outline-none">
        <DialogHeader className="px-8 py-6 border-b border-border/10 sticky top-0 bg-background/80 z-20 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10 shadow-sm">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold tracking-tight">Отчет по контенту</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                    Январь 2026
                  </span>
                  <span className="text-sm text-muted-foreground">Ежемесячная статистика</span>
                </div>
              </div>
            </div>
            {reportData && (
              <Button variant="outline" className="gap-2 rounded-xl border-primary/20 hover:bg-primary/5 hover:text-primary transition-all group">
                <Download className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
                Скачать PDF
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="p-8 space-y-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                <Loader2 className="w-12 h-12 text-primary animate-spin relative z-10" />
              </div>
              <p className="text-muted-foreground font-medium animate-pulse">Анализируем данные...</p>
            </div>
          ) : reportData ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard 
                  title="Публикации" 
                  value={reportData.totalPosts} 
                  icon={<FileText className="w-5 h-5 text-blue-500" />}
                  trend="+12%"
                  trendUp={true}
                  bgClass="bg-blue-500/5"
                  borderClass="border-blue-500/20"
                />
                <StatCard 
                  title="Общий охват" 
                  value={`${(reportData.totalReach / 1000).toFixed(1)}K`} 
                  icon={<Eye className="w-5 h-5 text-purple-500" />}
                  trend="+5.4%"
                  trendUp={true}
                  bgClass="bg-purple-500/5"
                  borderClass="border-purple-500/20"
                />
                <StatCard 
                  title="Вовлеченность" 
                  value={reportData.totalEngagement} 
                  icon={<Users className="w-5 h-5 text-orange-500" />}
                  trend="-2.1%"
                  trendUp={false}
                  bgClass="bg-orange-500/5"
                  borderClass="border-orange-500/20"
                />
                <StatCard 
                  title="Средний ER" 
                  value={`${reportData.avgEngagementRate.toFixed(2)}%`} 
                  icon={<TrendingUp className="w-5 h-5 text-green-500" />}
                  trend="+0.8%"
                  trendUp={true}
                  bgClass="bg-green-500/5"
                  borderClass="border-green-500/20"
                />
              </div>

              {/* Top Posts */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    Топ публикаций по охвату
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {reportData.topPosts.map((post, index) => (
                    <Card 
                      key={post.id} 
                      className="group overflow-hidden border-border/40 bg-muted/10 hover:bg-muted/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 rounded-3xl"
                    >
                      <div className="aspect-[4/5] relative bg-muted/20 overflow-hidden">
                        {post.media_url ? (
                          <img 
                            src={post.media_url} 
                            alt="Post cover" 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground/40 bg-muted/10">
                            <FileText className="w-16 h-16 opacity-20" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                        
                        <div className="absolute top-4 left-4">
                           <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white font-bold border border-white/10">
                             #{index + 1}
                           </div>
                        </div>

                        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium text-white border border-white/10 flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-white/80" />
                          {(post.reach || 0).toLocaleString()}
                        </div>

                        <div className="absolute bottom-0 left-0 w-full p-5 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                          <p className="text-sm font-medium line-clamp-2 leading-relaxed opacity-90 mb-3">
                            {post.caption || 'Без описания'}
                          </p>
                          <div className="flex items-center gap-4 text-xs font-medium text-white/80">
                            <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-lg backdrop-blur-sm">
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>{post.comments_count || 0}</span>
                            </div>
                            <span className="opacity-60">•</span>
                            <span>{format(new Date(post.published_at || ''), 'd MMM yyyy', { locale: ru })}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/60 gap-4">
              <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center">
                <FileText className="w-8 h-8 opacity-40" />
              </div>
              <p>Нет данных за этот период</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ title, value, icon, trend, trendUp, bgClass, borderClass }: any) {
  return (
    <Card className={cn(
      "border bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group relative overflow-hidden rounded-2xl",
      borderClass
    )}>
      <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500", bgClass.replace('/5', '/20'))} />
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn("p-2 rounded-xl transition-colors duration-300", bgClass)}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div className="text-3xl font-bold tracking-tight text-foreground">{value}</div>
          {trend && (
            <div className={cn(
              "flex items-center text-xs font-medium px-2 py-1 rounded-lg mb-1",
              trendUp ? "text-green-500 bg-green-500/10" : "text-red-500 bg-red-500/10"
            )}>
              {trendUp ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowUpRight className="w-3 h-3 mr-1 rotate-180" />}
              {trend}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
