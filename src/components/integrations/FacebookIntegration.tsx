import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Facebook, CheckCircle, Loader2, Unlink, Instagram, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface FacebookIntegrationProps {
  projectId: string;
}

interface FacebookConnection {
  id: string;
  access_token: string;
  connected_at: string;
  platform: 'facebook';
}

interface FacebookProfile {
  id: string;
  name: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

interface InstagramAccount {
  id: string;
  username: string;
  profile_picture_url?: string;
}

const MetaLogo = () => (
  <svg viewBox="0 0 36 36" className="w-6 h-6" fill="currentColor">
    <path d="M20.664 1.872l-8.986 13.5c-.419.628.04 1.478.828 1.478h5.997v17.278c0 .911 1.108 1.363 1.75.714l8.986-13.5c.419-.628-.04-1.478-.828-1.478h-5.997V2.586c0-.911-1.108-1.363-1.75-.714z"/>
  </svg>
);

export const FacebookIntegration = ({ projectId }: FacebookIntegrationProps) => {
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [connection, setConnection] = useState<FacebookConnection | null>(null);
  const [facebookProfile, setFacebookProfile] = useState<FacebookProfile | null>(null);
  const [instagramAccounts, setInstagramAccounts] = useState<InstagramAccount[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  const fetchConnection = useCallback(async () => {
    if (!projectId) return;
    
    try {
      console.log('📡 Fetching Facebook connection from database...');
      
      const { data, error } = await supabase
        .from('ad_accounts')
        .select('id, access_token, created_at, platform')
        .eq('project_id', projectId)
        .eq('platform', 'facebook')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        console.error('Error fetching Facebook connection:', error);
      }

      if (data) {
        console.log('✅ Facebook connection found:', {
          id: data.id,
          hasToken: !!data.access_token,
          tokenLength: data.access_token?.length || 0
        });
        
        setConnection({
          id: data.id,
          access_token: data.access_token || '',
          connected_at: data.created_at,
          platform: 'facebook'
        });
        
        // Загружаем профили сразу после получения токена
        if (data.access_token) {
          console.log('🚀 Starting profile fetch with token...');
          await fetchProfiles(data.access_token);
        } else {
          console.log('⚠️ No access token found in database');
        }
      } else {
        console.log('❌ No Facebook connection found');
        setConnection(null);
        setFacebookProfile(null);
        setInstagramAccounts([]);
      }
    } catch (error) {
      console.error('Error fetching connection:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const fetchProfiles = async (accessToken: string) => {
    if (!accessToken) {
      console.log('❌ No access token provided to fetchProfiles');
      return;
    }
    
    console.log('🔑 Access token length:', accessToken.length);
    setLoadingProfiles(true);
    
    try {
      console.log('📡 Calling Edge Function: fetch-facebook-profiles');
      console.log('📦 Payload:', { accessToken: accessToken.substring(0, 20) + '...' });
      
      // Используем Edge Function для обхода CORS
      const { data, error } = await supabase.functions.invoke('fetch-facebook-profiles', {
        body: { accessToken }
      });

      console.log('📬 Edge Function raw response:', { data, error });

      if (error) {
        console.error('❌ Edge Function error:', error);
        throw error;
      }

      console.log('✅ Edge Function response:', data);

      if (data.facebookProfile) {
        console.log('📱 Facebook Profile found:', data.facebookProfile.name);
        setFacebookProfile(data.facebookProfile);
      } else {
        console.log('⚠️ No Facebook profile in response');
      }

      if (data.instagramAccounts && data.instagramAccounts.length > 0) {
        console.log('📸 Instagram Accounts found:', data.instagramAccounts.map((ig: any) => ig.username).join(', '));
        setInstagramAccounts(data.instagramAccounts);
      } else {
        console.log('⚠️ No Instagram accounts in response');
      }

      if (!data.facebookProfile && (!data.instagramAccounts || data.instagramAccounts.length === 0)) {
        console.log('⚠️ No profiles found in response');
        toast.warning('Профили не найдены', {
          description: 'Возможно, токен устарел или отсутствуют права доступа'
        });
      } else {
        const fbText = data.facebookProfile ? `👤 ${data.facebookProfile.name}` : '';
        const igText = data.instagramAccounts?.length ? `📸 ${data.instagramAccounts.length} Instagram` : '';
        const separator = fbText && igText ? ' + ' : '';
        
        toast.success('Профили загружены!', {
          description: fbText + separator + igText
        });
      }
    } catch (error: any) {
      console.error('❌ Error fetching profiles:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      toast.error('Не удалось загрузить профили', {
        description: error.message || 'Проверьте токен и права доступа'
      });
    } finally {
      setLoadingProfiles(false);
    }
  };

  useEffect(() => {
    fetchConnection();
  }, [fetchConnection]);

  // Обработка OAuth ошибок из URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    
    if (error) {
      const errorMessage = errorDescription 
        ? decodeURIComponent(errorDescription) 
        : 'Ошибка авторизации через Facebook';
      
      toast.error(errorMessage, {
        duration: 5000,
        description: error === 'server_error' ? 'Попробуйте еще раз или обратитесь в поддержку' : undefined
      });
      
      // Очищаем URL от параметров ошибки
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Обработка OAuth callback (упрощенная версия - токен вставляется вручную через SQL)
  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Проверяем, есть ли Facebook identity (значит, OAuth прошёл)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.identities?.some((id: any) => id.provider === 'facebook')) {
        console.log('✅ Facebook identity linked successfully');
        
        // Показываем инструкцию, как добавить токен
        const hasToken = connection?.access_token;
        
        if (!hasToken) {
          console.log('ℹ️ Facebook аккаунт привязан через Supabase OAuth, но токен не получен');
          toast.info('Facebook привязан, но токен не получен', {
            description: 'Используйте кнопку "Привязать аккаунт" для прямой авторизации',
            duration: 5000
          });
        } else {
          // Токен уже есть в базе - просто перезагружаем данные
          console.log('✅ Token already in database, refreshing profiles...');
          fetchConnection();
        }
        
        // Очистка URL от OAuth параметров
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    handleOAuthCallback();
  }, [projectId, connection?.access_token, fetchConnection]);

  const handleConnect = async () => {
    setConnecting(true);
    
    try {
      // Если токен уже есть в базе и статус inactive - просто активируем
      if (connection && connection.access_token && connection.status === 'inactive') {
        console.log('✅ Token exists but inactive, activating...');
        
        const { error } = await supabase
          .from('ad_accounts')
          .update({ status: 'active' })
          .eq('id', connection.id);

        if (error) throw error;

        toast.success('Facebook & Instagram активированы!');
        fetchConnection();
        return;
      }

      // ПРЯМАЯ авторизация через Facebook JS SDK
      console.log('🚀 Starting Facebook Login...');
      
      // Проверяем FB SDK
      const FB = (window as any).FB;
      if (!FB) {
        toast.error('Facebook SDK не загружен', {
          description: 'Перезагрузите страницу'
        });
        return;
      }

      FB.login(function(response: any) {
        console.log('📱 Facebook Login response:', response);
        
        if (response.authResponse) {
          const accessToken = response.authResponse.accessToken;
          console.log('✅ Got access token from Facebook!', accessToken.substring(0, 20) + '...');
          
          // Сохраняем токен в базу
          const targetProjectId = '64c94e87-630c-470e-8ab1-8f7c8c835efa';
          
          supabase
            .from('ad_accounts')
            .upsert({
              project_id: targetProjectId,
              platform: 'facebook',
              external_id: 'facebook_sdk_token',
              access_token: accessToken,
              status: 'active'
            }, {
              onConflict: 'project_id,platform,external_id'
            })
            .then(({ error }) => {
              if (error) {
                console.error('❌ Error saving token:', error);
                toast.error('Ошибка сохранения токена');
              } else {
                console.log('✅ Token saved to database!');
                toast.success('Facebook подключен!', {
                  description: 'Загружаем профили...'
                });
                
                // Перезагружаем данные
                fetchConnection();
              }
              
              setConnecting(false);
            });
        } else {
          console.log('❌ User cancelled login or did not fully authorize.');
          toast.error('Авторизация отменена');
          setConnecting(false);
        }
      }, {
        scope: 'ads_read,instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement'
      });
    } catch (error: any) {
      console.error('❌ Connection error:', error);
      toast.error('Ошибка подключения: ' + (error.message || 'Неизвестная ошибка'));
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!connection) return;

    setDisconnecting(true);
    
    try {
      // Вместо удаления - деактивируем
      const { error } = await supabase
        .from('ad_accounts')
        .update({ status: 'inactive' })
        .eq('id', connection.id);

      if (error) throw error;

      // Обновляем локальное состояние
      setConnection({ ...connection, status: 'inactive' });
      setFacebookProfile(null);
      setInstagramAccounts([]);
      
      toast.success('Facebook & Instagram деактивированы', {
        description: 'Токен сохранён, можно активировать заново'
      });
      
      // Перезагружаем данные
      fetchConnection();
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Ошибка отключения');
    } finally {
      setDisconnecting(false);
    }
  };

  const isConnected = !!connection && connection.access_token && connection.access_token.length > 0;

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-card/50 backdrop-blur-lg border border-border/50 p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 transition-all duration-300",
        "bg-card/50 backdrop-blur-lg border",
        isConnected 
          ? "border-blue-500/30 shadow-lg shadow-blue-500/10" 
          : "border-border/50 hover:border-border"
      )}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className={cn(
            "absolute inset-0 bg-gradient-to-br",
            isConnected 
              ? "from-blue-500 via-indigo-500 to-purple-500" 
              : "from-blue-500/20 via-indigo-500/20 to-purple-500/20"
          )}
        />
      </div>

