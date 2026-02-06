// @ts-nocheck
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Instagram, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface InstagramIntegrationProps {
  projectId: string;
}

interface InstagramAccount {
  id: string;
  username: string;
  profile_picture_url?: string;
  followers_count?: number;
  media_count?: number;
}

export const InstagramIntegration = ({ projectId }: InstagramIntegrationProps) => {
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [account, setAccount] = useState<InstagramAccount | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchFacebookToken = useCallback(async () => {
    setLoading(true);
    try {
      const targetProjectId = '64c94e87-630c-470e-8ab1-8f7c8c835efa';
      
      const { data } = await supabase
        .from('ad_accounts')
        .select('access_token, status')
        .eq('project_id', targetProjectId)
        .eq('platform', 'facebook')
        .eq('status', 'active')
        .single();

      if (data?.access_token) {
        console.log('Facebook token found, fetching Instagram...');
        setAccessToken(data.access_token);
        await fetchInstagramAccount(data.access_token);
      } else {
        console.log('No active Facebook token');
        setAccessToken(null);
        setAccount(null);
      }
    } catch (error) {
      console.error('Error fetching token:', error);
      setAccessToken(null);
      setAccount(null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const fetchInstagramAccount = async (token: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setChecking(true);
    try {
      // Получаем Pages
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?fields=instagram_business_account&access_token=${token}`,
        { signal }
      );

      if (!pagesResponse.ok) {
        throw new Error('Failed to fetch pages');
      }

      const pagesData = await pagesResponse.json();
      console.log('Pages data:', pagesData);

      // Ищем Instagram Business Account
      for (const page of pagesData.data || []) {
        if (page.instagram_business_account) {
          const igId = page.instagram_business_account.id;
          console.log('Found Instagram Business Account:', igId);

          // Получаем детали аккаунта
          const igResponse = await fetch(
            `https://graph.facebook.com/v18.0/${igId}?fields=id,username,profile_picture_url,followers_count,media_count&access_token=${token}`,
            { signal }
          );

          if (igResponse.ok) {
            const igData = await igResponse.json();
            console.log('Instagram account details:', igData);
            setAccount(igData);
            return;
          }
        }
      }

      console.log('No Instagram Business Account found');
      setAccount(null);
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error fetching Instagram:', error);
      toast.error('Ошибка загрузки Instagram', {
        description: error.message
      });
      setAccount(null);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    fetchFacebookToken();
  }, [fetchFacebookToken]);

  const handleRefresh = () => {
    if (accessToken) {
      fetchInstagramAccount(accessToken);
    } else {
      fetchFacebookToken();
    }
  };

  const isConnected = !!account;
  const hasFacebookToken = !!accessToken;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-xl border transition-all duration-300",
        isConnected 
          ? "bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-red-500/5 border-purple-500/20"
          : "bg-card/50 backdrop-blur-sm border-border/50"
      )}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-3 rounded-xl transition-all duration-300",
              isConnected 
                ? "bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/25"
                : "bg-muted"
            )}>
              <Instagram className={cn(
                "w-6 h-6 transition-colors",
                isConnected ? "text-white" : "text-muted-foreground"
              )} />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Instagram Business</h3>
                {isConnected ? (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Активно
                  </Badge>
                ) : hasFacebookToken ? (
                  <Badge variant="outline" className="border-yellow-500/20 text-yellow-600">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Не найден
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    Не подключено
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Посты, Stories, Insights и статистика
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : isConnected && account ? (
          <div className="space-y-4">
            {/* Instagram Profile */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-background/50">
              {account.profile_picture_url && (
                <img 
                  src={account.profile_picture_url} 
                  alt={account.username}
                  className="w-16 h-16 rounded-full object-cover border-2 border-purple-500/20"
                />
              )}
              <div className="flex-1">
                <p className="font-semibold text-lg">@{account.username}</p>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  {account.followers_count !== undefined && (
                    <span>{account.followers_count.toLocaleString()} подписчиков</span>
                  )}
                  {account.media_count !== undefined && (
                    <span>{account.media_count} публикаций</span>
                  )}
                </div>
              </div>
            </div>

            {/* Подключено через */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground px-4">
              <div className="w-1 h-1 rounded-full bg-green-500" />
              Подключено через Facebook Business
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleRefresh}
                disabled={checking}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                {checking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Обновление...
                  </>
                ) : (
                  'Обновить данные'
                )}
              </Button>
            </div>
          </div>
        ) : hasFacebookToken ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-600">Instagram Business аккаунт не найден</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Убедитесь, что:
                  </p>
                  <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                    <li>У вас есть Instagram Business аккаунт</li>
                    <li>Он привязан к Facebook Page</li>
                    <li>У вас есть права администратора</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              onClick={handleRefresh}
              disabled={checking}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {checking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Проверка...
                </>
              ) : (
                'Проверить снова'
              )}
            </Button>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground text-center">
              Сначала подключите Facebook выше ↑
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
