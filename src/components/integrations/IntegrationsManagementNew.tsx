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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-8 py-2">
        <div>
          <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 uppercase tracking-tight">
            Интеграции
          </h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2 text-[10px] uppercase font-black tracking-widest opacity-60">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Управление внешними сервисами и маркетинговыми платформами
          </p>
        </div>

        <Button
          variant="outline"
          size="lg"
          onClick={handleRefresh}
          className="h-14 bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-2xl backdrop-blur-3xl transition-all duration-300 group px-8 font-black uppercase tracking-widest text-[10px] gap-3"
        >
          <RefreshCw className={cn("w-4 h-4 transition-transform duration-500", loading && "animate-spin")} />
          Обновить данные
        </Button>
      </div>

      {/* Top Section: Two Premium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Facebook Marketing Card */}
        <div className="bg-[#020617]/40 backdrop-blur-3xl border border-white/10 shadow-interstellar p-10 rounded-[32px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none -mr-32 -mt-32 group-hover:bg-blue-500/20 transition-colors duration-700" />

          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/20 shadow-inner group-hover:scale-105 transition-transform duration-500">
                <Facebook className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-white uppercase tracking-tight">Facebook</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    (selectedPageName || selectedAdAccountName) ? "bg-blue-500 animate-pulse" : "bg-white/20"
                  )} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                    {(selectedPageName || selectedAdAccountName) ? 'Активно' : 'Ожидает настройки'}
                  </span>
                </div>
              </div>
            </div>
            {(selectedPageName || selectedAdAccountName) && (
              <Badge className="bg-blue-500/20 border-blue-500/20 text-blue-400 px-4 py-1.5 rounded-xl font-black uppercase tracking-tighter text-[10px] border">
                CONNECTED
              </Badge>
            )}
          </div>

          {!(selectedPageName || selectedAdAccountName) ? (
            <div className="space-y-8">
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground leading-relaxed opacity-60">
                Интеграция позволит автоматически импортировать расходы, показы и клики из ваших рекламных кампаний для сквозной аналитики.
              </p>
              <Button
                onClick={() => handleOpenModal('facebook')}
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] font-black uppercase tracking-widest text-[10px] gap-3"
              >
                <Settings className="w-4 h-4" />
                Настроить подключение
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid gap-4">
                {selectedPageName ? (
                  <div className="flex items-center justify-between p-5 rounded-[24px] bg-white/5 border border-white/5 group/item hover:border-blue-500/30 transition-all hover:bg-white/10 duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover/item:scale-110 transition-transform">
                        <Layout className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Страница</p>
                        <p className="text-sm font-black text-white uppercase tracking-tight mt-0.5">{selectedPageName}</p>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/20">
                      <Check className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                  </div>
                ) : null}
                {selectedAdAccountName ? (
                  <div className="flex items-center justify-between p-5 rounded-[24px] bg-white/5 border border-white/5 group/item hover:border-blue-500/30 transition-all hover:bg-white/10 duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover/item:scale-110 transition-transform">
                        <Target className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Рекламный кабинет</p>
                        <p className="text-sm font-black text-white uppercase tracking-tight mt-0.5">{selectedAdAccountName}</p>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/20">
                      <Check className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                  </div>
                ) : null}
              </div>
              <Button
                variant="outline"
                onClick={() => handleOpenModal('facebook')}
                className="w-full h-14 bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-2xl transition-all font-black uppercase tracking-widest text-[10px] gap-3"
              >
                <Settings className="w-4 h-4" />
                Версия настроек
              </Button>
            </div>
          )}
        </div>

        {/* Instagram Business Card */}
        <div className="bg-[#020617]/40 backdrop-blur-3xl border border-white/10 shadow-interstellar p-10 rounded-[32px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none -mr-32 -mt-32 group-hover:bg-purple-500/20 transition-colors duration-700" />

          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/20 shadow-inner group-hover:scale-105 transition-transform duration-500">
                <Instagram className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-white uppercase tracking-tight">Instagram</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    selectedInstagramHandle ? "bg-blue-500 animate-pulse" : "bg-white/20"
                  )} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                    {selectedInstagramHandle ? 'Синхронизация Reels' : 'Ожидает настройки'}
                  </span>
                </div>
              </div>
            </div>
            {selectedInstagramHandle && (
              <Badge className="bg-purple-500/20 border-purple-500/20 text-purple-400 px-4 py-1.5 rounded-xl font-black uppercase tracking-tighter text-[10px] border">
                SYNCED
              </Badge>
            )}
          </div>

          {!selectedInstagramHandle ? (
            <div className="space-y-8">
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground leading-relaxed opacity-60">
                Синхронизация контента, комментариев и статистики вовлеченности для вашего Instagram аккаунта.
              </p>
              <Button
                onClick={() => handleOpenModal('instagram')}
                className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] font-black uppercase tracking-widest text-[10px] gap-3"
              >
                <Settings className="w-4 h-4" />
                Настроить подключение
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center gap-6 p-6 rounded-[24px] bg-white/5 border border-white/5 group-hover:border-purple-500/20 transition-all hover:bg-white/10 duration-500">
                <div className="relative">
                  {(selectedInstagramAvatar ?? '') ? (
                    <img
                      src={selectedInstagramAvatar}
                      alt={selectedInstagramHandle ?? ''}
                      className="w-16 h-16 rounded-[20px] object-cover ring-2 ring-purple-500/20 shadow-interstellar transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-105 transition-transform duration-500 shadow-interstellar">
                      <Instagram className="w-8 h-8 text-white" />
                    </div>
                  )}
                  <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-blue-500 border-4 border-[#020617] flex items-center justify-center shadow-lg">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-xl font-black text-white uppercase tracking-tight leading-none">{selectedInstagramHandle ?? '—'}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2 opacity-60 leading-none">
                    {selectedInstagramFollowers.toLocaleString('ru-RU')} подписчиков
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400/80 leading-relaxed">
                  Автоматическая публикация Reels готова
                </span>
              </div>

              <Button
                variant="outline"
                onClick={() => handleOpenModal('instagram')}
                className="w-full h-14 bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-2xl transition-all font-black uppercase tracking-widest text-[10px] gap-3"
              >
                <Settings className="w-4 h-4" />
                Изменить аккаунт
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Grid Section Title */}
      <div className="flex items-center gap-5 pt-10 px-8">
        <h2 className="text-[10px] font-black text-white uppercase tracking-[0.3em] opacity-40">Другие платформы</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
      </div>

      {/* Grid Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-8">
        {[
          {
            id: 'automation',
            title: 'n8n Automation',
            description: 'Связки и сценарии',
            icon: <Zap className="w-6 h-6 text-[#B57170]" />,
            color: 'from-[#955251]/10 to-[#B57170]/10',
            border: 'border-[#955251]/20',
            hoverColor: 'hover:bg-[#955251]/20',
            action: () => setIsAutomationOpen(true)
          },
          {
            id: 'google',
            name: 'Google Ads',
            status: 'Setup',
            icon: <Target className="w-6 h-6" />,
            color: 'from-blue-500/10 to-blue-600/10',
            border: 'border-blue-500/20',
            iconColor: 'text-blue-400'
          },
          {
            id: 'tiktok',
            name: 'TikTok Ads',
            status: 'Coming Soon',
            icon: <Video className="w-6 h-6" />,
            color: 'from-zinc-500/5 to-black/30',
            border: 'border-white/5',
            iconColor: 'text-zinc-600'
          },
          {
            id: 'whatsapp',
            name: 'WhatsApp Biz',
            status: 'Setup',
            icon: <MessageCircle className="w-6 h-6" />,
            color: 'from-emerald-500/10 to-blue-600/10',
            border: 'border-emerald-500/20',
            iconColor: 'text-emerald-400'
          },
          {
            id: 'telegram',
            name: 'Telegram Bot',
            status: 'Активно',
            icon: <Send className="w-6 h-6" />,
            color: 'from-sky-400/10 to-indigo-500/10',
            border: 'border-sky-400/20',
            iconColor: 'text-sky-400'
          }
        ].map((integration) => (
          <motion.div
            key={integration.id}
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className="group"
          >
            <div
              className={cn(
                "bg-[#020617]/40 backdrop-blur-3xl border border-white/5 p-8 rounded-[32px] h-full shadow-interstellar",
                "hover:border-white/20 transition-all duration-300 relative group/card overflow-hidden",
                integration.action && "cursor-pointer"
              )}
              onClick={integration.action}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[40px] rounded-full -mr-16 -mt-16 group-hover/card:bg-white/10 transition-colors" />

              <div className="flex flex-col items-center text-center gap-6 relative z-10">
                <div className={cn(
                  "w-20 h-20 rounded-[24px] bg-gradient-to-br flex items-center justify-center border border-white/5 shadow-inner",
                  integration.color,
                  integration.border
                )}>
                  <div className={cn("transition-all duration-500 group-hover/card:scale-110", integration.iconColor)}>
                    {integration.icon}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-black text-white uppercase tracking-widest group-hover/card:text-blue-400 transition-colors">{integration.name}</p>
                  <div className="flex items-center justify-center">
                    <Badge
                      className={cn(
                        "text-[9px] uppercase tracking-[0.2em] font-black px-3 py-1 rounded-full border",
                        integration.status === 'Coming Soon' ? "bg-white/5 text-zinc-600 border-white/5" : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      )}
                    >
                      {integration.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-6 right-6 opacity-0 group-hover/card:opacity-40 transition-opacity">
                <ExternalLink className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Automation Modal */}
      <Dialog open={isAutomationOpen} onOpenChange={setIsAutomationOpen}>
        <DialogContent className="max-w-[98vw] w-[1600px] h-[95vh] overflow-hidden p-0 bg-[#020617]/95 backdrop-blur-3xl border-white/10 shadow-interstellar rounded-[40px]">
          <div className="h-full flex flex-col">
            <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between bg-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#955251]/10 blur-[100px] rounded-full -mr-32 -mt-32" />
              <div className="relative z-10">
                <DialogTitle className="text-3xl font-black text-white flex items-center gap-5 uppercase tracking-tight">
                  <div className="w-14 h-14 rounded-2xl bg-[#955251]/20 flex items-center justify-center border border-[#955251]/20 shadow-inner">
                    <Zap className="w-7 h-7 text-[#B57170]" />
                  </div>
                  Сценарии n8n
                </DialogTitle>
                <DialogDescription className="text-muted-foreground mt-3 font-black uppercase tracking-[0.2em] text-[10px] opacity-40">
                  Настройка сквозных сценариев и обработки данных
                </DialogDescription>
              </div>
              <Button variant="outline" size="icon" onClick={() => setIsAutomationOpen(false)} className="w-12 h-12 rounded-2xl bg-white/5 border-white/10 hover:bg-white/10 transition-all">
                <RefreshCw className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-black/20">
              <AutomationPage projectId={currentProjectId} />
            </div>

            <div className="p-8 border-t border-white/5 bg-[#020617]/40 backdrop-blur-3xl flex justify-end gap-6 shadow-interstellar">
              <Button variant="outline" onClick={() => setIsAutomationOpen(false)} className="h-14 bg-white/5 border-white/10 text-foreground rounded-2xl hover:bg-white/10 px-10 font-black uppercase tracking-widest text-[10px]">
                Закрыть
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Resource Selection */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl bg-[#020617]/90 backdrop-blur-3xl border-white/10 shadow-interstellar rounded-[40px] p-0 overflow-hidden">
          <div className="p-10 border-b border-white/5 bg-white/5 flex items-center gap-6 relative overflow-hidden">
            <div className={cn(
              "absolute top-0 right-0 w-48 h-48 blur-[80px] rounded-full -mr-24 -mt-24 opacity-20",
              modalType === 'facebook' ? "bg-blue-500" : "bg-purple-500"
            )} />
            <div className={cn(
              "w-16 h-16 rounded-[24px] flex items-center justify-center shadow-inner border relative z-10",
              modalType === 'facebook' ? "bg-blue-600/20 text-blue-400 border-blue-500/20" : "bg-purple-600/20 text-purple-400 border-purple-500/20"
            )}>
              {modalType === 'facebook' ? <Facebook className="w-8 h-8" /> : <Instagram className="w-8 h-8" />}
            </div>
            <div className="relative z-10">
              <DialogTitle className="text-2xl font-black text-white uppercase tracking-tight">
                {modalType === 'facebook' ? 'Ресурсы Facebook' : 'Instagram Профиль'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-2 font-black uppercase tracking-widest text-[10px] opacity-40">
                {modalType === 'facebook'
                  ? 'Выберите рекламный кабинет и бизнес-страницу'
                  : 'Подключите ваш бизнес-аккаунт Instagram'}
              </DialogDescription>
            </div>
          </div>

          <ScrollArea className="max-h-[60vh] p-10 custom-scrollbar">
            <div className="space-y-12">
              {modalType === 'facebook' ? (
                <>
                  {/* Ad Accounts Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <Target className="w-4 h-4 text-blue-400" />
                      <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] opacity-40">Рекламный кабинет</h3>
                    </div>
                    <div className="grid gap-3">
                      {modalLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 space-y-4">
                          <div className="w-12 h-12 rounded-full border-2 border-blue-500/10 border-t-blue-500 animate-spin" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-20">Синхронизация...</p>
                        </div>
                      ) : availableAdAccounts.length === 0 ? (
                        <div className="p-16 text-center rounded-[32px] bg-white/5 border border-dashed border-white/10 group/empty">
                          <Info className="w-10 h-10 mx-auto text-white/10 mb-5 group-hover/empty:scale-110 transition-transform" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Доступные кабинеты не найдены</p>
                        </div>
                      ) : (
                        availableAdAccounts.map((account) => (
                          <button
                            key={account.id}
                            onClick={() => setModalSelectedAdAccount(account.id)}
                            className={cn(
                              "w-full text-left p-6 rounded-[24px] border transition-all duration-500 relative group/btn overflow-hidden",
                              modalSelectedAdAccount === account.id
                                ? "bg-blue-500/10 border-blue-500/40 shadow-interstellar"
                                : "bg-white/5 border-white/5 hover:border-white/20"
                            )}
                          >
                            {modalSelectedAdAccount === account.id && (
                              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-[40px] rounded-full -mr-12 -mt-12" />
                            )}
                            <div className="flex items-center justify-between relative z-10">
                              <div className="flex items-center gap-4">
                                <div className={cn(
                                  "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500",
                                  modalSelectedAdAccount === account.id ? "bg-blue-500/20 text-blue-400 shadow-inner" : "bg-white/5 text-white/20"
                                )}>
                                  <Target className="w-6 h-6" />
                                </div>
                                <div>
                                  <p className="font-black text-white uppercase tracking-tight">{account.name ?? '—'}</p>
                                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1.5 opacity-40">ID: {account.account_id ?? '—'}</p>
                                </div>
                              </div>
                              <div className={cn(
                                "w-6 h-6 rounded-full border flex items-center justify-center transition-all",
                                modalSelectedAdAccount === account.id ? "bg-blue-500/20 border-blue-500/40" : "bg-white/5 border-white/5"
                              )}>
                                {modalSelectedAdAccount === account.id && <Check className="w-3.5 h-3.5 text-blue-400" />}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Pages Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <Layout className="w-4 h-4 text-blue-400" />
                      <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] opacity-40">Бизнес-страница</h3>
                    </div>
                    <div className="grid gap-3">
                      {availablePages.length === 0 && !modalLoading ? (
                        <div className="p-16 text-center rounded-[32px] bg-white/5 border border-dashed border-white/10 group/empty">
                          <Info className="w-10 h-10 mx-auto text-white/10 mb-5 group-hover/empty:scale-110 transition-transform" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Доступные страницы не найдены</p>
                        </div>
                      ) : (
                        availablePages.map((page) => (
                          <button
                            key={page.id}
                            onClick={() => setModalSelectedPage(page.id)}
                            className={cn(
                              "w-full text-left p-6 rounded-[24px] border transition-all duration-500 relative group/btn overflow-hidden",
                              modalSelectedPage === page.id
                                ? "bg-blue-500/10 border-blue-500/40 shadow-interstellar"
                                : "bg-white/5 border-white/5 hover:border-white/20"
                            )}
                          >
                            {modalSelectedPage === page.id && (
                              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-[40px] rounded-full -mr-12 -mt-12" />
                            )}
                            <div className="flex items-center justify-between relative z-10">
                              <div className="flex items-center gap-4">
                                <div className={cn(
                                  "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500",
                                  modalSelectedPage === page.id ? "bg-blue-500/20 text-blue-400 shadow-inner" : "bg-white/5 text-white/20"
                                )}>
                                  <Globe className="w-6 h-6" />
                                </div>
                                <p className="font-black text-white uppercase tracking-tight">{page.name ?? '—'}</p>
                              </div>
                              <div className={cn(
                                "w-6 h-6 rounded-full border flex items-center justify-center transition-all",
                                modalSelectedPage === page.id ? "bg-blue-500/20 border-blue-500/40" : "bg-white/5 border-white/5"
                              )}>
                                {modalSelectedPage === page.id && <Check className="w-3.5 h-3.5 text-blue-400" />}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* Instagram Section */
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Instagram className="w-4 h-4 text-purple-400" />
                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] opacity-40">Аккаунт Instagram</h3>
                  </div>
                  <div className="grid gap-4">
                    {modalLoading ? (
                      <div className="flex flex-col items-center justify-center py-16 space-y-4">
                        <div className="w-12 h-12 rounded-full border-2 border-purple-500/10 border-t-purple-500 animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-20">Синхронизация...</p>
                      </div>
                    ) : availableInstagramAccounts.length === 0 ? (
                      <div className="p-16 text-center rounded-[32px] bg-white/5 border border-dashed border-white/10 group/empty">
                        <Info className="w-10 h-10 mx-auto text-white/10 mb-5 group-hover/empty:scale-110 transition-transform" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Бизнес-аккаунты не найдены</p>
                        <p className="text-[9px] text-white/20 mt-3 font-bold uppercase tracking-widest leading-loose">Убедитесь, что ваш Instagram привязан к Facebook странице</p>
                      </div>
                    ) : (
                      availableInstagramAccounts.map((account) => (
                        <button
                          key={account.id}
                          onClick={() => setModalSelectedInstagram(account.id)}
                          className={cn(
                            "w-full text-left p-6 rounded-[24px] border transition-all duration-500 relative group/btn overflow-hidden",
                            modalSelectedInstagram === account.id
                              ? "bg-purple-500/10 border-purple-500/40 shadow-interstellar"
                              : "bg-white/5 border-white/5 hover:border-white/20"
                          )}
                        >
                          {modalSelectedInstagram === account.id && (
                            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 blur-[40px] rounded-full -mr-12 -mt-12" />
                          )}
                          <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-5">
                              <div className="relative">
                                {(account.profile_picture_url ?? '') ? (
                                  <img
                                    src={account.profile_picture_url!}
                                    alt={account.username ?? ''}
                                    className="w-14 h-14 rounded-xl object-cover ring-2 ring-white/10 group-hover/btn:scale-105 transition-transform"
                                  />
                                ) : (
                                  <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center border border-white/5">
                                    <Instagram className="w-7 h-7 text-purple-400" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-black text-white uppercase tracking-tight leading-none">@{account.username ?? '—'}</p>
                                {(account.followers_count != null && account.followers_count > 0) && (
                                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mt-2.5 opacity-60 leading-none">
                                    {Number(account.followers_count).toLocaleString('ru-RU')} Followers
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className={cn(
                              "w-6 h-6 rounded-full border flex items-center justify-center transition-all",
                              modalSelectedInstagram === account.id ? "bg-purple-500/20 border-purple-500/40" : "bg-white/5 border-white/5"
                            )}>
                              {modalSelectedInstagram === account.id && <Check className="w-3.5 h-3.5 text-purple-400" />}
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

          <div className="p-10 border-t border-white/5 bg-[#020617]/40 backdrop-blur-3xl flex justify-end gap-6 shadow-interstellar">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="h-14 bg-white/5 border-white/10 text-foreground rounded-2xl hover:bg-white/10 px-10 font-black uppercase tracking-widest text-[10px] transition-all">
              Отмена
            </Button>
            <Button onClick={handleSaveModal} className="h-14 bg-blue-600 hover:bg-blue-700 text-white min-w-[200px] rounded-2xl shadow-lg shadow-blue-500/20 px-12 font-black uppercase tracking-widest text-[10px] transition-all hover:scale-[1.02] active:scale-[0.98] gap-3">
              <Save className="w-4 h-4" />
              Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
};

export default IntegrationsManagementNew;
