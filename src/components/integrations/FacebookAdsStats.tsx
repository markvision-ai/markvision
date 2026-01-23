import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface FacebookAdsStatsProps {
  projectId: string;
}

interface AdAccount {
  id: string;
  name: string;
  account_id: string;
}

export const FacebookAdsStats = ({ projectId }: FacebookAdsStatsProps) => {
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');

  useEffect(() => {
    fetchToken();
  }, [projectId]);

  const fetchToken = async () => {
    try {
      const targetProjectId = '64c94e87-630c-470e-8ab1-8f7c8c835efa';
      
      const { data } = await supabase
        .from('ad_accounts')
        .select('access_token')
        .eq('project_id', targetProjectId)
        .eq('platform', 'facebook')
        .eq('status', 'active')
        .single();

      if (data?.access_token) {
        setAccessToken(data.access_token);
        await fetchAdAccounts(data.access_token);
      }
    } catch (error) {
      console.error('Error fetching token:', error);
    }
  };

  const fetchAdAccounts = async (token: string) => {
    setLoadingAccounts(true);
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_id&access_token=${token}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch ad accounts');
      }

      const data = await response.json();
      console.log('Ad Accounts:', data);

      if (data.data && data.data.length > 0) {
        setAdAccounts(data.data);
        
        // Автоматически выбираем первый кабинет
        setSelectedAccount(data.data[0].id);
        
        toast.success(`Найдено ${data.data.length} рекламных кабинетов`);
      } else {
        toast.warning('Рекламные кабинеты не найдены');
      }
    } catch (error: any) {
      console.error('Error fetching ad accounts:', error);
      toast.error('Ошибка загрузки кабинетов', {
        description: error.message
      });
    } finally {
      setLoadingAccounts(false);
    }
  };

  const fetchAdsStats = async () => {
    if (!accessToken) {
      toast.error('Токен не найден. Подключите Facebook.');
      return;
    }

    if (!selectedAccount) {
      toast.error('Выберите рекламный кабинет');
      return;
    }

    setLoading(true);

    try {
      // Получаем статистику за последние 30 дней
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const dateStart = thirtyDaysAgo.toISOString().split('T')[0];
      const dateEnd = today.toISOString().split('T')[0];

      const insightsResponse = await fetch(
        `https://graph.facebook.com/v18.0/${selectedAccount}/insights?` +
        `fields=spend,impressions,clicks,actions&` +
        `time_range={'since':'${dateStart}','until':'${dateEnd}'}&` +
        `access_token=${accessToken}`
      );

      if (!insightsResponse.ok) {
        throw new Error('Failed to fetch insights');
      }

      const insightsData = await insightsResponse.json();
      console.log('Insights:', insightsData);

      if (insightsData.data && insightsData.data.length > 0) {
        const insight = insightsData.data[0];
        
        // Извлекаем лиды из actions
        const leads = insight.actions?.find((a: any) => a.action_type === 'lead')?.value || 0;

        setStats({
          spend: parseFloat(insight.spend || 0),
          impressions: parseInt(insight.impressions || 0),
          clicks: parseInt(insight.clicks || 0),
          leads: parseInt(leads),
        });

        toast.success('Статистика загружена!');
      } else {
        toast.warning('Нет данных за последние 30 дней');
      }
    } catch (error: any) {
      console.error('Error fetching ads stats:', error);
      toast.error('Ошибка загрузки статистики', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  if (!accessToken) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">
          Подключите Facebook, чтобы видеть статистику рекламы
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Facebook Ads - Статистика (30 дней)</h3>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => accessToken && fetchAdAccounts(accessToken)}
            disabled={loadingAccounts || !accessToken}
            variant="outline"
            size="sm"
          >
            {loadingAccounts ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
          <Button
            onClick={fetchAdsStats}
            disabled={loading || !selectedAccount}
            size="sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Загрузка...
              </>
            ) : (
              'Загрузить статистику'
            )}
          </Button>
        </div>
      </div>

      {adAccounts.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Рекламный кабинет</label>
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите кабинет" />
            </SelectTrigger>
            <SelectContent>
              {adAccounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} (ID: {account.account_id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Расходы</p>
            <p className="text-2xl font-bold">{Math.round(stats.spend).toLocaleString('ru-RU')} ₸</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Показы</p>
            <p className="text-2xl font-bold">{stats.impressions.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Клики</p>
            <p className="text-2xl font-bold">{stats.clicks.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Лиды</p>
            <p className="text-2xl font-bold">{stats.leads}</p>
          </div>
        </div>
      )}
    </Card>
  );
};
