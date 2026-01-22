import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FacebookAdsStatsProps {
  projectId: string;
}

export const FacebookAdsStats = ({ projectId }: FacebookAdsStatsProps) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    fetchToken();
  }, [projectId]);

  const fetchToken = async () => {
    try {
      const { data } = await supabase
        .from('ad_accounts')
        .select('access_token')
        .eq('project_id', projectId)
        .eq('platform', 'facebook')
        .eq('status', 'active')
        .single();

      if (data?.access_token) {
        setAccessToken(data.access_token);
      }
    } catch (error) {
      console.error('Error fetching token:', error);
    }
  };

  const fetchAdsStats = async () => {
    if (!accessToken) {
      toast.error('Токен не найден. Подключите Facebook.');
      return;
    }

    setLoading(true);

    try {
      // 1. Получаем Ad Accounts
      const accountsResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name&access_token=${accessToken}`
      );

      if (!accountsResponse.ok) {
        throw new Error('Failed to fetch ad accounts');
      }

      const accountsData = await accountsResponse.json();
      console.log('Ad Accounts:', accountsData);

      if (!accountsData.data || accountsData.data.length === 0) {
        toast.warning('Рекламные аккаунты не найдены');
        return;
      }

      const adAccountId = accountsData.data[0].id;

      // 2. Получаем статистику за последние 30 дней
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const dateStart = thirtyDaysAgo.toISOString().split('T')[0];
      const dateEnd = today.toISOString().split('T')[0];

      const insightsResponse = await fetch(
        `https://graph.facebook.com/v18.0/${adAccountId}/insights?` +
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
        <Button
          onClick={fetchAdsStats}
          disabled={loading}
          size="sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Загрузка...
            </>
          ) : (
            'Обновить'
          )}
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Расходы</p>
            <p className="text-2xl font-bold">{stats.spend.toFixed(2)} ₸</p>
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
