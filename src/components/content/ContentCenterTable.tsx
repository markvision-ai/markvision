import { useState } from 'react';
import { Play, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useInstagramPostsStats } from '@/hooks/useInstagramPostsStats';
import { LaunchOrbitalModal } from './LaunchOrbitalModal';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

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
      <div className="flex flex-col items-center justify-center h-64 space-y-4 p-6">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
          <Play className="w-8 h-8 text-red-600" />
        </div>
        <div className="text-center space-y-2 max-w-md">
          <p className="font-semibold text-lg text-destructive">Ошибка загрузки</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          {error.includes('не найдена') && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800 text-left">
              <p className="text-xs font-semibold text-red-900 dark:text-red-100 mb-2">
                🔧 Решение:
              </p>
              <p className="text-xs text-muted-foreground">
                Выполни SQL скрипт <code className="bg-red-100 dark:bg-red-900/30 px-1 rounded">CREATE-INSTAGRAM-TABLE.sql</code> в Supabase SQL Editor
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4 p-6">
        <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center">
          <Play className="w-8 h-8 text-violet-600" />
        </div>
        <div className="text-center space-y-2 max-w-md">
          <p className="font-semibold text-lg">Нет данных</p>
          <p className="text-sm text-muted-foreground">
            Таблица создана, но данные еще не загружены.
          </p>
          <div className="mt-4 p-4 bg-violet-50 dark:bg-violet-950/20 rounded-lg border border-violet-200 dark:border-violet-800 text-left">
            <p className="text-xs font-semibold text-violet-900 dark:text-violet-100 mb-2">
              📋 Что делать:
            </p>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Открой n8n и найди workflow "Instagram Content Intelligence"</li>
              <li>Нажми "Execute Workflow" (запуск вручную)</li>
              <li>Дождись завершения выполнения</li>
              <li>Обнови эту страницу (F5)</li>
            </ol>
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-violet-200 dark:border-violet-800">
              💡 Workflow также запускается автоматически каждый день в 01:05
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
              <tr>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground w-80">Контент</th>
              <th className="text-right p-3 text-sm font-medium text-muted-foreground">Охват</th>
              <th className="text-right p-3 text-sm font-medium text-muted-foreground">Комментарии</th>
              <th className="text-right p-3 text-sm font-medium text-muted-foreground">Результат</th>
              <th className="text-right p-3 text-sm font-medium text-muted-foreground">Выручка</th>
              <th className="text-center p-3 text-sm font-medium text-muted-foreground">Действие</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post, index) => (
              <tr
                key={post.id}
                className="border-t hover:bg-muted/30 transition-colors"
              >
                {/* Контент - превью + текст */}
                <td className="p-3">
                  <div className="flex gap-3 items-start">
                    {/* Компактное превью */}
                    <div 
                      className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border border-border cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => post.permalink && window.open(post.permalink, '_blank')}
                    >
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
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end justify-center pb-0.5">
                            {post.media_type?.toLowerCase().includes('video') && (
                              <Play className="w-3 h-3 text-white" fill="white" />
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Play className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    {/* Текст */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-medium text-foreground line-clamp-2">
                        {truncateText(post.caption, 60)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {post.posted_at
                          ? formatDistanceToNow(new Date(post.posted_at), { addSuffix: true, locale: ru })
                          : 'Дата неизвестна'}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Охват */}
                <td className="p-3 text-right">
                  <span className="text-sm font-medium">{formatNumber(post.impressions || 0)}</span>
                </td>

                {/* Комментарии */}
                <td className="p-3 text-right">
                  <span className="text-sm font-medium">{formatNumber(post.comments || 0)}</span>
                </td>

                {/* Результат */}
                <td className="p-3 text-right">
                  <div className="text-sm space-y-0.5">
                    <div>Лиды: {post.leads_count || 0}</div>
                    <div className="text-xs text-muted-foreground">Оплачено: {post.paid_leads || 0}</div>
                  </div>
                </td>

                {/* Выручка */}
                <td className="p-3 text-right">
                  <span className="text-sm font-medium">
                    {post.revenue > 0 ? `${formatNumber(post.revenue)} ₸` : '0 ₸'}
                  </span>
                </td>

                {/* Действие */}
                <td className="p-3 text-center">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => handlePromote(post)}
                  >
                    <Rocket className="w-3 h-3" />
                    Продвигать
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
