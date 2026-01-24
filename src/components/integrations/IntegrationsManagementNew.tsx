import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect, useCallback } from 'react';
import { Facebook, CheckCircle, Loader2, Unlink, RefreshCw, Settings, MessageCircle, Zap, AlertTriangle, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
  name: string;
  status: 'active' | 'inactive' | 'error' | 'running';
  last_run: string | null;
}

interface ConnectedAccount {
  id: string;
  project_id: string;
  access_token: string;
  name?: string;
  selected_page_id?: string;
  selected_instagram_id?: string;
  created_at: string;
}

export const IntegrationsManagementNew = ({ projectId }: { projectId?: string }) => {
  const [loading, setLoading] = useState(true);
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [instagramAccounts, setInstagramAccounts] = useState<InstagramAccount[]>([]);
  const [automationFlows, setAutomationFlows] = useState<AutomationFlow[]>([]);
  const [selectedAdAccount, setSelectedAdAccount] = useState<string>('');
  const [selectedInstagram, setSelectedInstagram] = useState<string>('');
  const [selectedAdAccountData, setSelectedAdAccountData] = useState<AdAccount | null>(null);
  const [selectedInstagramData, setSelectedInstagramData] = useState<InstagramAccount | null>(null);
  const [connectedAccount, setConnectedAccount] = useState<ConnectedAccount | null>(null);
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
          // Try to get page data - if API fails, we'll show the ID
          setSelectedAdAccountData({ id: account.selected_page_id, name: `Страница ${account.selected_page_id}` });
        }
        if (account.selected_instagram_id) {
          setSelectedInstagram(account.selected_instagram_id);
          // Try to get Instagram data - if API fails, we'll show the ID
          setSelectedInstagramData({ id: account.selected_instagram_id, username: account.selected_instagram_id });
        }
      }

      // Try to fetch fresh Instagram accounts from API if connected (don't fail if API is down)
      if (adData && adData.length > 0 && adData[0].access_token) {
        try {
          await fetchInstagramAccounts(adData[0].access_token);
        } catch (apiError) {
          console.warn('API unavailable, showing database data only');
          // Continue with database data only
        }
      }

      // Fetch automation flows
      const { data: flowsData } = await supabase
        .from('automation_flows')
        .select('id, name, status, last_run')
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
  }, [fetchData]);

  const handleAdAccountChange = async (pageId: string) => {
    if (!connectedAccount) return;

    try {
      const { error } = await supabase
        .from('ad_accounts')
        .update({ selected_page_id: pageId })
        .eq('id', connectedAccount.id);

      if (error) throw error;

      setSelectedAdAccount(pageId);

      // Set basic data immediately
      const selectedAccount = adAccounts.find(acc => acc.id === pageId);
      if (selectedAccount) {
        setSelectedAdAccountData(selectedAccount);
      }

      // Try to fetch fresh page data from API (don't fail if API is down)
      if (connectedAccount.access_token) {
        try {
          const pageResponse = await fetch(
            `https://graph.facebook.com/v21.0/${pageId}?fields=id,name,picture&access_token=${connectedAccount.access_token}`
          );

          if (pageResponse.ok) {
            const pageData = await pageResponse.json();
            setSelectedAdAccountData(prev => ({ ...prev, ...pageData }));
          }
        } catch (apiError) {
          console.warn('API unavailable, keeping database data');
          // Keep the database data we already set
        }
      }

      toast.success('Рекламный кабинет выбран');
    } catch (error) {
      console.error('Error saving ad account selection:', error);
      toast.error('Ошибка сохранения выбора');
    }
  };

  const handleInstagramChange = async (instagramId: string) => {
    if (!connectedAccount) return;

    try {
      const { error } = await supabase
        .from('ad_accounts')
        .update({ selected_instagram_id: instagramId })
        .eq('id', connectedAccount.id);

      if (error) throw error;

      setSelectedInstagram(instagramId);
      const account = instagramAccounts.find(acc => acc.id === instagramId);
      setSelectedInstagramData(account || null);

      toast.success('Instagram профиль выбран');
    } catch (error) {
      console.error('Error saving Instagram selection:', error);
      toast.error('Ошибка сохранения выбора');
    }
  };

  const handleRefresh = () => {
    fetchData();
    toast.success('Данные обновлены');
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-primary/10 text-primary border-primary/20',
      inactive: 'bg-muted text-muted-foreground border-border',
      error: 'bg-destructive/10 text-destructive border-destructive/20',
      running: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    };

    const icons = {
      active: <CheckCircle className="w-3 h-3" />,
      inactive: <Pause className="w-3 h-3" />,
      error: <AlertTriangle className="w-3 h-3" />,
      running: <Play className="w-3 h-3" />
    };

    return (
      <Badge variant="secondary" className={cn("text-xs", variants[status as keyof typeof variants])}>
        {icons[status as keyof typeof icons]}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    );
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
        <Button variant="outline" size="sm" onClick={handleRefresh} className="bg-card/50 border-border text-foreground hover:bg-card/80">
          <RefreshCw className="w-3 h-3 mr-2" />
          Обновить
        </Button>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Meta Ads & Instagram */}
        <div className="lg:col-span-2 space-y-4">
          {/* Meta Integration Card */}
          <Card className="bg-card/50 backdrop-blur-xl border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                <Facebook className="w-5 h-5 text-blue-500" />
                Facebook & Instagram
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm">
                Реклама, Insights и Instagram контент
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Show connected account info if available */}
              {connectedAccount && (
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Facebook className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{connectedAccount.name || 'Meta аккаунт'}</p>
                      <p className="text-sm text-muted-foreground">Подключено к проекту</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Selectors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Рекламный кабинет</label>
                  <Select value={selectedAdAccount} onValueChange={handleAdAccountChange}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="Выберите кабинет" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      {adAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id} className="text-foreground">
                          {account.name} ({account.account_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Instagram профиль</label>
                  <Select value={selectedInstagram} onValueChange={handleInstagramChange}>
                    <SelectTrigger className="bg-background border-border text-foreground">
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

              {/* Mini Stats - Show selected account data */}
              {(selectedAdAccountData || selectedInstagramData) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-border/50">
                  {selectedAdAccountData && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Facebook className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{selectedAdAccountData.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Расход: {selectedAdAccountData.spend ? `${selectedAdAccountData.spend.toLocaleString()} ₸` : 'Нет данных'}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedInstagramData && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      {selectedInstagramData.profile_picture_url ? (
                        <img
                          src={selectedInstagramData.profile_picture_url}
                          alt={selectedInstagramData.username}
                          className="w-8 h-8 rounded-full border border-border"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center">
                          <MessageCircle className="w-4 h-4 text-pink-500" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">@{selectedInstagramData.username}</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedInstagramData.followers_count?.toLocaleString()} подписчиков
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="bg-background border-border text-foreground hover:bg-muted">
                  <RefreshCw className="w-3 h-3 mr-2" />
                  Обновить данные
                </Button>
                <Button size="sm" variant="outline" className="bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20">
                  <Unlink className="w-3 h-3 mr-2" />
                  Деактивировать
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Other Integrations - Horizontal List */}
          <Card className="bg-card/50 backdrop-blur-xl border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-foreground">Другие интеграции</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { id: 'tiktok', name: 'TikTok Ads', icon: <TikTokIcon />, status: 'inactive' },
                  { id: 'google', name: 'Google Ads', icon: <GoogleIcon />, status: 'inactive' },
                  { id: 'whatsapp', name: 'WhatsApp', icon: <MessageCircle className="w-4 h-4" />, status: 'inactive' }
                ].map((integration) => (
                  <div key={integration.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        {integration.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{integration.name}</p>
                        <p className="text-xs text-muted-foreground">Реклама и аналитика</p>
                      </div>
                    </div>
                    <Badge
                      variant={integration.status === 'active' ? 'default' : 'secondary'}
                      className={cn(
                        "text-xs",
                        integration.status === 'active'
                          ? 'bg-primary/10 text-primary border-primary/20'
                          : 'bg-muted text-muted-foreground border-border'
                      )}
                    >
                      {integration.status === 'active' ? 'Подключено' : 'Настроить'}
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
            "bg-card/50 backdrop-blur-xl border-border/50",
            automationFlows.some(flow => flow.status === 'error') && "border-destructive/50 shadow-lg shadow-destructive/20"
          )}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                n8n Automation Hub
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm">
                Статус автоматизации данных
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {automationFlows.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Нет активных процессов</p>
                  </div>
                ) : (
                  automationFlows.map((flow) => (
                    <div key={flow.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{flow.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {flow.last_run ? new Date(flow.last_run).toLocaleString('ru-RU') : 'Не запускался'}
                        </p>
                      </div>
                      <div className="ml-3">
                        {getStatusBadge(flow.status)}
                      </div>
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