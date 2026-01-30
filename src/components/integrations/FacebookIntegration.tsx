import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Facebook, CheckCircle, Loader2, Unlink, Instagram, Zap, Search, RefreshCw, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  status?: 'active' | 'inactive';
  selected_page_id?: string;
  selected_instagram_id?: string;
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
  connected_page?: string;
  followers_count?: number;
}

interface SelectedAccount {
  page: FacebookProfile | null;
  instagram: InstagramAccount | null;
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
  const [availablePages, setAvailablePages] = useState<FacebookProfile[]>([]);
  const [availableInstagrams, setAvailableInstagrams] = useState<InstagramAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<SelectedAccount>({ page: null, instagram: null });
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [facebookProfile, setFacebookProfile] = useState<FacebookProfile | null>(null);
  const [instagramAccounts, setInstagramAccounts] = useState<InstagramAccount[]>([]);

  const fetchConnection = useCallback(async () => {
    if (!projectId) return;

    try {
      console.log('📡 Проверяем подключение и выбранные аккаунты...');

      const { data, error } = await supabase
        .from('ad_accounts')
        .select('id, access_token, created_at, platform, status, selected_page_id, selected_instagram_id')
        .eq('project_id', projectId)
        .eq('platform', 'facebook')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Ошибка получения подключения:', error);
      }

      if (data && data.access_token) {
        console.log('✅ Подключение найдено:', {
          id: data.id,
          hasSelectedPage: !!data.selected_page_id,
          hasSelectedInstagram: !!data.selected_instagram_id
        });

        setConnection({
          id: data.id,
          access_token: data.access_token,
          connected_at: data.created_at,
          platform: 'facebook',
          status: data.status === 'inactive' ? 'inactive' : 'active',
          selected_page_id: data.selected_page_id,
          selected_instagram_id: data.selected_instagram_id
        });

        // Загружаем доступные профили
        await fetchProfiles(data.access_token);

        // Если есть выбранные аккаунты, загружаем их данные
        if (data.selected_page_id || data.selected_instagram_id) {
          await loadSelectedAccounts(data.access_token, data.selected_page_id, data.selected_instagram_id);
        }
      } else {
        console.log('❌ Подключение не найдено');
        setConnection(null);
        setAvailablePages([]);
        setAvailableInstagrams([]);
        setSelectedAccount({ page: null, instagram: null });
      }
    } catch (error) {
      console.error('Ошибка при проверке подключения:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const loadSelectedAccounts = async (accessToken: string, selectedPageId?: string, selectedInstagramId?: string) => {
    if (!accessToken || (!selectedPageId && !selectedInstagramId)) return;

    try {
      let selectedPage: FacebookProfile | null = null;
      let selectedInstagram: InstagramAccount | null = null;

      // Загружаем выбранную страницу
      if (selectedPageId) {
        const pageResponse = await fetch(
          `https://graph.facebook.com/v21.0/${selectedPageId}?fields=id,name,picture&access_token=${accessToken}`
        );
        if (pageResponse.ok) {
          selectedPage = await pageResponse.json();
        }
      }

      // Загружаем выбранный Instagram
      if (selectedInstagramId) {
        const igResponse = await fetch(
          `https://graph.facebook.com/v21.0/${selectedInstagramId}?fields=id,username,profile_picture_url,followers_count&access_token=${accessToken}`
        );
        if (igResponse.ok) {
          selectedInstagram = await igResponse.json();
        }
      }

      setSelectedAccount({ page: selectedPage, instagram: selectedInstagram });
      setFacebookProfile(selectedPage);
      setInstagramAccounts(selectedInstagram ? [selectedInstagram] : []);
      console.log('✅ Выбранные аккаунты загружены');

    } catch (error) {
      console.error('Ошибка загрузки выбранных аккаунтов:', error);
    }
  };

  const fetchProfiles = async (accessToken: string) => {
    if (!accessToken) {
      console.log('Токен отсутствует');
      return;
    }

    console.log('🔄 Загружаем доступные аккаунты из Meta API...');
    setLoadingProfiles(true);

    try {
      const pages: FacebookProfile[] = [];
      const instagrams: InstagramAccount[] = [];

      // Получаем Facebook Pages
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,picture,instagram_business_account&access_token=${accessToken}`
      );

      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json();
        console.log('Найдено страниц:', pagesData.data?.length || 0);

        for (const page of pagesData.data || []) {
          pages.push({
            id: page.id,
            name: page.name,
            picture: page.picture
          });

          // Получаем связанный Instagram
          if (page.instagram_business_account) {
            const igId = page.instagram_business_account.id;

            try {
              const igResponse = await fetch(
                `https://graph.facebook.com/v21.0/${igId}?fields=id,username,profile_picture_url,followers_count&access_token=${accessToken}`
              );

              if (igResponse.ok) {
                const igData = await igResponse.json();
                instagrams.push({
                  ...igData,
                  connected_page: page.name
                });
              }
            } catch (igError) {
              console.warn('Не удалось загрузить Instagram аккаунт:', igId);
            }
          }
        }
      }

      setAvailablePages(pages);
      setAvailableInstagrams(instagrams);
      setInstagramAccounts(instagrams);

      console.log('✅ Доступные аккаунты загружены');

    } catch (error: any) {
      console.error('Ошибка загрузки доступных аккаунтов:', error);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const selectAccount = async (pageId: string, instagramId?: string) => {
    if (!connection) return;

    try {
      const { error } = await supabase
        .from('ad_accounts')
        .update({
          selected_page_id: pageId,
          selected_instagram_id: instagramId || null
        })
        .eq('id', connection.id);

      if (error) throw error;

      // Обновляем локальное состояние
      setConnection({
        ...connection,
        selected_page_id: pageId,
        selected_instagram_id: instagramId || undefined
      });

      // Загружаем данные выбранных аккаунтов
      await loadSelectedAccounts(connection.access_token, pageId, instagramId);

      setShowAccountSelector(false);
      toast.success('Аккаунт успешно выбран!');
      setSearchQuery('');

    } catch (error: any) {
      console.error('Ошибка выбора аккаунта:', error);
      toast.error('Ошибка выбора аккаунта');
    }
  };

  const clearSelection = async () => {
    if (!connection) return;

    try {
      const { error } = await supabase
        .from('ad_accounts')
        .update({
          selected_page_id: null,
          selected_instagram_id: null
        })
        .eq('id', connection.id);

      if (error) throw error;

      setConnection({
        ...connection,
        selected_page_id: undefined,
        selected_instagram_id: undefined
      });

      setSelectedAccount({ page: null, instagram: null });
      toast.success('Выбор аккаунта сброшен');

    } catch (error: any) {
      console.error('Ошибка сброса выбора:', error);
      toast.error('Ошибка сброса выбора');
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
        scope: 'ads_read,ads_management,business_management,instagram_basic,instagram_manage_insights,instagram_content_publish,pages_show_list,pages_read_engagement,pages_manage_ads,leads_retrieval',
        auth_type: 'rerequest'
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

  const isConnected = !!connection && connection.access_token && connection.access_token.length > 0 && connection.status === 'active';
  const hasSelectedAccount = !!selectedAccount.page || !!selectedAccount.instagram;

  // Фильтруем аккаунты по поиску
  const filteredPages = availablePages.filter(page =>
    page.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredInstagrams = availableInstagrams.filter(ig =>
    ig.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ig.connected_page && ig.connected_page.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
    <div className="space-y-6">
      {/* Главная карточка активного подключения */}
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
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
            isConnected
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
              : "bg-background/50 border-border/50 text-muted-foreground"
          )}>
            <Facebook className="w-3.5 h-3.5" />
            <span>Facebook Ads</span>
            {isConnected && <CheckCircle className="w-3 h-3 text-emerald-500 ml-auto" />}
          </div>
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
            isConnected
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
              : "bg-background/50 border-border/50 text-muted-foreground"
          )}>
            <Instagram className="w-3.5 h-3.5" />
            <span>Instagram</span>
            {isConnected && <CheckCircle className="w-3 h-3 text-emerald-500 ml-auto" />}
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

                {/* Show connected pages and accounts */}
                {facebookProfile && (
                  <div className="space-y-3">
                    {/* Facebook Page */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="relative overflow-hidden rounded-xl bg-background/60 backdrop-blur-md border border-border/40 p-4 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        {facebookProfile.picture?.data?.url && (
                          <div className="relative">
                            <img
                              src={facebookProfile.picture.data.url}
                              alt={facebookProfile.name}
                              className="w-12 h-12 rounded-xl border-2 border-blue-500/30 shadow-sm"
                            />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background flex items-center justify-center">
                              <CheckCircle className="w-2.5 h-2.5 text-white" />
                            </div>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <MetaLogo />
                            <h4 className="font-semibold text-sm truncate">{facebookProfile.name}</h4>
                            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Facebook Business Page</p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Instagram Business Accounts */}
                    {instagramAccounts.map((igAccount, index) => (
                      <motion.div
                        key={igAccount.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * (index + 1) }}
                        className="relative overflow-hidden rounded-xl bg-background/60 backdrop-blur-md border border-border/40 p-4 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          {igAccount.profile_picture_url && (
                            <div className="relative">
                              <img
                                src={igAccount.profile_picture_url}
                                alt={igAccount.username}
                                className="w-12 h-12 rounded-xl border-2 border-pink-500/30 shadow-sm"
                              />
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background flex items-center justify-center">
                                <CheckCircle className="w-2.5 h-2.5 text-white" />
                              </div>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Instagram className="w-4 h-4 text-pink-500" />
                              <h4 className="font-semibold text-sm truncate">@{igAccount.username}</h4>
                              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Instagram Business Account</p>
                            {igAccount.connected_page && (
                              <p className="text-xs text-muted-foreground">Связан с: {igAccount.connected_page}</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
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
                onClick={() => {
                  if (connection?.access_token) {
                    console.log('🔄 Перезагрузка данных из Meta API...');
                    fetchProfiles(connection.access_token);
                  }
                }}
                disabled={loadingProfiles}
                variant="outline"
                className="flex-1 border-blue-500/30 text-blue-500 hover:bg-blue-500/10"
                size="sm"
              >
                {loadingProfiles ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                    Загрузка...
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
    </div>
  );
};
