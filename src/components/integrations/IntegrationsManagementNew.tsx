import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect, useCallback } from 'react';
import { 
  Facebook, 
  Instagram, 
  Layout, 
  Target, 
  RefreshCw, 
  Settings, 
  CheckCircle2,
  Loader2,
  Video,
  MessageCircle,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface AdAccount {
  id: string;
  name: string;
  account_id: string;
  spend?: number;
}

interface FacebookPage {
  id: string;
  name: string;
  picture?: {
    data?: {
      url?: string;
    };
  };
}

interface InstagramAccount {
  id: string;
  username: string;
  profile_picture_url?: string;
  followers_count?: number;
  page_id?: string;
  page_name?: string;
}

interface ConnectedAccount {
  id: string;
  project_id: string;
  access_token: string;
  name?: string;
  selected_page_id?: string;
  selected_instagram_id?: string;
  selected_page_name?: string;
  selected_instagram_handle?: string;
  ad_account_id?: string | null;
  ad_account_name?: string | null;
  created_at: string;
}

const IntegrationsManagementNew = ({ projectId }: { projectId?: string }) => {
  const [loading, setLoading] = useState(true);
  const [connectedAccount, setConnectedAccount] = useState<ConnectedAccount | null>(null);
  const [selectedPageName, setSelectedPageName] = useState<string>('');
  const [selectedAdAccountName, setSelectedAdAccountName] = useState<string>('');
  const [selectedInstagramHandle, setSelectedInstagramHandle] = useState<string>('');
  const [selectedInstagramFollowers, setSelectedInstagramFollowers] = useState<number>(0);
  const [selectedInstagramAvatar, setSelectedInstagramAvatar] = useState<string>('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'facebook' | 'instagram'>('facebook');
  const [availablePages, setAvailablePages] = useState<FacebookPage[]>([]);
  const [availableAdAccounts, setAvailableAdAccounts] = useState<AdAccount[]>([]);
  const [availableInstagramAccounts, setAvailableInstagramAccounts] = useState<InstagramAccount[]>([]);
  const [modalSelectedPage, setModalSelectedPage] = useState<string>('');
  const [modalSelectedAdAccount, setModalSelectedAdAccount] = useState<string>('');
  const [modalSelectedInstagram, setModalSelectedInstagram] = useState<string>('');
  const [modalLoading, setModalLoading] = useState(false);

  const currentProjectId = projectId || '64c94e87-630c-470e-8ab1-8f7c8c835efa';

  // Fetch connected account from database
  const fetchConnectedAccount = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('ad_accounts')
        .select('*')
        .eq('project_id', currentProjectId)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching account:', error);
        return;
      }

      if (data) {
        setConnectedAccount(data);
        const pageName = (data.selected_page_name ?? '') as string;
        const adName = (data.ad_account_name ?? '') as string;
        const igHandle = (data.selected_instagram_handle ?? '') as string;
        setSelectedPageName(pageName);
        setSelectedAdAccountName(adName);
        setSelectedInstagramHandle(igHandle);

        // Если ad_account_name пустой, но есть ad_account_id и токен — запрос к Facebook API, сохраняем имя
        if (!adName && data.ad_account_id && data.access_token) {
          try {
            const apiRes = await fetch(
              `https://graph.facebook.com/v21.0/${data.ad_account_id}?fields=name&access_token=${data.access_token}`
            );
            if (apiRes.ok) {
              const apiJson = await apiRes.json();
              const name = (apiJson.name ?? '') as string;
              if (name) {
                await supabase
                  .from('ad_accounts')
                  .update({ ad_account_name: name })
                  .eq('id', data.id);
                setSelectedAdAccountName(name);
                setConnectedAccount((prev) => (prev ? { ...prev, ad_account_name: name } : null));
              }
            }
          } catch (err) {
            console.warn('Could not fetch ad account name from Facebook API:', err);
          }
        }

        // Fetch Instagram details if we have an ID
        if (data.selected_instagram_id && data.access_token) {
          try {
            const igResponse = await fetch(
              `https://graph.facebook.com/v21.0/${data.selected_instagram_id}?fields=username,profile_picture_url,followers_count&access_token=${data.access_token}`
            );
            if (igResponse.ok) {
              const igData = await igResponse.json();
              setSelectedInstagramFollowers(igData.followers_count || 0);
              setSelectedInstagramAvatar(igData.profile_picture_url || '');
              if (!(data.selected_instagram_handle ?? '').trim() && (igData.username ?? '')) {
                setSelectedInstagramHandle(`@${String(igData.username)}`);
              }
            }
          } catch (err) {
            console.warn('Could not fetch Instagram details:', err);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching connected account:', error);
    } finally {
      setLoading(false);
    }
  }, [currentProjectId]);

  // Fetch available resources for modal
  const fetchAvailableResources = useCallback(async (type: 'facebook' | 'instagram') => {
    if (!connectedAccount?.access_token) {
      toast.error('Токен доступа не найден');
      return;
    }

    setModalLoading(true);
    try {
      if (type === 'facebook') {
        // Fetch Facebook Pages
        const pagesResponse = await fetch(
          `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,picture&access_token=${connectedAccount.access_token}`
        );

        if (pagesResponse.ok) {
          const pagesData = await pagesResponse.json();
          setAvailablePages(pagesData.data || []);
        }

        // Fetch Ad Accounts
        const adAccountsResponse = await fetch(
          `https://graph.facebook.com/v21.0/me/adaccounts?fields=id,name,account_id&access_token=${connectedAccount.access_token}`
        );

        if (adAccountsResponse.ok) {
          const adAccountsData = await adAccountsResponse.json();
          setAvailableAdAccounts(adAccountsData.data || []);
        }
      } else if (type === 'instagram') {
        // Fetch Facebook Pages with Instagram accounts
        const pagesResponse = await fetch(
          `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,picture,instagram_business_account&access_token=${connectedAccount.access_token}`
        );

        if (pagesResponse.ok) {
          const pagesData = await pagesResponse.json();
          // Filter only pages with Instagram accounts
          const pagesWithIG = pagesData.data?.filter((page: FacebookPage & { instagram_business_account?: { id: string } }) => 
            page.instagram_business_account
          ) || [];
          
          // Fetch Instagram accounts from pages
          const igAccounts: InstagramAccount[] = [];
          for (const page of pagesWithIG) {
            if (page.instagram_business_account) {
              const igId = page.instagram_business_account.id;
              try {
                const igResponse = await fetch(
                  `https://graph.facebook.com/v21.0/${igId}?fields=id,username,profile_picture_url,followers_count&access_token=${connectedAccount.access_token}`
                );
                if (igResponse.ok) {
                  const igData = await igResponse.json();
                  igAccounts.push({
                    ...igData,
                    page_id: page.id, // Store page ID for reference
                    page_name: page.name // Store page name
                  });
                }
              } catch (err) {
                console.warn('Could not fetch Instagram account:', igId);
              }
            }
          }
          setAvailableInstagramAccounts(igAccounts);
        }
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Ошибка загрузки ресурсов');
    } finally {
      setModalLoading(false);
    }
  }, [connectedAccount]);

  useEffect(() => {
    fetchConnectedAccount();
  }, [fetchConnectedAccount]);

  const handleOpenModal = async (type: 'facebook' | 'instagram') => {
    setModalType(type);
    setIsModalOpen(true);
    await fetchAvailableResources(type);
    
    // Pre-select current values
    if (connectedAccount) {
      if (type === 'facebook') {
        setModalSelectedPage(connectedAccount.selected_page_id ?? '');
        setModalSelectedAdAccount(connectedAccount.ad_account_id ?? '');
      } else {
        setModalSelectedInstagram(connectedAccount.selected_instagram_id ?? '');
      }
    }
  };

  const handleSaveModal = async () => {
    if (!connectedAccount) return;

    try {
      let updateData: Record<string, unknown> = {
        id: connectedAccount.id,
        project_id: connectedAccount.project_id,
        access_token: connectedAccount.access_token,
        platform: 'facebook', // ОБЯЗАТЕЛЬНО добавляем platform
      };

      if (modalType === 'facebook') {
        const selectedPage = availablePages.find(p => p.id === modalSelectedPage);
        const selectedAdAccount = availableAdAccounts.find(a => a.id === modalSelectedAdAccount);

        updateData = {
          ...updateData,
          selected_page_id: modalSelectedPage || null,
          selected_page_name: (selectedPage?.name ?? null) as string | null,
          ad_account_id: (selectedAdAccount?.id ?? null) as string | null,
          ad_account_name: (selectedAdAccount?.name ?? null) as string | null,
          selected_instagram_id: connectedAccount.selected_instagram_id ?? null,
          selected_instagram_handle: connectedAccount.selected_instagram_handle ?? null,
        };
      } else if (modalType === 'instagram') {
        const selectedInstagram = availableInstagramAccounts.find(i => i.id === modalSelectedInstagram);

        updateData = {
          ...updateData,
          selected_instagram_id: modalSelectedInstagram || null,
          selected_instagram_handle: selectedInstagram?.username ? `@${selectedInstagram.username}` : null,
          selected_page_id: connectedAccount.selected_page_id ?? null,
          selected_page_name: connectedAccount.selected_page_name ?? null,
          ad_account_id: connectedAccount.ad_account_id ?? null,
          ad_account_name: connectedAccount.ad_account_name ?? null,
        };
      }

      const { error } = await supabase
        .from('ad_accounts')
        .upsert(updateData, { onConflict: 'id' });

      if (error) throw error;

      toast.success('Настройки сохранены');
      setIsModalOpen(false);
      await fetchConnectedAccount();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Ошибка сохранения настроек');
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await fetchConnectedAccount();
    toast.success('Данные обновлены');
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#020617] p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground dark:text-foreground">Интеграции</h1>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">Управление подключенными сервисами</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          className="bg-white/80 dark:bg-white/5 backdrop-blur-sm border-white/10 dark:border-white/10"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Обновить
        </Button>
      </div>

      {/* Top Section: Two Premium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Facebook Marketing Card */}
        <Card className={cn(
          "bg-slate-50 dark:bg-white/5 backdrop-blur-[16px] border-white/10 dark:border-white/10",
          "shadow-sm dark:shadow-lg"
        )}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Facebook className="w-5 h-5 text-blue-500" />
              </div>
              Facebook Marketing
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!(selectedPageName || selectedAdAccountName) ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Подключите Facebook для синхронизации рекламных данных
                </p>
                <Button 
                  onClick={() => handleOpenModal('facebook')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Настроить подключение
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  {selectedPageName ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
                      <Layout className="w-5 h-5 text-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{selectedPageName}</p>
                        <p className="text-xs text-muted-foreground">Страница</p>
                      </div>
                    </div>
                  ) : null}
                  {selectedAdAccountName ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
                      <Target className="w-5 h-5 text-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{selectedAdAccountName}</p>
                        <p className="text-xs text-muted-foreground">Рекламный кабинет</p>
                      </div>
                    </div>
                  ) : null}
                </div>
                <Button 
                  variant="outline"
                  onClick={() => handleOpenModal('facebook')}
                  className="w-full"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Изменить
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instagram Business Card */}
        <Card className={cn(
          "bg-slate-50 dark:bg-white/5 backdrop-blur-[16px] border-white/10 dark:border-white/10",
          "shadow-sm dark:shadow-lg"
        )}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <Instagram className="w-5 h-5 text-purple-500" />
              </div>
              Instagram Business
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedInstagramHandle ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Подключите Instagram для синхронизации контента
                </p>
                <Button 
                  onClick={() => handleOpenModal('instagram')}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Настроить подключение
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {(selectedInstagramAvatar ?? '') ? (
                    <img 
                      src={selectedInstagramAvatar} 
                      alt={selectedInstagramHandle ?? ''}
                      className="w-16 h-16 rounded-full border-2 border-border"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Instagram className="w-8 h-8 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-foreground">{selectedInstagramHandle ?? '—'}</p>
                    {(selectedInstagramFollowers ?? 0) > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {selectedInstagramFollowers.toLocaleString('ru-RU')} подписчиков
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    Синхронизация Reels активна
                  </span>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => handleOpenModal('instagram')}
                  className="w-full"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Изменить
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Grid of 4 Compact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            id: 'google', 
            name: 'Google Ads', 
            icon: <Target className="w-5 h-5" />,
            color: 'from-blue-500/20 to-blue-600/20',
            iconColor: 'text-blue-500'
          },
          { 
            id: 'tiktok', 
            name: 'TikTok Ads', 
            icon: <Video className="w-5 h-5" />,
            color: 'from-black/20 to-gray-800/20',
            iconColor: 'text-foreground'
          },
          { 
            id: 'whatsapp', 
            name: 'WhatsApp', 
            icon: <MessageCircle className="w-5 h-5" />,
            color: 'from-green-500/20 to-emerald-600/20',
            iconColor: 'text-green-500'
          },
          { 
            id: 'telegram', 
            name: 'Telegram', 
            icon: <Send className="w-5 h-5" />,
            color: 'from-blue-400/20 to-cyan-500/20',
            iconColor: 'text-blue-400'
          }
        ].map((integration) => (
          <motion.div
            key={integration.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className={cn(
              "bg-slate-50 dark:bg-white/5 backdrop-blur-[16px] border-white/10 dark:border-white/10",
              "shadow-sm dark:shadow-lg hover:shadow-md transition-shadow"
            )}>
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={cn(
                    "w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center",
                    integration.color
                  )}>
                    <div className={integration.iconColor}>
                      {integration.icon}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{integration.name}</p>
                    <Badge 
                      variant="secondary" 
                      className="mt-2 bg-muted text-muted-foreground"
                    >
                      Настроить
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Modal: Resource Selection */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] bg-white dark:bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground dark:text-foreground">
              {modalType === 'facebook' ? 'Выбор ресурсов Facebook' : 'Выбор Instagram профиля'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground dark:text-muted-foreground">
              {modalType === 'facebook' 
                ? 'Выберите рекламный кабинет и страницу для подключения'
                : 'Выберите Instagram профиль для подключения'}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {modalType === 'facebook' ? (
                <>
                  {/* Ad Accounts Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground dark:text-foreground mb-3">Выберите рекламный кабинет</h3>
                    <div className="space-y-2">
                      {modalLoading ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        </div>
                      ) : availableAdAccounts.length === 0 ? (
                        <p className="text-sm text-muted-foreground dark:text-muted-foreground">Нет доступных рекламных кабинетов</p>
                      ) : (
                        availableAdAccounts.map((account) => (
                          <button
                            key={account.id}
                            onClick={() => setModalSelectedAdAccount(account.id)}
                            className={cn(
                              "w-full text-left p-3 rounded-lg border transition-all",
                              modalSelectedAdAccount === account.id
                                ? "bg-primary/10 border-primary text-foreground dark:text-foreground"
                                : "bg-background/50 dark:bg-background/50 border-border/50 hover:bg-background dark:hover:bg-background text-foreground dark:text-foreground"
                            )}
                          >
                            <p className="text-sm font-medium">{account.name ?? '—'}</p>
                            <p className="text-xs text-muted-foreground dark:text-muted-foreground">{account.account_id ?? '—'}</p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Pages Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground dark:text-foreground mb-3">Выберите страницу</h3>
                    <div className="space-y-2">
                      {availablePages.length === 0 ? (
                        <p className="text-sm text-muted-foreground dark:text-muted-foreground">Нет доступных страниц</p>
                      ) : (
                        availablePages.map((page) => (
                          <button
                            key={page.id}
                            onClick={() => setModalSelectedPage(page.id)}
                            className={cn(
                              "w-full text-left p-3 rounded-lg border transition-all",
                              modalSelectedPage === page.id
                                ? "bg-primary/10 border-primary text-foreground dark:text-foreground"
                                : "bg-background/50 dark:bg-background/50 border-border/50 hover:bg-background dark:hover:bg-background text-foreground dark:text-foreground"
                            )}
                          >
                            <p className="text-sm font-medium">{page.name ?? '—'}</p>
                            <p className="text-xs text-muted-foreground dark:text-muted-foreground">Страница Facebook</p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* Instagram Section - только профили с instagram_business_account */
                <div>
                  <h3 className="text-sm font-semibold text-foreground dark:text-foreground mb-3">Выберите Instagram профиль</h3>
                  <div className="space-y-2">
                    {modalLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      </div>
                    ) : availableInstagramAccounts.length === 0 ? (
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground">Нет доступных Instagram профилей</p>
                    ) : (
                      availableInstagramAccounts.map((account) => (
                        <button
                          key={account.id}
                          onClick={() => setModalSelectedInstagram(account.id)}
                          className={cn(
                            "w-full text-left p-3 rounded-lg border transition-all",
                            modalSelectedInstagram === account.id
                              ? "bg-primary/10 border-primary text-foreground dark:text-foreground"
                              : "bg-background/50 dark:bg-background/50 border-border/50 hover:bg-background dark:hover:bg-background text-foreground dark:text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            {(account.profile_picture_url ?? '') ? (
                              <img 
                                src={account.profile_picture_url!} 
                                alt={account.username ?? ''}
                                className="w-10 h-10 rounded-full"
                              />
                            ) : null}
                            <div>
                              <p className="text-sm font-medium">@{account.username ?? '—'}</p>
                              {(account.followers_count != null && account.followers_count > 0) && (
                                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                                  {Number(account.followers_count).toLocaleString('ru-RU')} подписчиков
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveModal}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IntegrationsManagementNew;
