import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Facebook, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMetaSync } from '@/hooks/useMetaSync';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface MetaSyncButtonProps {
  projectId: string | null;
  variant?: 'default' | 'compact';
  showStatus?: boolean;
}

export const MetaSyncButton = ({ 
  projectId, 
  variant = 'default',
  showStatus = true 
}: MetaSyncButtonProps) => {
  const { syncing, syncMetaData, getIntegrationStatus } = useMetaSync(projectId);
  const [status, setStatus] = useState<{ connected: boolean; lastSync: string | null }>({
    connected: false,
    lastSync: null
  });

  useEffect(() => {
    if (projectId) {
      getIntegrationStatus().then(setStatus);
    }
  }, [projectId, getIntegrationStatus]);

  const handleSync = async () => {
    const result = await syncMetaData('all');
    if (result?.success) {
      setStatus(prev => ({ ...prev, lastSync: result.synced_at || null }));
    }
  };

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSync}
              disabled={syncing || !status.connected}
              className="h-8 w-8"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {status.connected 
              ? 'Синхронизировать данные Meta' 
              : 'Подключите Facebook в настройках'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {showStatus && (
        <div className="flex items-center gap-2">
          {status.connected ? (
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 gap-1">
              <Facebook className="h-3 w-3" />
              <span className="hidden sm:inline">Meta подключен</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 gap-1">
              <AlertCircle className="h-3 w-3" />
              <span className="hidden sm:inline">Не подключен</span>
            </Badge>
          )}
          
          {status.lastSync && (
            <span className="text-xs text-muted-foreground hidden md:inline">
              Обновлено {formatDistanceToNow(new Date(status.lastSync), { 
                addSuffix: true, 
                locale: ru 
              })}
            </span>
          )}
        </div>
      )}
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={syncing || !status.connected}
        className="gap-2"
      >
        {syncing ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="hidden sm:inline">Синхронизация...</span>
          </>
        ) : (
          <>
            <Cloud className="h-4 w-4" />
            <span className="hidden sm:inline">Синхронизировать</span>
          </>
        )}
      </Button>
    </div>
  );
};
