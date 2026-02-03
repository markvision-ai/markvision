// @ts-nocheck
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface InstagramPostsProps {
  projectId: string;
}

export const InstagramPosts = ({ projectId }: InstagramPostsProps) => {
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
 const [accessToken, setAccessToken] = useState<string | null>(null);
  const [igAccountId, setIgAccountId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetchToken();
  }, [projectId]);

  const fetchToken = async () => {
    try {
      const { data } = await supabase
        .from('ad_accounts')
        .select('access_token')
        .eq('project_id', projectId)
        .eq('platform', 'facebook')
        .eq('status', 'active')
        .single();

      if (data?.access_token) {
        setAccessToken(data.access_token);
        await getInstagramAccountId(data.access_token);
      }
    } catch (error) {
      console.error('Error fetching token:', error);
    }
  };

  const getInstagramAccountId = async (token: string) => {
    try {
      // Получаем Pages
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?fields=instagram_business_account&access_token=${token}`
      );

      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json();
        
        for (const page of pagesData.data || []) {
          if (page.instagram_business_account) {
            setIgAccountId(page.instagram_business_account.id);
            console.log('Instagram Account ID:', page.instagram_business_account.id);
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error getting IG account:', error);
    }
  };

  const fetchPosts = async () => {
    if (!accessToken || !igAccountId) {
      toast.error('Instagram аккаунт не найден');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);

    try {
      // Получаем последние 10 постов
      const postsResponse = await fetch(
        `https://graph.facebook.com/v18.0/${igAccountId}/media?` +
        `fields=id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count,permalink&` +
        `limit=10&` +
        `access_token=${accessToken}`,
        { signal }
      );

      if (!postsResponse.ok) {
        throw new Error('Failed to fetch posts');
      }

      const postsData = await postsResponse.json();
      console.log('Instagram Posts:', postsData);

      if (postsData.data && postsData.data.length > 0) {
        // Получаем insights для каждого поста
        const postsWithInsights = await Promise.all(
          postsData.data.map(async (post: any) => {
            try {
              const insightsResponse = await fetch(
                `https://graph.facebook.com/v18.0/${post.id}/insights?` +
                `metric=impressions,reach,engagement&` +
                `access_token=${accessToken}`,
                { signal }
              );

              if (insightsResponse.ok) {
                const insightsData = await insightsResponse.json();
                const insights: any = {};
                
                insightsData.data?.forEach((metric: any) => {
                  insights[metric.name] = metric.values[0]?.value || 0;
                });

                return { ...post, insights };
              }
            } catch (error: any) {
              if (error.name !== 'AbortError') {
                console.error('Error fetching insights for post:', post.id, error);
              }
            }
            
            return post;
          })
        );

        setPosts(postsWithInsights);
        toast.success(`Загружено ${postsWithInsights.length} постов`);
      } else {
        toast.warning('Посты не найдены');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error fetching posts:', error);
      toast.error('Ошибка загрузки постов', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  if (!accessToken) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">
          Подключите Facebook, чтобы видеть посты Instagram
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Instagram - Последние 10 постов</h3>
        <Button
          onClick={fetchPosts}
          disabled={loading || !igAccountId}
          size="sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Загрузка...
            </>
          ) : (
            'Загрузить посты'
          )}
        </Button>
      </div>

      {posts.length > 0 && (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-4">
                {post.media_type === 'VIDEO' && post.thumbnail_url && (
                  <img src={post.thumbnail_url} alt="" className="w-20 h-20 object-cover rounded" />
                )}
                {post.media_type === 'IMAGE' && post.media_url && (
                  <img src={post.media_url} alt="" className="w-20 h-20 object-cover rounded" />
                )}
                
                <div className="flex-1">
                  <p className="text-sm line-clamp-2">{post.caption}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(post.timestamp).toLocaleDateString('ru')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Показы</p>
                  <p className="font-semibold">{post.insights?.impressions?.toLocaleString() || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Охват</p>
                  <p className="font-semibold">{post.insights?.reach?.toLocaleString() || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Лайки</p>
                  <p className="font-semibold">{post.like_count || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Комменты</p>
                  <p className="font-semibold">{post.comments_count || 0}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
