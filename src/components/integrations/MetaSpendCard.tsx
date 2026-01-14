import { useState, useEffect } from 'react';
import { Facebook, TrendingUp, ExternalLink, RefreshCw, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMetaSync } from '@/hooks/useMetaSync';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface MetaSpendCardProps {
  projectId: string | null;
  className?: string;
}

export const MetaSpendCard = ({ projectId, className = '' }: MetaSpendCardProps) => {
  const { syncing, syncMetaData, getTotalSpend, getIntegrationStatus } = useMetaSync(projectId);
  const [totalSpend, setTotalSpend] = useState<number>(0);
  const [status, setStatus] = useState<{ connected: boolean; lastSync: string | null }>({
    connected: false,
    lastSync: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) return;
      
      setLoading(true);
      try {
        const [spend, integrationStatus] = await Promise.all([
          getTotalSpend(30),
          getIntegrationStatus()
        ]);
        setTotalSpend(spend);
        setStatus(integrationStatus);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, getTotalSpend, getIntegrationStatus]);

  const handleSync = async () => {
    const result = await syncMetaData('ads');
    if (result?.success) {
      const newSpend = await getTotalSpend(30);
      setTotalSpend(newSpend);
      setStatus(prev => ({ ...prev, lastSync: result.synced_at || null }));
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M ₸`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K ₸`;
    }
    return `${value.toFixed(0)} ₸`;
  };

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Facebook className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Расходы на рекламу</p>
              <p className="text-xs text-muted-foreground">За последние 30 дней</p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSync}
            disabled={syncing || !status.connected}
            className="h-8 w-8"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="space-y-3">
          <p className="text-2xl md:text-3xl font-bold">
            {loading ? '...' : formatCurrency(totalSpend)}
          </p>

          {status.connected ? (
            <div className="flex items-center justify-between">
              <Badge 
                variant="outline" 
                className="bg-green-500/10 text-green-600 border-green-500/20 text-xs gap-1"
              >
                <CheckCircle className="h-3 w-3" />
                Синхронизировано с Facebook Ads
              </Badge>
            </div>
          ) : (
            <Badge 
              variant="outline" 
              className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 text-xs"
            >
              Подключите Facebook Ads в настройках
            </Badge>
          )}

          {status.lastSync && (
            <p className="text-xs text-muted-foreground">
              Обновлено {formatDistanceToNow(new Date(status.lastSync), { 
                addSuffix: true, 
                locale: ru 
              })}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
