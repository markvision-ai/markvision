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

export const IntegrationsManagementNew = ({ projectId }: { projectId?: string }) => {
  const [loading, setLoading] = useState(true);
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [instagramAccounts, setInstagramAccounts] = useState<InstagramAccount[]>([]);
  const [automationFlows, setAutomationFlows] = useState<AutomationFlow[]>([]);
  const [selectedAdAccount, setSelectedAdAccount] = useState<string>('');
  const [selectedInstagram, setSelectedInstagram] = useState<string>('');
  const [selectedAdAccountData, setSelectedAdAccountData] = useState<AdAccount | null>(null);
  const [selectedInstagramData, setSelectedInstagramData] = useState<InstagramAccount | null>(null);
  const currentProjectId = projectId || '64c94e87-630c-470e-8ab1-8f7c8c835efa';

  // Fetch data from database
  const fetchData = useCallback(async () => {
    try {
      // Fetch ad accounts
      const { data: adData } = await supabase
        .from('ad_accounts')
        .select('id, name, account_id, spend')
        .eq('project_id', currentProjectId);

      if (adData) {
        setAdAccounts(adData);
        // Auto-select first account if available
        if (adData.length > 0 && !selectedAdAccount) {
          setSelectedAdAccount(adData[0].id);
          setSelectedAdAccountData(adData[0]);
        }
      }

      // Fetch Instagram accounts (from selected_instagram_id in ad_accounts)
      const { data: igData } = await supabase
        .from('ad_accounts')
        .select('selected_instagram_id')
        .eq('project_id', currentProjectId)
        .not('selected_instagram_id', 'is', null)
        .single();

      if (igData?.selected_instagram_id) {
        // Mock Instagram data - replace with real API call
        const mockIgAccounts: InstagramAccount[] = [
          { id: 'mock1', username: 'uali_dent', followers_count: 4155, profile_picture_url: '' }
        ];
        setInstagramAccounts(mockIgAccounts);
        if (mockIgAccounts.length > 0 && !selectedInstagram) {
          setSelectedInstagram(mockIgAccounts[0].id);
          setSelectedInstagramData(mockIgAccounts[0]);
        }
      }

      // Fetch automation flows
      const { data: flowsData } = await supabase
        .from('automation_flows')
        .select('id, name, status, last_run')
        .eq('project_id', currentProjectId)
        .order('last_run', { ascending: false });

      if (flowsData) {
        setAutomationFlows(flowsData);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentProjectId, selectedAdAccount, selectedInstagram]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdAccountChange = (accountId: string) => {
    setSelectedAdAccount(accountId);
    const account = adAccounts.find(acc => acc.id === accountId);
    setSelectedAdAccountData(account || null);
  };

  const handleInstagramChange = (instagramId: string) => {
    setSelectedInstagram(instagramId);
    const account = instagramAccounts.find(acc => acc.id === instagramId);
    setSelectedInstagramData(account || null);
  };

  const handleRefresh = () => {
    fetchData();
    toast.success('Данные обновлены');
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      inactive: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
      error: 'bg-red-500/10 text-red-500 border-red-500/20',
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
    <div className="min-h-screen bg-slate-950 p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-white">Интеграции</h1>
          <p className="text-slate-400 text-sm">Управление подключенными сервисами</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} className="bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-800/50">
          <RefreshCw className="w-3 h-3 mr-2" />
          Обновить
        </Button>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Meta Ads & Instagram */}
        <div className="lg:col-span-2 space-y-4">
          {/* Meta Integration Card */}
          <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Facebook className="w-5 h-5 text-blue-400" />
                Facebook & Instagram
              </CardTitle>
              <CardDescription className="text-slate-400 text-sm">
                Реклама, Insights и Instagram контент
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Account Selectors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Рекламный кабинет</label>
                  <Select value={selectedAdAccount} onValueChange={handleAdAccountChange}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-600 text-slate-200">
                      <SelectValue placeholder="Выберите кабинет" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {adAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id} className="text-slate-200">
                          {account.name} ({account.account_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Instagram профиль</label>
                  <Select value={selectedInstagram} onValueChange={handleInstagramChange}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-600 text-slate-200">
                      <SelectValue placeholder="Выберите профиль" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {instagramAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id} className="text-slate-200">
                          @{account.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Mini Stats */}
              {(selectedAdAccountData || selectedInstagramData) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-700/50">
                  {selectedAdAccountData && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Facebook className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{selectedAdAccountData.name}</p>
                        <p className="text-xs text-slate-400">
                          Расход: {selectedAdAccountData.spend ? `${selectedAdAccountData.spend.toLocaleString()} ₸` : 'Нет данных'}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedInstagramData && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30">
                      {selectedInstagramData.profile_picture_url && (
                        <img
                          src={selectedInstagramData.profile_picture_url}
                          alt={selectedInstagramData.username}
                          className="w-8 h-8 rounded-full border border-slate-600"
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-200">@{selectedInstagramData.username}</p>
                        <p className="text-xs text-slate-400">
                          {selectedInstagramData.followers_count?.toLocaleString()} подписчиков
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700/50">
                  <RefreshCw className="w-3 h-3 mr-2" />
                  Обновить данные
                </Button>
                <Button size="sm" variant="outline" className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20">
                  <Unlink className="w-3 h-3 mr-2" />
                  Деактивировать
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Other Integrations - Horizontal List */}
          <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-white">Другие интеграции</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { id: 'tiktok', name: 'TikTok Ads', icon: <TikTokIcon />, status: 'inactive' },
                  { id: 'google', name: 'Google Ads', icon: <GoogleIcon />, status: 'inactive' },
                  { id: 'whatsapp', name: 'WhatsApp', icon: <MessageCircle className="w-4 h-4" />, status: 'inactive' }
                ].map((integration) => (
                  <div key={integration.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center">
                        {integration.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{integration.name}</p>
                        <p className="text-xs text-slate-400">Реклама и аналитика</p>
                      </div>
                    </div>
                    <Badge
                      variant={integration.status === 'active' ? 'default' : 'secondary'}
                      className={cn(
                        "text-xs",
                        integration.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-slate-600/10 text-slate-400 border-slate-600/20'
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
            "bg-slate-900/80 backdrop-blur-xl border-slate-700/50",
            automationFlows.some(flow => flow.status === 'error') && "border-red-500/50 shadow-lg shadow-red-500/20"
          )}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                n8n Automation Hub
              </CardTitle>
              <CardDescription className="text-slate-400 text-sm">
                Статус автоматизации данных
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {automationFlows.length === 0 ? (
                  <div className="text-center py-6 text-slate-500">
                    <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Нет активных автоматизаций</p>
                  </div>
                ) : (
                  automationFlows.map((flow) => (
                    <div key={flow.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">{flow.name}</p>
                        <p className="text-xs text-slate-400">
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