      {/* Pulsing effect when connected */}
      <AnimatePresence>
        {isConnected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            <motion.div
              className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-blue-500/20 blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
              isConnected 
                ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30" 
                : "bg-blue-500/10 text-blue-500"
            )}>
              <MetaLogo />
            </div>
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                Facebook & Instagram
                {isConnected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                  </motion.div>
                )}
              </h3>
              <p className="text-xs text-muted-foreground">
                Реклама, Insights и Instagram контент
              </p>
            </div>
          </div>

          <Badge 
            variant={isConnected ? "default" : "secondary"}
            className={cn(
              "transition-all",
              isConnected && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
            )}
          >
            {isConnected ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                Активно
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-muted-foreground/50 mr-2" />
                Не подключено
              </>
            )}
          </Badge>
        </div>

        {/* Features List */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/50 border border-border/50">
            <Facebook className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-muted-foreground">Facebook Ads</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/50 border border-border/50">
            <Instagram className="w-3.5 h-3.5 text-pink-500" />
            <span className="text-muted-foreground">Instagram</span>
          </div>
        </div>

        {/* Connection Info & Profiles */}
        {isConnected && connection && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {/* Connection Date */}
            <div className="text-xs text-muted-foreground bg-background/30 rounded-lg p-3 border border-border/30">
              <div className="flex items-center justify-between">
                <span>Подключено:</span>
                <span className="font-mono">
                  {new Date(connection.connected_at).toLocaleDateString('ru-RU')}
                </span>
              </div>
            </div>

            {/* Facebook Profile */}
            {loadingProfiles ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="ml-2 text-xs text-muted-foreground">Загрузка профилей...</span>
              </div>
            ) : (
              <>
                {facebookProfile && (
                  <div className="bg-background/30 rounded-lg p-3 border border-border/30">
                    <div className="flex items-center gap-3">
                      {facebookProfile.picture?.data?.url && (
                        <img 
                          src={facebookProfile.picture.data.url} 
                          alt={facebookProfile.name}
                          className="w-10 h-10 rounded-full border-2 border-blue-500/30"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Facebook className="w-3.5 h-3.5 text-blue-500" />
                          <p className="text-sm font-medium truncate">{facebookProfile.name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">Facebook Personal</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Instagram Accounts */}
                {instagramAccounts.length > 0 && (
                  <div className="space-y-2">
                    {instagramAccounts.map((igAccount) => (
                      <div 
                        key={igAccount.id}
                        className="bg-background/30 rounded-lg p-3 border border-border/30"
                      >
                        <div className="flex items-center gap-3">
                          {igAccount.profile_picture_url && (
                            <img 
                              src={igAccount.profile_picture_url} 
                              alt={igAccount.username}
                              className="w-10 h-10 rounded-full border-2 border-pink-500/30"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Instagram className="w-3.5 h-3.5 text-pink-500" />
                              <p className="text-sm font-medium truncate">@{igAccount.username}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">Instagram Business</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* No profiles found */}
                {!facebookProfile && instagramAccounts.length === 0 && !loadingProfiles && (
                  <div className="text-xs text-muted-foreground bg-amber-500/10 rounded-lg p-3 border border-amber-500/20">
                    <p className="flex items-center gap-2">
                      <span>⚠️</span>
                      <span>Профили не найдены. Возможно, токен устарел.</span>
                    </p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* Help text for manual token */}
        {!isConnected && (
          <div className="text-xs text-muted-foreground bg-blue-500/5 rounded-lg p-3 border border-blue-500/20">
            <p className="flex items-start gap-2">
              <span className="text-blue-500">ℹ️</span>
              <span>
                После привязки аккаунта добавьте токен через{' '}
                <a 
                  href="https://developers.facebook.com/tools/explorer/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Graph API Explorer
                </a>
                {' '}и выполните SQL из файла <code className="text-xs bg-background/50 px-1 rounded">EXECUTE_THIS_SQL.sql</code>
              </span>
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {!isConnected ? (
            <Button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 transition-all"
            >
              {connecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Подключение...
                </>
              ) : connection && connection.access_token && connection.status === 'inactive' ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span>Активировать</span>
                </>
              ) : (
                <>
                  <MetaLogo />
                  <span className="ml-2">Привязать аккаунт</span>
                </>
              )}
            </Button>
          ) : (
            <div className="flex gap-2 w-full">
              <Button
                onClick={() => connection?.access_token && fetchProfiles(connection.access_token)}
                disabled={loadingProfiles}
                variant="outline"
                className="flex-1 border-blue-500/30 text-blue-500 hover:bg-blue-500/10"
                size="sm"
              >
                {loadingProfiles ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                    Обновление...
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Обновить
                  </>
                )}
              </Button>
              <Button
                onClick={handleDisconnect}
                disabled={disconnecting}
                variant="outline"
                className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                size="sm"
              >
                {disconnecting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                    Отключение...
                  </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Деактивировать
                </>
              )}
              </Button>
            </div>
          )}
        </div>
      </div>

    </motion.div>
  );
};
