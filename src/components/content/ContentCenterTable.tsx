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
        <div className="mb-6 p-6 bg-card/40 backdrop-blur-xl border border-border/40 rounded-3xl shadow-sm animate-in fade-in-50 slide-in-from-top-2 duration-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-semibold text-foreground tracking-tight">{currentDay.dateLabel}</h3>
              <p className="text-sm text-muted-foreground mt-1 font-medium">
                {currentPosts.length} {currentPosts.length === 1 ? 'публикация' : currentPosts.length < 5 ? 'публикации' : 'публикаций'}
              </p>
            </div>
            <div className="flex gap-2">
                 {/* Additional day actions can go here */}
            </div>
          </div>
        </div>
      )}

      <div className="border border-border/40 rounded-3xl overflow-hidden bg-card/30 backdrop-blur-sm shadow-sm">
        <table className="w-full">
          <thead className="bg-muted/30">
              <tr>
              <th className="text-left p-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 w-[400px]">Контент</th>
              <th className="text-right p-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Охват</th>
              <th className="text-right p-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Комментарии</th>
              <th className="text-right p-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Результат</th>
              <th className="text-right p-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Диагностики</th>
              <th className="text-right p-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Выручка</th>
              <th className="text-center p-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Действие</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {currentPosts.map((post, index) => (
              <tr
                key={post.id}
                className="hover:bg-muted/20 transition-colors duration-200 group"
              >
                {/* Контент - превью + текст */}
                <td className="p-5">
                  <div className="flex gap-4 items-start">
                    {/* Улучшенное превью */}
                    <div 
                      className="relative w-24 h-24 flex-shrink-0 rounded-2xl overflow-hidden border border-border/40 cursor-pointer group-hover:border-primary/30 group-hover:shadow-md transition-all duration-300 bg-muted/20"
                      onClick={() => post.permalink && window.open(post.permalink, '_blank')}
                    >
                      {post.media_url ? (
                        <>
                          {post.media_type?.toLowerCase().includes('video') ? (
                            <video
                              src={post.media_url}
                              className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
                              muted
                              loop
                              playsInline
                            />
                          ) : (
                            <img
                              src={post.media_url}
                              alt="Post thumbnail"
                              className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
                              loading="lazy"
                            />
                          )}
                          {post.media_type?.toLowerCase().includes('video') && (
                            <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                                <Play className="w-3.5 h-3.5 text-white fill-white" />
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-8 h-8 text-muted-foreground/20" />
                        </div>
                      )}
                    </div>
                    
                    {/* Текст */}
                    <div className="flex-1 min-w-0 py-1">
                      <p className="text-sm font-medium text-foreground leading-relaxed line-clamp-2 group-hover:text-primary transition-colors duration-200">
                        {truncateText(post.caption, 80)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                         <span className="inline-flex items-center rounded-md bg-muted/50 px-2 py-1 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-gray-500/10">
                            Instagram
                         </span>
                         <span className="text-xs text-muted-foreground/60 font-medium">
                            {post.posted_at
                              ? formatDistanceToNow(new Date(post.posted_at), { addSuffix: true, locale: ru })
                              : 'Дата неизвестна'}
                         </span>
                      </div>
                    </div>
                  </div>
                </td>

                {/* Охват */}
                <td className="p-5 text-right align-middle">
                  <span className="text-sm font-semibold text-foreground">{formatNumber(post.impressions || 0)}</span>
                </td>

                {/* Комментарии */}
                <td className="p-5 text-right align-middle">
                  <span className="text-sm font-semibold text-foreground">{formatNumber(post.comments || 0)}</span>
                </td>

                {/* Результат */}
                <td className="p-5 text-right align-middle">
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-semibold text-foreground">{post.leads_count || 0} лидов</span>
                    {post.paid_leads > 0 && (
                       <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          {post.paid_leads} оплачено
                       </span>
                    )}
                  </div>
                </td>

                {/* Диагностики */}
                <td className="p-5 text-right align-middle">
                  <span className="text-sm font-semibold text-foreground">{post.leads_count || 0}</span>
                </td>

                {/* Выручка */}
                <td className="p-5 text-right align-middle">
                  <span className={cn(
                    "text-sm font-bold",
                    post.revenue > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/50"
                  )}>
                    {post.revenue > 0 ? `${formatNumber(post.revenue)} ₸` : '—'}
                  </span>
                </td>

                {/* Действие */}
                <td className="p-5 text-center align-middle">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 rounded-xl bg-background/50 border-border/40 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 shadow-sm"
                    onClick={() => handlePromote(post)}
                  >
                    <Rocket className="w-3.5 h-3.5" />
                    <span className="font-medium">Продвигать</span>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Пагинация по дням */}
      {postsByDay.length > 0 && (
        <div className="flex items-center justify-between mt-6 px-6 py-4 bg-card/40 backdrop-blur-xl border border-border/40 rounded-3xl shadow-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentDayIndex(prev => Math.max(0, prev - 1))}
            disabled={currentDayIndex === 0}
            className="gap-2 rounded-full hover:bg-background/80"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="font-medium">Предыдущий день</span>
          </Button>

          <div className="flex items-center gap-4">
            <div className="flex gap-1 bg-muted/30 p-1 rounded-xl">
              {postsByDay.map((day, index) => {
                 // Show only a window of days if too many
                 if (Math.abs(currentDayIndex - index) > 3 && index !== 0 && index !== postsByDay.length - 1) {
                    if (Math.abs(currentDayIndex - index) === 4) return <span key={day.date} className="w-8 flex items-center justify-center text-muted-foreground/40">...</span>;
                    return null;
                 }
                 
                 return (
                    <button
                      key={day.date}
                      onClick={() => setCurrentDayIndex(index)}
                      className={cn(
                        "min-w-[36px] h-9 px-2 text-xs font-semibold rounded-lg transition-all duration-300",
                        index === currentDayIndex
                          ? "bg-background shadow-sm text-foreground scale-105 border border-border/20"
                          : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                      )}
                      title={day.dateLabel}
                    >
                      {format(new Date(day.date), 'd', { locale: ru })}
                    </button>
                 );
              })}
            </div>
            <span className="text-sm font-medium text-muted-foreground min-w-[100px] text-right hidden sm:block">
              {currentDay?.dateLabel}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentDayIndex(prev => Math.min(postsByDay.length - 1, prev + 1))}
            disabled={currentDayIndex === postsByDay.length - 1}
            className="gap-2 rounded-full hover:bg-background/80"
          >
            <span className="font-medium">Следующий день</span>
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
