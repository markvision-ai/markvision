import { useState, useEffect } from 'react';
import { Instagram, Eye, Heart, MessageCircle, TrendingUp, RefreshCw, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMetaSync } from '@/hooks/useMetaSync';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface InstagramStatsProps {
  projectId: string | null;
}

interface ContentItem {
  id: string;
  media_id: string;
  media_type: string;
  caption: string | null;
  permalink: string;
  thumbnail_url: string | null;
  views_count: number;
  likes_count: number;
  comments_count: number;
  posted_at: string;
}

export const InstagramStats = ({ projectId }: InstagramStatsProps) => {
  const { syncing, syncMetaData, getInstagramContent, getIntegrationStatus } = useMetaSync(projectId);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [status, setStatus] = useState<{ connected: boolean; lastSync: string | null }>({
    connected: false,
    lastSync: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) return;
      
      setLoading(true);
      try {
        const [contentData, integrationStatus] = await Promise.all([
          getInstagramContent(20),
          getIntegrationStatus()
        ]);
        setContent(contentData);
        setStatus(integrationStatus);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, getInstagramContent, getIntegrationStatus]);

  const handleSync = async () => {
    const result = await syncMetaData('instagram');
    if (result?.success) {
      const newContent = await getInstagramContent(20);
      setContent(newContent);
      setStatus(prev => ({ ...prev, lastSync: result.synced_at || null }));
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getTotalStats = () => {
    return content.reduce((acc, item) => ({
      views: acc.views + item.views_count,
      likes: acc.likes + item.likes_count,
      comments: acc.comments + item.comments_count
    }), { views: 0, likes: 0, comments: 0 });
  };

  const totalStats = getTotalStats();
  const reelsCount = content.filter(c => c.media_type === 'REELS').length;
  const postsCount = content.filter(c => c.media_type !== 'REELS').length;

  if (!projectId) return null;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
            <Instagram className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">Instagram Аналитика</CardTitle>
            <p className="text-xs text-muted-foreground">
              {status.connected ? 'Данные синхронизированы' : 'Подключите Instagram'}
            </p>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={syncing || !status.connected}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!status.connected ? (
          <div className="text-center py-8 text-muted-foreground">
            <Instagram className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Подключите Instagram в Настройки → Интеграции</p>
          </div>
        ) : content.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Нет данных. Нажмите "Обновить" для синхронизации.</p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-secondary/50 text-center">
                <Eye className="h-5 w-5 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">{formatNumber(totalStats.views)}</p>
                <p className="text-xs text-muted-foreground">Просмотры</p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/50 text-center">
                <Heart className="h-5 w-5 mx-auto mb-2 text-red-500" />
                <p className="text-2xl font-bold">{formatNumber(totalStats.likes)}</p>
                <p className="text-xs text-muted-foreground">Лайки</p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/50 text-center">
                <MessageCircle className="h-5 w-5 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">{formatNumber(totalStats.comments)}</p>
                <p className="text-xs text-muted-foreground">Комментарии</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary">{reelsCount} Reels</Badge>
              <Badge variant="outline">{postsCount} Постов</Badge>
              {status.lastSync && (
                <span className="text-xs text-muted-foreground ml-auto">
                  Обновлено {formatDistanceToNow(new Date(status.lastSync), { 
                    addSuffix: true, 
                    locale: ru 
                  })}
                </span>
              )}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {content.slice(0, 8).map(item => (
                <a
                  key={item.id}
                  href={item.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square rounded-lg overflow-hidden bg-secondary hover:ring-2 ring-primary transition-all"
                >
                  {item.thumbnail_url ? (
                    <img 
                      src={item.thumbnail_url} 
                      alt="" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                      <Instagram className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {formatNumber(item.views_count)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {formatNumber(item.likes_count)}
                        </span>
                      </div>
                      <ExternalLink className="h-4 w-4 mt-2 mx-auto" />
                    </div>
                  </div>
                  
                  {item.media_type === 'REELS' && (
                    <Badge className="absolute top-2 left-2 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                      Reels
                    </Badge>
                  )}
                </a>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
