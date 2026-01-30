import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Loader2, TrendingUp, Users, MessageCircle, Share2, Eye, Download } from 'lucide-react';
import { supabase } from '@/lib/externalSupabase';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

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
          className="gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
        >
          <FileText className="w-4 h-4 text-violet-400" />
          Отчет за Январь
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-[#0A0A0A] border-white/10 text-white p-0 gap-0">
        <DialogHeader className="p-6 border-b border-white/10 sticky top-0 bg-[#0A0A0A] z-10 backdrop-blur-md bg-opacity-90">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <FileText className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <DialogTitle className="text-xl">Отчет по контенту</DialogTitle>
                <p className="text-sm text-white/40">Январь 2026</p>
              </div>
            </div>
            {reportData && (
              <Button variant="outline" size="sm" className="gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10">
                <Download className="w-4 h-4" />
                Скачать PDF
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="p-6 space-y-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
              <p className="text-white/40">Генерация отчета...</p>
            </div>
          ) : reportData ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-white/60">Публикации</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{reportData.totalPosts}</div>
                  </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-white/60">Общий охват</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{(reportData.totalReach / 1000).toFixed(1)}K</div>
                  </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-white/60">Вовлеченность</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{reportData.totalEngagement}</div>
                  </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-white/60">Средний ER</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-400">{reportData.avgEngagementRate.toFixed(2)}%</div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Posts */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-violet-400" />
                  Топ публикаций по охвату
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {reportData.topPosts.map((post) => (
                    <Card key={post.id} className="bg-white/5 border-white/10 overflow-hidden group hover:border-violet-500/30 transition-all">
                      <div className="aspect-[4/5] relative bg-black/20">
                        {post.media_url ? (
                          <img 
                            src={post.media_url} 
                            alt="Post cover" 
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/20">
                            Нет изображения
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-xs font-mono text-white">
                          {format(new Date(post.published_at || ''), 'd MMM', { locale: ru })}
                        </div>
                      </div>
                      <CardContent className="p-4 space-y-4">
                        <p className="text-sm text-white/80 line-clamp-2 min-h-[40px]">
                          {post.caption || 'Без описания'}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1.5 text-white/60">
                            <Eye className="w-3.5 h-3.5" />
                            <span>{(post.reach || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-white/60">
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>{post.comments_count || 0}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-white/40">
              Нет данных за этот период
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
