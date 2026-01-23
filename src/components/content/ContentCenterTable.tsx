import { useState, useMemo } from 'react';
import { Play, Rocket, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useInstagramPostsStats } from '@/hooks/useInstagramPostsStats';
import { LaunchOrbitalModal } from './LaunchOrbitalModal';
import { formatDistanceToNow, format, startOfDay, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ContentCenterTableProps {
  projectId: string | null;
}

export const ContentCenterTable = ({ projectId }: ContentCenterTableProps) => {
  const { posts, loading, error } = useInstagramPostsStats(projectId);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);

  // Группируем посты по дням
  const postsByDay = useMemo(() => {
    if (!posts || posts.length === 0) return [];
    
    const grouped: { [key: string]: typeof posts } = {};
    
    posts.forEach(post => {
      if (!post.posted_at) return;
      const postDate = startOfDay(new Date(post.posted_at));
      const dateKey = format(postDate, 'yyyy-MM-dd');
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(post);
    });
    
    // Сортируем дни по убыванию (новые сначала)
    const sortedDays = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
    
    return sortedDays.map(day => ({
      date: day,
      dateLabel: format(new Date(day), 'd MMMM', { locale: ru }),
      posts: grouped[day]
    }));
  }, [posts]);

  // Текущий день для отображения
  const currentDay = postsByDay[currentDayIndex];
  const currentPosts = currentDay?.posts || [];

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

  if (postsByDay.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4 p-6">
        <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center">
          <Play className="w-8 h-8 text-violet-600" />
        </div>
        <div className="text-center space-y-2 max-w-md">
          <p className="font-semibold text-lg">Нет постов с датами</p>
          <p className="text-sm text-muted-foreground">
            Все посты не имеют даты публикации.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Заголовок с информацией о текущем дне */}
      {currentDay && (
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{currentDay.dateLabel}</h3>
            <p className="text-sm text-muted-foreground">
              {currentPosts.length} {currentPosts.length === 1 ? 'публикация' : currentPosts.length < 5 ? 'публикации' : 'публикаций'}
            </p>
          </div>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
              <tr>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground w-80">Контент</th>
              <th className="text-right p-3 text-sm font-medium text-muted-foreground">Охват</th>
              <th className="text-right p-3 text-sm font-medium text-muted-foreground">Комментарии</th>
              <th className="text-right p-3 text-sm font-medium text-muted-foreground">Результат</th>
              <th className="text-right p-3 text-sm font-medium text-muted-foreground">Диагностики</th>
              <th className="text-right p-3 text-sm font-medium text-muted-foreground">Выручка</th>
              <th className="text-center p-3 text-sm font-medium text-muted-foreground">Действие</th>
            </tr>
          </thead>
          <tbody>
            {currentPosts.map((post, index) => (
              <tr
                key={post.id}
                className="border-t hover:bg-muted/30 transition-colors"
              >
                {/* Контент - превью + текст */}
                <td className="p-3">
                  <div className="flex gap-3 items-start">
                    {/* Улучшенное превью */}
                    <div 
                      className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 border-border/50 cursor-pointer hover:border-primary/50 hover:scale-105 transition-all shadow-sm"
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
                              playsInline
                            />
                          ) : (
                            <img
                              src={post.media_url}
                              alt="Post thumbnail"
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          )}
                          {post.media_type?.toLowerCase().includes('video') && (
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                              <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                <Play className="w-4 h-4 text-white" fill="white" />
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                          <Play className="w-6 h-6 text-muted-foreground" />
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

                {/* Диагностики */}
                <td className="p-3 text-right">
                  <span className="text-sm font-medium">{post.leads_count || 0}</span>
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

      {/* Пагинация по дням */}
      {postsByDay.length > 0 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDayIndex(prev => Math.max(0, prev - 1))}
            disabled={currentDayIndex === 0}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Предыдущий день
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {currentDayIndex + 1} из {postsByDay.length}
            </span>
            <div className="flex gap-1">
              {postsByDay.map((day, index) => (
                <button
                  key={day.date}
                  onClick={() => setCurrentDayIndex(index)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    index === currentDayIndex
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}
                  title={day.dateLabel}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {currentDay?.dateLabel}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDayIndex(prev => Math.min(postsByDay.length - 1, prev + 1))}
            disabled={currentDayIndex === postsByDay.length - 1}
            className="gap-1"
          >
            Следующий день
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

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
