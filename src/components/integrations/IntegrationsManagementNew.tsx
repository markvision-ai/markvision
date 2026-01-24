import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect, useCallback } from 'react';
import { Facebook, CheckCircle, Loader2, Unlink, RefreshCw, Settings, MessageCircle, Zap, AlertTriangle, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// GlowBadge component for premium status indicators
interface GlowBadgeProps {
  status: 'active' | 'error' | 'inactive' | 'running';
  children: React.ReactNode;
}

const GlowBadge: React.FC<GlowBadgeProps> = ({ status, children }) => {
  const glowClasses = {
    active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 shadow-lg shadow-emerald-500/20',
    error: 'bg-red-500/10 text-red-600 border-red-500/30 shadow-lg shadow-red-500/20',
    inactive: 'bg-gray-500/10 text-gray-600 border-gray-500/30',
    running: 'bg-blue-500/10 text-blue-600 border-blue-500/30 shadow-lg shadow-blue-500/20'
  };

  return (
    <Badge
      variant="secondary"
      className={cn(
        "text-xs font-medium px-2 py-1 border",
        glowClasses[status]
      )}
    >
      {children}
    </Badge>
  );
};

// Icons for other integrations
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
);
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
);

interface AdAccount {
  id: string;
  name: string;
  account_id: string;
  spend?: number;
}

interface InstagramAccount {
  id: string;
  username: string;
  profile_picture_url?: string;
  followers_count?: number;
}

interface AutomationFlow {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'error' | 'running';
  last_run: string | null;
  execution_time?: number;
  logs?: string;
  created_at: string;
  updated_at: string;
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
  created_at: string;
}

