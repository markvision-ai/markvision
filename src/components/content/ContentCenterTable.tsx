import { useState } from 'react';
import { Play, Eye, MessageCircle, TrendingUp, Wallet, Rocket, Infinity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useInstagramPostsStats } from '@/hooks/useInstagramPostsStats';
import { LaunchOrbitalModal } from './LaunchOrbitalModal';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ContentCenterTableProps {
  projectId: string | null;
}

export const ContentCenterTable = ({ projectId }: ContentCenterTableProps) => {
  const { posts, loading, error } = useInstagramPostsStats(projectId);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePromote = (post: any) => {
    setSelectedPost({
      post_id: post.post_id,
      caption: post.caption,
      media_url: post.media_url,
      permalink: post.permalink,
    });
    setIsModalOpen(true);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString('ru-RU');
  };

  const truncateText = (text: string | null, maxLength: number = 30) => {
    if (!text) return 'Без описания';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Выберите проект</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex gap-4">
              <Skeleton className="w-24 h-24 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center">
          <Play className="w-8 h-8 text-violet-600" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-lg">Нет данных</p>
          <p className="text-sm text-muted-foreground">
            Импортируйте workflow в n8n и активируйте его
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {posts.map((post, index) => {
          const romi = post.revenue > 0 ? '∞' : '0'; // Бесконечный ROMI т.к. производство бесплатное
          const hasResults = post.leads_count > 0 || post.paid_leads > 0 || post.revenue > 0;

          return (
            <Card
              key={post.id}
              className={cn(
                "group hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300 border-violet-200/30 dark:border-violet-800/30",
                "bg-gradient-to-br from-card/50 via-card to-card/50 backdrop-blur-sm",
                hasResults && "border-violet-400/50 dark:border-violet-600/50 shadow-lg shadow-violet-500/5"
              )}
            >
              <div className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Thumbnail + Content */}
                  <div className="flex gap-3 flex-1">
                    {/* Thumbnail */}
                    <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 border-violet-200/50 dark:border-violet-800/50 shadow-lg">
                      {post.media_url ? (
                        <>
                          {post.media_type?.toLowerCase().includes('video') ? (
                            <video
                              src={post.media_url}
                              className="w-full h-full object-cover"
                              muted
                              loop
                            />
                          ) : (
                            <img
                              src={post.media_url}
                              alt="Post thumbnail"
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-1">
                            {post.media_type?.toLowerCase().includes('video') && (
                              <Play className="w-4 h-4 text-white drop-shadow-lg" />
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20 flex items-center justify-center">
                          <Play className="w-8 h-8 text-violet-400" />
                        </div>
                      )}
                    </div>

                    {/* Caption + Time */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        {truncateText(post.caption, 80)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {post.timestamp
                          ? formatDistanceToNow(new Date(post.timestamp), { addSuffix: true, locale: ru })
                          : 'Дата неизвестна'}
                      </p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 md:gap-3">
                    {/* Охват */}
                    <div className="bg-gradient-to-br from-blue-50/50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/20 rounded-lg p-2 border border-blue-200/50 dark:border-blue-800/50">
                      <div className="flex items-center gap-1 mb-1">
                        <Eye className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        <span className="text-[10px] text-muted-foreground font-medium">Охват</span>
                      </div>
                      <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {formatNumber(post.impressions)}
                      </p>
                    </div>

                    {/* Вовлеченность */}
                    <div className="bg-gradient-to-br from-green-50/50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/20 rounded-lg p-2 border border-green-200/50 dark:border-green-800/50">
                      <div className="flex items-center gap-1 mb-1">
                        <MessageCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                        <span className="text-[10px] text-muted-foreground font-medium">Комменты</span>
                      </div>
                      <p className="text-sm font-bold text-green-600 dark:text-green-400">
                        {formatNumber(post.comments)}
                      </p>
                    </div>

                    {/* Результат */}
                    <div className="bg-gradient-to-br from-purple-50/50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/20 rounded-lg p-2 border border-purple-200/50 dark:border-purple-800/50">
                      <div className="flex items-center gap-1 mb-1">
                        <TrendingUp className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                        <span className="text-[10px] text-muted-foreground font-medium">Результат</span>
                      </div>
                      <div className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 space-y-0.5">
                        <div>Лиды: {post.leads_count}</div>
                        <div className="opacity-60">Оплачено: {post.paid_leads}</div>
                      </div>
                    </div>

                    {/* Деньги */}
                    <div className="bg-gradient-to-br from-amber-50/50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/20 rounded-lg p-2 border border-amber-200/50 dark:border-amber-800/50">
                      <div className="flex items-center gap-1 mb-1">
                        <Wallet className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span className="text-[10px] text-muted-foreground font-medium">Выручка</span>
                      </div>
                      <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                        {post.revenue > 0 ? `${formatNumber(post.revenue)} ₸` : '0 ₸'}
                      </p>
                    </div>

                    {/* ROMI + Action */}
                    <div className="bg-gradient-to-br from-violet-50/50 to-violet-100/50 dark:from-violet-950/20 dark:to-violet-900/20 rounded-lg p-2 border border-violet-200/50 dark:border-violet-800/50">
                      <div className="flex items-center gap-1 mb-1">
                        <Infinity className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                        <span className="text-[10px] text-muted-foreground font-medium">ROMI</span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0 text-[10px] mb-1 px-1.5 py-0 h-5"
                      >
                        ∞% Profit
                      </Badge>
                      <Button
                        size="sm"
                        className="w-full h-6 text-[10px] gap-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                        onClick={() => handlePromote(post)}
                      >
                        <Rocket className="w-3 h-3" />
                        Продвигать
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Launch Modal */}
      {selectedPost && (
        <LaunchOrbitalModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          postData={selectedPost}
        />
      )}
    </>
  );
};
