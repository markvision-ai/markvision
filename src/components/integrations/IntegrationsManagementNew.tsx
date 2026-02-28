import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect, useCallback, useRef } from 'react';
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
  Send,
  Zap,
  Globe,
  Lock,
  ExternalLink,
  ChevronRight,
  Info,
  Check,
  Save
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
import { AutomationPage } from '../automation/AutomationPage';

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

const IntegrationsManagementNew = ({ projectId }: { projectId: string | null }) => {
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
  const abortControllerRef = useRef<AbortController | null>(null);

  // Automation Modal
  const [isAutomationOpen, setIsAutomationOpen] = useState(false);

  const currentProjectId = projectId;

  // Fetch connected account from database
  const fetchConnectedAccount = useCallback(async () => {
    if (!currentProjectId) {
      setConnectedAccount(null);
      setLoading(false);
      return;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const { data, error } = await supabase
        .from('ad_accounts')
        .select('*')
        .eq('project_id', currentProjectId)
        .limit(1)
        .abortSignal(signal)
        .single();

      if (error && error.code !== 'PGRST116') {
        if (error.message?.includes('AbortError')) return;
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
              `https://graph.facebook.com/v21.0/${data.ad_account_id}?fields=name&access_token=${data.access_token}`,
              { signal }
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
          } catch (err: any) {
            if (err.name !== 'AbortError') {
              console.warn('Could not fetch ad account name from Facebook API:', err);
            }
          }
        }

        // Fetch Instagram details if we have an ID
        if (data.selected_instagram_id && data.access_token) {
          try {
            const igResponse = await fetch(
              `https://graph.facebook.com/v21.0/${data.selected_instagram_id}?fields=username,profile_picture_url,followers_count&access_token=${data.access_token}`,
              { signal }
            );
            if (igResponse.ok) {
              const igData = await igResponse.json();
              setSelectedInstagramFollowers(igData.followers_count || 0);
              setSelectedInstagramAvatar(igData.profile_picture_url || '');
              if (!(data.selected_instagram_handle ?? '').trim() && (igData.username ?? '')) {
                setSelectedInstagramHandle(`@${String(igData.username)}`);
              }
            }
          } catch (err: any) {
            if (err.name !== 'AbortError') {
              console.warn('Could not fetch Instagram details:', err);
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('AbortError')) return;
      console.error('Error fetching connected account:', error);
    } finally {
      setLoading(false);
    }
  }, [currentProjectId]);

  // Fetch available resources for modal
  const fetchAvailableResources = useCallback(async (type: 'facebook' | 'instagram') => {
    if (!currentProjectId) {
      toast.error('Выберите проект');
      return;
    }
    if (!connectedAccount?.access_token) {
      toast.error('Токен доступа не найден');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setModalLoading(true);
    try {
      if (type === 'facebook') {
        // Fetch Facebook Pages
        const pagesResponse = await fetch(
          `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,picture&access_token=${connectedAccount.access_token}`,
          { signal }
        );

        if (pagesResponse.ok) {
          const pagesData = await pagesResponse.json();
          setAvailablePages(pagesData.data || []);
        }

        // Fetch Ad Accounts
        const adAccountsResponse = await fetch(
          `https://graph.facebook.com/v21.0/me/adaccounts?fields=id,name,account_id&access_token=${connectedAccount.access_token}`,
          { signal }
        );

        if (adAccountsResponse.ok) {
          const adAccountsData = await adAccountsResponse.json();
          setAvailableAdAccounts(adAccountsData.data || []);
        }
      } else if (type === 'instagram') {
        // Fetch Facebook Pages with Instagram accounts
        const pagesResponse = await fetch(
          `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,picture,instagram_business_account&access_token=${connectedAccount.access_token}`,
          { signal }
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
                  `https://graph.facebook.com/v21.0/${igId}?fields=id,username,profile_picture_url,followers_count&access_token=${connectedAccount.access_token}`,
                  { signal }
                );
                if (igResponse.ok) {
                  const igData = await igResponse.json();
                  igAccounts.push({
                    ...igData,
                    page_id: page.id, // Store page ID for reference
                    page_name: page.name // Store page name
                  });
                }
              } catch (err: any) {
                if (err.name !== 'AbortError') {
                  console.warn('Could not fetch Instagram account:', igId);
                }
              }
            }
          }
          setAvailableInstagramAccounts(igAccounts);
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error fetching resources:', error);
      toast.error('Ошибка загрузки ресурсов');
    } finally {
      setModalLoading(false);
    }
  }, [connectedAccount, currentProjectId]);

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
      let updateData: any = {
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

  if (!currentProjectId) {
    return (
      <div className="flex items-center justify-center p-16 text-muted-foreground">
        Выберите проект, чтобы настроить подключение Meta.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            Интеграции
          </h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Управление внешними сервисами и маркетинговыми платформами
          </p>
        </div>
        <Button
          variant="outline"
          size="lg"
          onClick={handleRefresh}
          className="bg-white/5 border-slate-200 hover:bg-white/10 text-white rounded-xl backdrop-blur-xl transition-all duration-300 group"
        >
          <RefreshCw className={cn("w-4 h-4 mr-2 transition-transform duration-500", loading && "animate-spin")} />
          Обновить данные
        </Button>
      </div>

      {/* Top Section: Two Premium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Facebook Marketing Card */}
        <div className="bg-white/10 backdrop-blur-3xl border border-white/60 shadow-xl border border-white/5 p-8 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none -mr-24 -mt-24 group-hover:bg-blue-500/20 transition-colors duration-500" />

          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center ring-1 ring-blue-500/30">
                <Facebook className="w-7 h-7 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-white">Facebook Marketing</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full pulse-emerald",
                    (selectedPageName || selectedAdAccountName) ? "bg-blue-500" : "bg-white/20"
                  )} />
                  <span className="text-xs text-muted-foreground">
                    {(selectedPageName || selectedAdAccountName) ? 'Активно' : 'Ожидает настройки'}
                  </span>
                </div>
              </div>
            </div>
            {(selectedPageName || selectedAdAccountName) && (
              <Badge variant="outline" className="bg-blue-500/10 border-blue-500/20 text-blue-500 px-3 py-1">
                Connected
              </Badge>
            )}
          </div>

          {!(selectedPageName || selectedAdAccountName) ? (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Интеграция позволит автоматически импортировать расходы, показы и клики из ваших рекламных кампаний для сквозной аналитики.
              </p>
              <Button
                onClick={() => handleOpenModal('facebook')}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-2xl shadow-blue-900/5 shadow-blue-600/20 transition-all active:scale-[0.98]"
              >
                <Settings className="w-4 h-4 mr-2" />
                Настроить подключение
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-3">
                {selectedPageName ? (
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-slate-200 group/item hover:border-blue-500/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <Layout className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Страница</p>
                        <p className="text-sm font-semibold text-white">{selectedPageName}</p>
                      </div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  </div>
                ) : null}
                {selectedAdAccountName ? (
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-slate-200 group/item hover:border-blue-500/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <Target className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Рекламный кабинет</p>
                        <p className="text-sm font-semibold text-white">{selectedAdAccountName}</p>
                      </div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  </div>
                ) : null}
              </div>
              <Button
                variant="outline"
                onClick={() => handleOpenModal('facebook')}
                className="w-full h-12 bg-white/5 border-slate-200 hover:bg-white/10 text-white rounded-xl transition-all"
              >
                <Settings className="w-4 h-4 mr-2" />
                Версия настроек
              </Button>
            </div>
          )}
        </div>

        {/* Instagram Business Card */}
        <div className="bg-white/10 backdrop-blur-3xl border border-white/60 shadow-xl border border-white/5 p-8 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none -mr-24 -mt-24 group-hover:bg-purple-500/20 transition-colors duration-500" />

          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center ring-1 ring-purple-500/30">
                <Instagram className="w-7 h-7 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-white">Instagram Business</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full pulse-emerald",
                    selectedInstagramHandle ? "bg-blue-500" : "bg-white/20"
                  )} />
                  <span className="text-xs text-muted-foreground">
                    {selectedInstagramHandle ? 'Синхронизация Reels' : 'Ожидает настройки'}
                  </span>
                </div>
              </div>
            </div>
            {selectedInstagramHandle && (
              <Badge variant="outline" className="bg-purple-500/10 border-purple-500/20 text-purple-400 px-3 py-1">
                Synced
              </Badge>
            )}
          </div>

          {!selectedInstagramHandle ? (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Синхронизация контента, комментариев и статистики вовлеченности для вашего Instagram аккаунта.
              </p>
              <Button
                onClick={() => handleOpenModal('instagram')}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl shadow-2xl shadow-blue-900/5 shadow-purple-600/20 transition-all active:scale-[0.98]"
              >
                <Settings className="w-4 h-4 mr-2" />
                Настроить подключение
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-5 p-4 rounded-2xl bg-white/5 border border-slate-200 group-hover:border-purple-500/30 transition-colors">
                <div className="relative">
                  {(selectedInstagramAvatar ?? '') ? (
                    <img
                      src={selectedInstagramAvatar}
                      alt={selectedInstagramHandle ?? ''}
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-purple-500/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Instagram className="w-8 h-8 text-white" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-500 border-2 border-black flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-lg font-bold text-white leading-tight">{selectedInstagramHandle ?? '—'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wider font-semibold">
                    {selectedInstagramFollowers.toLocaleString('ru-RU')} подписчиков
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-xs font-medium text-blue-400">
                  Автоматическая публикация Reels готова
                </span>
              </div>

              <Button
                variant="outline"
                onClick={() => handleOpenModal('instagram')}
                className="w-full h-12 bg-white/5 border-slate-200 hover:bg-white/10 text-white rounded-xl transition-all"
              >
                <Settings className="w-4 h-4 mr-2" />
                Изменить аккаунт
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Grid Section Title */}
      <div className="flex items-center gap-3 pt-4">
        <h2 className="text-xl font-bold text-white">Другие платформы</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
      </div>

      {/* Grid Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            id: 'automation',
            name: 'Сценарии n8n',
            status: 'Активно',
            icon: <Zap className="w-5 h-5" />,
            color: 'from-orange-500/20 to-red-600/20',
            border: 'border-orange-500/30',
            iconColor: 'text-orange-500',
            action: () => setIsAutomationOpen(true)
          },
          {
            id: 'google',
            name: 'Google Ads',
            status: 'Setup',
            icon: <Target className="w-5 h-5" />,
            color: 'from-blue-500/20 to-blue-600/20',
            border: 'border-blue-500/30',
            iconColor: 'text-blue-500'
          },
          {
            id: 'tiktok',
            name: 'TikTok Ads',
            status: 'Coming Soon',
            icon: <Video className="w-5 h-5" />,
            color: 'from-gray-500/10 to-black/30',
            border: 'border-white/5',
            iconColor: 'text-slate-600'
          },
          {
            id: 'whatsapp',
            name: 'WhatsApp Business',
            status: 'Setup',
            icon: <MessageCircle className="w-5 h-5" />,
            color: 'from-green-500/20 to-blue-600/20',
            border: 'border-green-500/30',
            iconColor: 'text-green-500'
          },
          {
            id: 'telegram',
            name: 'Telegram Bot',
            status: 'Активно',
            icon: <Send className="w-5 h-5" />,
            color: 'from-blue-400/20 to-cyan-500/20',
            border: 'border-blue-400/30',
            iconColor: 'text-blue-400'
          }
        ].map((integration) => (
          <motion.div
            key={integration.id}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.2 }}
            className="group"
          >
            <div
              className={cn(
                "bg-white/10 backdrop-blur-3xl border border-white/60 shadow-xl border border-white/5 p-6 rounded-3xl h-full",
                "hover:border-slate-200 transition-all duration-300 relative",
                integration.action && "cursor-pointer"
              )}
              onClick={integration.action}
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className={cn(
                  "w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center ring-1 ring-white/10 shadow-inner",
                  integration.color
                )}>
                  <div className={cn("transition-transform duration-500 group-hover:scale-110", integration.iconColor)}>
                    {integration.icon}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-base font-bold text-white group-hover:text-primary transition-colors">{integration.name}</p>
                  <div className="flex items-center justify-center">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-md",
                        integration.status === 'Coming Soon' ? "bg-white/5 text-slate-500" : "bg-primary/20 text-primary border border-primary/20"
                      )}
                    >
                      {integration.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-3 h-3 text-white/20" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Automation Modal */}
      <Dialog open={isAutomationOpen} onOpenChange={setIsAutomationOpen}>
        <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] overflow-hidden p-0 bg-black/90 backdrop-blur-3xl border-white/5 shadow-2xl rounded-3xl">
          <div className="h-full flex flex-col">
            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div>
                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-orange-500" />
                  </div>
                  Управление автоматизациями (n8n)
                </DialogTitle>
                <DialogDescription className="text-muted-foreground mt-1">
                  Настройка сквозных сценариев и обработки данных
                </DialogDescription>
              </div>
              <Button variant="outline" size="icon" onClick={() => setIsAutomationOpen(false)} className="rounded-full bg-white/5 border-slate-200 hover:bg-white/10">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <AutomationPage projectId={currentProjectId} />
            </div>

            <div className="p-6 border-t border-white/5 bg-black/40 backdrop-blur-md flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsAutomationOpen(false)} className="bg-white/5 border-slate-200 hover:bg-white/10 text-white min-w-[120px]">
                Закрыть
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Resource Selection */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl bg-black/90 backdrop-blur-3xl border-white/5 shadow-2xl rounded-3xl p-0 overflow-hidden">
          <div className="p-8 border-b border-white/5 bg-white/5 flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-900/5",
              modalType === 'facebook' ? "bg-blue-600/20 text-blue-500" : "bg-purple-600/20 text-purple-400"
            )}>
              {modalType === 'facebook' ? <Facebook className="w-6 h-6" /> : <Instagram className="w-6 h-6" />}
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white">
                {modalType === 'facebook' ? 'Выбор ресурсов Facebook' : 'Выбор Instagram профиля'}
              </DialogTitle>
              <DialogDescription className="text-slate-500">
                {modalType === 'facebook'
                  ? 'Выберите рекламный кабинет и бизнес-страницу'
                  : 'Подключите ваш бизнес-аккаунт Instagram'}
              </DialogDescription>
            </div>
          </div>

          <ScrollArea className="max-h-[60vh] p-8 custom-scrollbar">
            <div className="space-y-10">
              {modalType === 'facebook' ? (
                <>
                  {/* Ad Accounts Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Рекламный кабинет</h3>
                    </div>
                    <div className="grid gap-2">
                      {modalLoading ? (
                        <div className="flex justify-center py-12">
                          <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
                        </div>
                      ) : availableAdAccounts.length === 0 ? (
                        <div className="p-12 text-center rounded-2xl bg-white/5 border border-dashed border-slate-200">
                          <Info className="w-8 h-8 mx-auto text-white/10 mb-3" />
                          <p className="text-sm text-muted-foreground">Доступные кабинеты не найдены</p>
                        </div>
                      ) : (
                        availableAdAccounts.map((account) => (
                          <button
                            key={account.id}
                            onClick={() => setModalSelectedAdAccount(account.id)}
                            className={cn(
                              "w-full text-left p-4 rounded-2xl border transition-all duration-300 relative group",
                              modalSelectedAdAccount === account.id
                                ? "bg-primary/20 border-primary shadow-[0_0_20px_rgba(var(--primary),0.1)]"
                                : "bg-white/5 border-white/5 hover:border-slate-200"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                  modalSelectedAdAccount === account.id ? "bg-primary/20 text-primary" : "bg-white/5 text-white/20"
                                )}>
                                  <Target className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="font-bold text-white">{account.name ?? '—'}</p>
                                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-0.5">ID: {account.account_id ?? '—'}</p>
                                </div>
                              </div>
                              {modalSelectedAdAccount === account.id && <Check className="w-4 h-4 text-primary" />}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Pages Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Layout className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Бизнес-страница</h3>
                    </div>
                    <div className="grid gap-2">
                      {availablePages.length === 0 && !modalLoading ? (
                        <div className="p-12 text-center rounded-2xl bg-white/5 border border-dashed border-slate-200">
                          <Info className="w-8 h-8 mx-auto text-white/10 mb-3" />
                          <p className="text-sm text-muted-foreground">Доступные страницы не найдены</p>
                        </div>
                      ) : (
                        availablePages.map((page) => (
                          <button
                            key={page.id}
                            onClick={() => setModalSelectedPage(page.id)}
                            className={cn(
                              "w-full text-left p-4 rounded-2xl border transition-all duration-300 relative group",
                              modalSelectedPage === page.id
                                ? "bg-primary/20 border-primary shadow-[0_0_20px_rgba(var(--primary),0.1)]"
                                : "bg-white/5 border-white/5 hover:border-slate-200"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                  modalSelectedPage === page.id ? "bg-primary/20 text-primary" : "bg-white/5 text-white/20"
                                )}>
                                  <Globe className="w-5 h-5" />
                                </div>
                                <p className="font-bold text-white">{page.name ?? '—'}</p>
                              </div>
                              {modalSelectedPage === page.id && <Check className="w-4 h-4 text-primary" />}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* Instagram Section */
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Аккаунт Instagram</h3>
                  </div>
                  <div className="grid gap-3">
                    {modalLoading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
                      </div>
                    ) : availableInstagramAccounts.length === 0 ? (
                      <div className="p-12 text-center rounded-2xl bg-white/5 border border-dashed border-slate-200">
                        <Info className="w-8 h-8 mx-auto text-white/10 mb-3" />
                        <p className="text-sm text-muted-foreground">Бизнес-аккаунты не найдены</p>
                        <p className="text-[10px] text-white/30 mt-2">Убедитесь, что ваш Instagram привязан к Facebook странице</p>
                      </div>
                    ) : (
                      availableInstagramAccounts.map((account) => (
                        <button
                          key={account.id}
                          onClick={() => setModalSelectedInstagram(account.id)}
                          className={cn(
                            "w-full text-left p-4 rounded-2xl border transition-all duration-300 relative group",
                            modalSelectedInstagram === account.id
                              ? "bg-purple-500/20 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.1)]"
                              : "bg-white/5 border-white/5 hover:border-slate-200"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                {(account.profile_picture_url ?? '') ? (
                                  <img
                                    src={account.profile_picture_url!}
                                    alt={account.username ?? ''}
                                    className="w-12 h-12 rounded-xl object-cover"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                    <Instagram className="w-6 h-6 text-purple-400" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-white">@{account.username ?? '—'}</p>
                                {(account.followers_count != null && account.followers_count > 0) && (
                                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-0.5">
                                    {Number(account.followers_count).toLocaleString('ru-RU')} Followers
                                  </p>
                                )}
                              </div>
                            </div>
                            {modalSelectedInstagram === account.id && <Check className="w-4 h-4 text-purple-400" />}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-8 border-t border-white/5 bg-black/40 backdrop-blur-md flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="bg-white/5 border-slate-200 hover:bg-white/10 text-white min-w-[120px] rounded-xl">
              Отмена
            </Button>
            <Button onClick={handleSaveModal} className="bg-primary hover:bg-primary/90 text-white min-w-[150px] rounded-xl shadow-2xl shadow-blue-900/5 shadow-primary/20">
              <Save className="w-4 h-4 mr-2" />
              Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IntegrationsManagementNew;