const IntegrationsManagementNew = ({ projectId }: { projectId?: string }) => {
  const [loading, setLoading] = useState(true);
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [instagramAccounts, setInstagramAccounts] = useState<InstagramAccount[]>([]);
  const [automationFlows, setAutomationFlows] = useState<AutomationFlow[]>([]);
  const [selectedAdAccount, setSelectedAdAccount] = useState<string>('');
  const [selectedInstagram, setSelectedInstagram] = useState<string>('');
  const [selectedAdAccountData, setSelectedAdAccountData] = useState<AdAccount | null>(null);
  const [selectedInstagramData, setSelectedInstagramData] = useState<InstagramAccount | null>(null);
  const [connectedAccount, setConnectedAccount] = useState<ConnectedAccount | null>(null);
  const [selectedPageName, setSelectedPageName] = useState<string>('');
  const [selectedInstagramHandle, setSelectedInstagramHandle] = useState<string>('');
  const [showSelectionMode, setShowSelectionMode] = useState<boolean>(true);
  const currentProjectId = projectId || '64c94e87-630c-470e-8ab1-8f7c8c835efa';

  // Fetch data from database
  const fetchData = useCallback(async () => {
    try {
      // Fetch ad accounts with all data
      const { data: adData } = await supabase
        .from('ad_accounts')
        .select('*')
        .eq('project_id', currentProjectId);

      if (adData && adData.length > 0) {
        const account = adData[0]; // Use first account
        setConnectedAccount(account);
        setAdAccounts(adData);

        // Set selected values from database
        if (account.selected_page_id) {
          setSelectedAdAccount(account.selected_page_id);
          // Use name from database, fallback to finding it in available accounts
          const dbName = account.selected_page_name;
          if (dbName) {
            setSelectedPageName(dbName);
            setSelectedAdAccountData({
              id: account.selected_page_id,
              name: dbName,
              account_id: account.selected_page_id
            });
          }
        }
        if (account.selected_instagram_id) {
          setSelectedInstagram(account.selected_instagram_id);
          // Use handle from database, fallback to finding it in available accounts
          const dbHandle = account.selected_instagram_handle;
          if (dbHandle) {
            setSelectedInstagramHandle(dbHandle);
            setSelectedInstagramData({
              id: account.selected_instagram_id,
              username: dbHandle
            });
          }
        }

        // If we have saved settings, show active connection mode
        if (account.selected_page_id || account.selected_instagram_id) {
          setShowSelectionMode(false);
        } else {
          // If no accounts are saved, show setup mode
          setShowSelectionMode(true);
        }

        // Set initial selection mode based on whether accounts are configured
        const hasConfiguredAccounts = account.selected_page_id || account.selected_instagram_id;
        setShowSelectionMode(!hasConfiguredAccounts);
      }

      // Try to fetch fresh Instagram accounts from API if connected (don't fail if API is down)
      if (adData && adData.length > 0 && adData[0].access_token) {
        const account = adData[0];
        try {
          await fetchInstagramAccounts(account.access_token);

          // Set names from available data if not already set from database
          if (account.selected_page_id && !selectedPageName) {
            const pageAccount = adAccounts.find(acc => acc.id === account.selected_page_id);
            if (pageAccount) {
              setSelectedPageName(pageAccount.name);
              setSelectedAdAccountData(pageAccount);
            }
          }
          if (account.selected_instagram_id && !selectedInstagramHandle) {
            const igAccount = instagramAccounts.find(acc => acc.id === account.selected_instagram_id);
            if (igAccount) {
              setSelectedInstagramHandle(igAccount.username);
              setSelectedInstagramData(igAccount);
            }
          }
        } catch (apiError) {
          console.warn('API unavailable, showing database data only');
          // Continue with database data only
        }
      }

      // Fetch automation flows
      const { data: flowsData } = await supabase
        .from('automation_flows')
        .select('*')
        .eq('project_id', currentProjectId)
        .order('last_run', { ascending: false, nullsLast: true });

      if (flowsData) {
        setAutomationFlows(flowsData);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProjectId]);

  // Fetch Instagram accounts from Meta API
  const fetchInstagramAccounts = async (accessToken: string) => {
    try {
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,picture,instagram_business_account&access_token=${accessToken}`
      );

      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json();
        const igAccounts: InstagramAccount[] = [];

        for (const page of pagesData.data || []) {
          if (page.instagram_business_account) {
            const igId = page.instagram_business_account.id;

            try {
              const igResponse = await fetch(
                `https://graph.facebook.com/v21.0/${igId}?fields=id,username,profile_picture_url,followers_count&access_token=${accessToken}`
              );

              if (igResponse.ok) {
                const igData = await igResponse.json();
                igAccounts.push(igData);
              }
            } catch (igError) {
              console.warn('Не удалось загрузить Instagram аккаунт:', igId);
            }
          }
        }

        setInstagramAccounts(igAccounts);

        // Set selected Instagram data if available
        if (selectedInstagram && igAccounts.length > 0) {
          const selectedIg = igAccounts.find(acc => acc.id === selectedInstagram);
          if (selectedIg) {
            setSelectedInstagramData(selectedIg);
            setSelectedInstagramHandle(selectedIg.username);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching Instagram accounts:', error);
      // Don't fail completely if API is down - we still have database data
    }
  };


  useEffect(() => {
    fetchData();

    // Subscribe to automation_flows changes
    const automationSubscription = supabase
      .channel('automation_flows_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'automation_flows',
          filter: `project_id=eq.${currentProjectId}`
        },
        (payload) => {
          console.log('Automation flows changed:', payload);
          // Refresh automation flows data
          fetchAutomationFlows();
        }
      )
      .subscribe();

    return () => {
      automationSubscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, currentProjectId]);

  // Separate function to fetch automation flows
  const fetchAutomationFlows = useCallback(async () => {
    try {
      const { data: flowsData } = await supabase
        .from('automation_flows')
        .select('*')
        .eq('project_id', currentProjectId)
        .order('last_run', { ascending: false, nullsLast: true });

      if (flowsData) {
        setAutomationFlows(flowsData);
      }
    } catch (error) {
      console.error('Error fetching automation flows:', error);
    }
  }, [currentProjectId]);

  const handleAdAccountChange = (pageId: string) => {
    // Find account data from available accounts
    const account = adAccounts.find(acc => acc.id === pageId);
    if (account) {
      setSelectedAdAccount(pageId);
      setSelectedPageName(account.name);
      setSelectedAdAccountData(account);
    }
  };

  const handleInstagramChange = (instagramId: string) => {
    // Find account data from available accounts
    const account = instagramAccounts.find(acc => acc.id === instagramId);
    if (account) {
      setSelectedInstagram(instagramId);
      setSelectedInstagramHandle(account.username);
      setSelectedInstagramData(account);
    }
  };

  const handleSaveSettings = async () => {
    if (!connectedAccount) return;

    try {
      // Get current names from selected values
      let finalPageName = selectedPageName;
      let finalInstagramHandle = selectedInstagramHandle;

      // Ensure we have names from the selected accounts
      if (selectedAdAccount && !finalPageName) {
        const account = adAccounts.find(acc => acc.id === selectedAdAccount);
        if (account) {
          finalPageName = account.name;
        }
      }

      if (selectedInstagram && !finalInstagramHandle) {
        const account = instagramAccounts.find(acc => acc.id === selectedInstagram);
        if (account) {
          finalInstagramHandle = account.username;
        }
      }

      // Validate that we have required data
      if (!finalPageName && !finalInstagramHandle) {
        toast.error('Необходимо выбрать хотя бы один аккаунт');
        return;
      }

      // Prepare data for upsert
      const updateData: Record<string, unknown> = {
        id: connectedAccount.id,
        project_id: connectedAccount.project_id,
        access_token: connectedAccount.access_token,
        name: connectedAccount.name
      };

      if (selectedAdAccount) {
        updateData.selected_page_id = selectedAdAccount;
        updateData.selected_page_name = finalPageName;
        updateData.ad_account_name = finalPageName; // Send as ad_account_name for backward compatibility
      }

      if (selectedInstagram) {
        updateData.selected_instagram_id = selectedInstagram;
        updateData.selected_instagram_handle = finalInstagramHandle;
      }

      console.log('Saving settings to Supabase:', updateData);

      // Save to database
      const { error } = await supabase
        .from('ad_accounts')
        .upsert(updateData, {
          onConflict: 'id'
        });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      setShowSelectionMode(false);
      toast.success('Настройки подключения сохранены!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Ошибка сохранения настроек');
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);

      // Full refetch of all data
      await fetchData();
      await fetchAutomationFlows();

      toast.success('Все данные обновлены');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Ошибка обновления данных');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeSettings = () => {
    setShowSelectionMode(true);
  };


  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin text-primary w-6 h-6" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-foreground">Интеграции</h1>
          <p className="text-muted-foreground text-sm">Управление подключенными сервисами</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} className="bg-background border-border text-foreground hover:bg-muted shadow-sm">
          <RefreshCw className="w-3 h-3 mr-2" />
          Обновить
        </Button>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Meta Ads & Instagram */}
        <div className="lg:col-span-2 space-y-4">
          {/* Meta Integration Card */}
          <Card className="bg-background/80 dark:bg-card/50 backdrop-blur-xl dark:backdrop-blur-xl border-border/50 shadow-sm dark:shadow-lg dark:shadow-black/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center border border-blue-500/30">
                  <Facebook className="w-3 h-3 text-blue-500" />
                </div>
                Facebook & Instagram
              </CardTitle>
              <CardDescription className="text-muted-foreground text-xs">
                Реклама, Insights и Instagram контент
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {showSelectionMode ? (
                // Режим настройки подключения
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-sm font-semibold text-foreground mb-1">Настройка подключения</h3>
                    <p className="text-xs text-muted-foreground">Выберите рекламный кабинет и Instagram профиль</p>
                  </div>

                  {/* Account Selectors */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center">
                          📊
                        </div>
                        Рекламный кабинет
                      </label>
                      <Select value={selectedAdAccount} onValueChange={handleAdAccountChange}>
                        <SelectTrigger className="bg-background border-border text-foreground h-10">
                          <SelectValue placeholder="Выберите кабинет" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border">
                          {adAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id} className="text-foreground">
                              {account.name || `Кабинет ${account.account_id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-pink-500/20 flex items-center justify-center">
                          📷
                        </div>
                        Instagram профиль
                      </label>
                      <Select value={selectedInstagram} onValueChange={handleInstagramChange}>
                        <SelectTrigger className="bg-background border-border text-foreground h-10">
                          <SelectValue placeholder="Выберите профиль" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border">
                          {instagramAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id} className="text-foreground">
                              @{account.username}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Preview of selected accounts */}
                  {(selectedPageName || selectedInstagramHandle) && (
                    <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                      <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                        Выбранные аккаунты
                      </h4>
                      <div className="space-y-2">
                        {selectedPageName && (
                          <div className="flex items-center gap-3 p-2 rounded bg-background/50">
                            <span className="text-lg">📊</span>
                            <div>
                              <p className="text-sm font-medium text-foreground">{selectedPageName}</p>
                              <p className="text-xs text-muted-foreground">Рекламный кабинет</p>
                            </div>
                          </div>
                        )}
                        {selectedInstagramHandle && (
                          <div className="flex items-center gap-3 p-2 rounded bg-background/50">
                            <span className="text-lg">📷</span>
                            <div>
                              <p className="text-sm font-medium text-foreground">@{selectedInstagramHandle}</p>
                              <p className="text-xs text-muted-foreground">Instagram профиль</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Connect Button */}
                  <Button
                    onClick={handleSaveSettings}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 text-sm font-medium"
                    disabled={!selectedAdAccount && !selectedInstagram}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Подключить аккаунты
                  </Button>
                </div>
              ) : (
                // Режим активного подключения
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-sm font-semibold text-foreground mb-1">Подключение активно</h3>
                    <p className="text-xs text-muted-foreground">Ваши аккаунты успешно подключены</p>
                  </div>

                  {/* Status Card */}
                  <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">Подключено</p>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">Meta аккаунты активны</p>
                      </div>
                    </div>

                    {/* Connected Accounts */}
                    <div className="space-y-3">
                      {selectedPageName && (
                        <div className="flex items-center gap-4 p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-emerald-500/10">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <span className="text-sm">📊</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{selectedPageName}</p>
                            <p className="text-xs text-muted-foreground">Рекламный кабинет</p>
                          </div>
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        </div>
                      )}

                      {selectedInstagramHandle && (
                        <div className="flex items-center gap-4 p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-emerald-500/10">
                          <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
                            <span className="text-sm">📷</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">@{selectedInstagramHandle}</p>
                            <p className="text-xs text-muted-foreground">Instagram профиль</p>
                          </div>
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={handleRefresh}
                      className="h-9 text-sm"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Обновить
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleChangeSettings}
                      className="h-9 text-sm"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Изменить
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Other Integrations - Compact Horizontal List */}
          <Card className="bg-background/80 dark:bg-card/50 backdrop-blur-xl dark:backdrop-blur-xl border-border/50 shadow-sm dark:shadow-lg dark:shadow-black/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-foreground">Другие интеграции</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'tiktok', name: 'TikTok', icon: <TikTokIcon />, status: 'inactive' },
                  { id: 'google', name: 'Google Ads', icon: <GoogleIcon />, status: 'inactive' },
                  { id: 'whatsapp', name: 'WhatsApp', icon: <MessageCircle className="w-3 h-3" />, status: 'inactive' }
                ].map((integration) => (
                  <div key={integration.id} className="flex flex-col items-center p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors border border-border/30">
                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center border border-border/40 mb-2">
                      {integration.icon}
                    </div>
                    <p className="text-xs font-medium text-foreground text-center mb-1">{integration.name}</p>
                    <Badge
                      variant={integration.status === 'active' ? 'default' : 'secondary'}
                      className={cn(
                        "text-xs px-2 py-0.5 h-5",
                        integration.status === 'active'
                          ? 'bg-primary/10 text-primary border-primary/20'
                          : 'bg-muted text-muted-foreground border-border'
                      )}
                    >
                      {integration.status === 'active' ? '✓' : '○'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: n8n Automation Hub */}
        <div>
          <Card className={cn(
            "bg-background/80 dark:bg-card/50 backdrop-blur-xl dark:backdrop-blur-xl border-border/50 shadow-sm dark:shadow-lg dark:shadow-black/10",
            automationFlows.some(flow => flow.status === 'error') && "dark:border-destructive/50 dark:shadow-lg dark:shadow-destructive/20"
          )}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
                  <Zap className="w-3 h-3 text-amber-500" />
                </div>
                n8n Automation Hub
              </CardTitle>
              <CardDescription className="text-muted-foreground text-xs">
                Статус автоматизаций
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {automationFlows.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Роботы не запущены</p>
                    <p className="text-xs mt-1">Запустите n8n workflows для мониторинга</p>
                  </div>
                ) : (
                  automationFlows.map((flow) => (
                    <div key={flow.id} className="p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/40 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{flow.name}</p>
                          {flow.description && (
                            <p className="text-xs text-muted-foreground mt-1">{flow.description}</p>
                          )}
                        </div>
                      <div className="ml-3">
                        <GlowBadge status={flow.status}>
                          {flow.status === 'active' ? 'Работает' :
                           flow.status === 'error' ? 'Ошибка' :
                           flow.status === 'inactive' ? 'Пауза' :
                           flow.status === 'running' ? 'Выполняется' : flow.status}
                        </GlowBadge>
                      </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {flow.last_run ? new Date(flow.last_run).toLocaleString('ru-RU') : 'Не запускался'}
                        </span>
                        {flow.execution_time && (
                          <span>{flow.execution_time}ms</span>
                        )}
                      </div>
                      {flow.logs && flow.status === 'error' && (
                        <div className="mt-2 p-2 rounded bg-destructive/5 border border-destructive/20">
                          <p className="text-xs text-destructive line-clamp-2">{flow.logs}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsManagementNew;