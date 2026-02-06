// @ts-nocheck
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Facebook, CheckCircle, Loader2, Unlink, Instagram, Zap, Search, RefreshCw, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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

interface FacebookIntegrationProps {
  projectId: string;
}

// Meta Logo component
const MetaLogo = () => (
  <svg viewBox="0 0 24 24" className="w-full h-full">
    <path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

export const FacebookIntegrationNew = ({ projectId }: FacebookIntegrationProps) => {
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
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load Facebook SDK
  useEffect(() => {
    const loadFacebookSDK = () => {
      if (window.FB) return;

      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        window.FB.init({
          appId: '1234567890123456', // Replace with actual app ID
          cookie: true,
          xfbml: true,
          version: 'v21.0'
        });
      };
      document.body.appendChild(script);
    };

    loadFacebookSDK();
  }, []);

  const fetchConnection = useCallback(async () => {
    if (!projectId) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      console.log('📡 Проверяем подключение и выбранные аккаунты...');

      const { data, error } = await supabase
        .from('ad_accounts')
        .select('id, access_token, created_at, platform, status, selected_page_id, selected_instagram_id')
        .eq('project_id', projectId)
        .eq('platform', 'facebook')
        .abortSignal(signal)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        if (error.message?.includes('AbortError')) return;
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
          status: data.status || 'active',
          selected_page_id: data.selected_page_id,
          selected_instagram_id: data.selected_instagram_id
        });

        // Загружаем доступные профили
        await fetchProfiles(data.access_token, signal);

        // Если есть выбранные аккаунты, загружаем их данные
        if (data.selected_page_id || data.selected_instagram_id) {
          await loadSelectedAccounts(data.access_token, data.selected_page_id, data.selected_instagram_id, signal);
        }
      } else {
        console.log('❌ Подключение не найдено');
        setConnection(null);
        setAvailablePages([]);
        setAvailableInstagrams([]);
        setSelectedAccount({ page: null, instagram: null });
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('AbortError')) return;
      console.error('Ошибка при проверке подключения:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const loadSelectedAccounts = async (accessToken: string, selectedPageId?: string, selectedInstagramId?: string, signal?: AbortSignal) => {
    if (!accessToken || (!selectedPageId && !selectedInstagramId)) return;

    try {
      let selectedPage: FacebookProfile | null = null;
      let selectedInstagram: InstagramAccount | null = null;

      // Загружаем выбранную страницу
      if (selectedPageId) {
        const pageResponse = await fetch(
          `https://graph.facebook.com/v21.0/${selectedPageId}?fields=id,name,picture&access_token=${accessToken}`,
          { signal }
        );
        if (pageResponse.ok) {
          selectedPage = await pageResponse.json();
        }
      }

      // Загружаем выбранный Instagram
      if (selectedInstagramId) {
        const igResponse = await fetch(
          `https://graph.facebook.com/v21.0/${selectedInstagramId}?fields=id,username,profile_picture_url,followers_count&access_token=${accessToken}`,
          { signal }
        );
        if (igResponse.ok) {
          selectedInstagram = await igResponse.json();
        }
      }

      setSelectedAccount({ page: selectedPage, instagram: selectedInstagram });
      console.log('✅ Выбранные аккаунты загружены');

    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Ошибка загрузки выбранных аккаунтов:', error);
    }
  };

  const fetchProfiles = async (accessToken: string, signal?: AbortSignal) => {
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
        `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,picture,instagram_business_account&access_token=${accessToken}`,
        { signal }
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
                `https://graph.facebook.com/v21.0/${igId}?fields=id,username,profile_picture_url,followers_count&access_token=${accessToken}`,
                { signal }
              );

              if (igResponse.ok) {
                const igData = await igResponse.json();
                instagrams.push({
                  ...igData,
                  connected_page: page.name
                });
              }
            } catch (igError: any) {
              if (igError.name === 'AbortError') throw igError;
              console.warn('Не удалось загрузить Instagram аккаунт:', igId);
            }
          }
        }
      }

      setAvailablePages(pages);
      setAvailableInstagrams(instagrams);

      console.log('✅ Доступные аккаунты загружены');

    } catch (error: any) {
      if (error.name === 'AbortError') return;
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

  const handleConnect = async () => {
    if (!window.FB) {
      toast.error('Facebook SDK не загружен');
      return;
    }

    setConnecting(true);

    try {
      console.log('🔗 Начинаем процесс авторизации Facebook...');

      window.FB.login((response: any) => {
        if (response.authResponse) {
          console.log('✅ Facebook авторизация успешна:', response.authResponse);

          // Сохраняем токен в базу данных
          saveTokenToDatabase(response.authResponse.accessToken);

          toast.success('Facebook подключен!', {
            description: 'Загружаем профили...'
          });

          // Перезагружаем данные
          fetchConnection();
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

  const saveTokenToDatabase = async (accessToken: string) => {
    if (!projectId) return;

    try {
      // Сохраняем или обновляем токен
      const { error } = await supabase
        .from('ad_accounts')
        .upsert({
          project_id: projectId,
          platform: 'facebook',
          access_token: accessToken,
          status: 'active'
        }, {
          onConflict: 'project_id,platform'
        });

      if (error) throw error;

      console.log('✅ Токен сохранен в базу данных');
    } catch (error: any) {
      console.error('Ошибка сохранения токена:', error);
      toast.error('Ошибка сохранения токена');
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

  // Загружаем данные при монтировании
  useEffect(() => {
    fetchConnection();
  }, [fetchConnection]);

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
      <div className="relative overflow-hidden rounded-2xl bg-card/50 backdrop-blur-lg border border-border/50 p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-sm text-muted-foreground">Загрузка интеграций...</span>
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
          "relative overflow-hidden rounded-2xl p-8 transition-all duration-300",
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

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center transition-all",
                isConnected
                  ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                  : "bg-blue-500/10 text-blue-500"
              )}>
                <MetaLogo />
              </div>
              <div>
                <h2 className="font-semibold text-xl flex items-center gap-2">
                  Facebook & Instagram
                  {isConnected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
                    </motion.div>
                  )}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Реклама, Insights и Instagram контент
                </p>
              </div>
            </div>

            <Badge
              variant={isConnected ? "default" : "secondary"}
              className={cn(
                "transition-all text-sm px-3 py-1",
                isConnected && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
              )}
            >
              {isConnected ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Подключено
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/50 mr-2" />
                  Не подключено
                </>
              )}
            </Badge>
          </div>

          {/* Основное содержимое */}
          {!isConnected ? (
            // Состояние: нет подключения
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Facebook className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-medium mb-2">Подключите Meta аккаунт</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Свяжите ваш Facebook Business аккаунт для доступа к рекламе, аналитике и Instagram контенту
              </p>
              <Button
                onClick={handleConnect}
                disabled={connecting}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30"
              >
                {connecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Подключение...
                  </>
                ) : (
                  <>
                    <MetaLogo />
                    <span className="ml-2">Подключить Meta</span>
                  </>
                )}
              </Button>
            </div>
          ) : !hasSelectedAccount ? (
            // Состояние: подключено, но аккаунт не выбран
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Settings className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-medium mb-2">Аккаунт не выбран</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Выберите Facebook страницу и связанный Instagram аккаунт для работы с данными
              </p>

              <Dialog open={showAccountSelector} onOpenChange={setShowAccountSelector}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg">
                    <Search className="w-4 h-4 mr-2" />
                    Выбрать из доступных
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
                  <DialogHeader>
                    <DialogTitle>Выберите аккаунт для работы</DialogTitle>
                  </DialogHeader>

                  {/* Поиск */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Поиск по названию..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Список аккаунтов */}
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {loadingProfiles ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        <span className="ml-3">Загрузка аккаунтов...</span>
                      </div>
                    ) : (
                      <>
                        {/* Facebook Pages */}
                        {filteredPages.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                              <Facebook className="w-4 h-4 text-blue-500" />
                              Facebook страницы
                            </h4>
                            <div className="space-y-2">
                              {filteredPages.map((page) => {
                                const connectedIg = availableInstagrams.find(ig => ig.connected_page === page.name);
                                return (
                                  <motion.div
                                    key={page.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center justify-between p-4 rounded-lg border border-border/40 bg-background/50 hover:bg-background/80 transition-colors"
                                  >
                                    <div className="flex items-center gap-3">
                                      {page.picture?.data?.url && (
                                        <img
                                          src={page.picture.data.url}
                                          alt={page.name}
                                          className="w-10 h-10 rounded-lg border-2 border-blue-500/30"
                                        />
                                      )}
                                      <div>
                                        <p className="font-medium">{page.name}</p>
                                        <p className="text-sm text-muted-foreground">Facebook Page</p>
                                        {connectedIg && (
                                          <p className="text-sm text-pink-500">+ @{connectedIg.username}</p>
                                        )}
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={() => selectAccount(page.id, connectedIg?.id)}
                                      className="bg-emerald-500 hover:bg-emerald-600 text-white"
                                    >
                                      Выбрать
                                    </Button>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Instagram аккаунты без страниц */}
                        {filteredInstagrams.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                              <Instagram className="w-4 h-4 text-pink-500" />
                              Instagram аккаунты
                            </h4>
                            <div className="space-y-2">
                              {filteredInstagrams.map((ig) => (
                                <motion.div
                                  key={ig.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="flex items-center justify-between p-4 rounded-lg border border-border/40 bg-background/50 hover:bg-background/80 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    {ig.profile_picture_url && (
                                      <img
                                        src={ig.profile_picture_url}
                                        alt={ig.username}
                                        className="w-10 h-10 rounded-lg border-2 border-pink-500/30"
                                      />
                                    )}
                                    <div>
                                      <p className="font-medium">@{ig.username}</p>
                                      <p className="text-sm text-muted-foreground">Instagram Business</p>
                                      {ig.followers_count && (
                                        <p className="text-sm text-muted-foreground">
                                          {ig.followers_count.toLocaleString('ru-RU')} подписчиков
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => selectAccount('', ig.id)}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                                  >
                                    Выбрать
                                  </Button>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}

                        {filteredPages.length === 0 && filteredInstagrams.length === 0 && !loadingProfiles && (
                          <div className="text-center py-8 text-muted-foreground">
                            <p>Аккаунты не найдены</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            // Состояние: аккаунт выбран
            <div className="space-y-6">
              {/* Выбранный аккаунт */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 backdrop-blur-md border border-emerald-500/30 p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {selectedAccount.page?.picture?.data?.url && (
                        <img
                          src={selectedAccount.page.picture.data.url}
                          alt={selectedAccount.page.name}
                          className="w-16 h-16 rounded-xl border-2 border-white/20 shadow-lg"
                        />
                      )}
                      <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full border-2 border-background flex items-center justify-center">
                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{selectedAccount.page?.name}</h3>
                      <p className="text-sm text-emerald-600 font-medium">Синхронизация активна</p>
                      {selectedAccount.instagram && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Instagram: @{selectedAccount.instagram.username}
                          {selectedAccount.instagram.followers_count && (
                            <span className="ml-2">• {selectedAccount.instagram.followers_count.toLocaleString('ru-RU')} подписчиков</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  <Dialog open={showAccountSelector} onOpenChange={setShowAccountSelector}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Сменить аккаунт
                      </Button>
                    </DialogTrigger>
                    {/* Тот же диалог выбора аккаунтов */}
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
                      <DialogHeader>
                        <DialogTitle>Выберите аккаунт для работы</DialogTitle>
                      </DialogHeader>

                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Поиск по названию..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {loadingProfiles ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            <span className="ml-3">Загрузка аккаунтов...</span>
                          </div>
                        ) : (
                          <>
                            {filteredPages.map((page) => {
                              const connectedIg = availableInstagrams.find(ig => ig.connected_page === page.name);
                              return (
                                <motion.div
                                  key={page.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="flex items-center justify-between p-4 rounded-lg border border-border/40 bg-background/50 hover:bg-background/80 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    {page.picture?.data?.url && (
                                      <img
                                        src={page.picture.data.url}
                                        alt={page.name}
                                        className="w-10 h-10 rounded-lg border-2 border-blue-500/30"
                                      />
                                    )}
                                    <div>
                                      <p className="font-medium">{page.name}</p>
                                      <p className="text-sm text-muted-foreground">Facebook Page</p>
                                      {connectedIg && (
                                        <p className="text-sm text-pink-500">+ @{connectedIg.username}</p>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => selectAccount(page.id, connectedIg?.id)}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                                  >
                                    Выбрать
                                  </Button>
                                </motion.div>
                              );
                            })}
                          </>
                        )}
                      </div>

                      <div className="flex justify-between pt-4 border-t">
                        <Button variant="outline" onClick={clearSelection}>
                          Сбросить выбор
                        </Button>
                        <Button variant="outline" onClick={() => setShowAccountSelector(false)}>
                          Отмена
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </motion.div>

              {/* Кнопки управления */}
              <div className="flex gap-3">
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
                >
                  {loadingProfiles ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Загрузка...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Обновить данные
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  variant="outline"
                  className="border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  {disconnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Отключение...
                    </>
                  ) : (
                    <>
                      <Unlink className="w-4 h-4 mr-2" />
                      Отключить
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Instagram posts section - shows only if account is selected */}
      {hasSelectedAccount && selectedAccount.instagram && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-card/50 backdrop-blur-lg border border-border/50 p-6"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Instagram className="w-5 h-5 text-pink-500" />
            Последние посты Instagram
          </h3>
          <div className="text-center py-8 text-muted-foreground">
            <Instagram className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Загрузка постов...</p>
            <p className="text-sm mt-2">Функционал будет добавлен в следующих обновлениях</p>
          </div>
        </motion.div>
      )}

      {/* Ad account section - shows only if account is selected */}
      {hasSelectedAccount && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-card/50 backdrop-blur-lg border border-border/50 p-6"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Facebook className="w-5 h-5 text-blue-500" />
            Рекламный кабинет
          </h3>
          <div className="text-center py-8 text-muted-foreground">
            <Facebook className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Загрузка рекламных данных...</p>
            <p className="text-sm mt-2">Функционал будет добавлен в следующих обновлениях</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};