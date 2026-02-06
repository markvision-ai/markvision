import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectContext } from '@/contexts/ProjectContext';

interface AICommand {
  id: string;
  project_id: string;
  command_type: string | null;
  payload: Record<string, unknown> | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result: Record<string, unknown> | null;
  created_at: string;
}

interface AIStatusIndicatorProps {
  className?: string;
  showLabel?: boolean;
  compact?: boolean;
}

export const AIStatusIndicator = ({
  className,
  showLabel = true,
  compact = false
}: AIStatusIndicatorProps) => {
  const { currentProjectId } = useProjectContext();
  const [latestCommand, setLatestCommand] = useState<AICommand | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentProjectId) {
      setIsLoading(false);
      return;
    }

    const fetchLatestCommand = async () => {
      // Use project_id instead of user_id
      const { data, error } = await supabase
        .from('ai_commands')
        .select('*')
        .eq('project_id', currentProjectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setLatestCommand(data as AICommand);
      }
      setIsLoading(false);
    };

    fetchLatestCommand();

    // Subscribe to realtime updates using project_id
    const channel = supabase
      .channel('ai-commands-status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_commands',
          filter: `project_id=eq.${currentProjectId}`,
        },
        (payload) => {
          if (payload.new) {
            setLatestCommand(payload.new as AICommand);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentProjectId]);

  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        {showLabel && !compact && (
          <span className="text-xs text-muted-foreground">Загрузка...</span>
        )}
      </div>
    );
  }

  if (!latestCommand) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="w-2 h-2 rounded-full bg-green-500" />
        {showLabel && !compact && (
          <span className="text-xs text-muted-foreground">AI готов</span>
        )}
      </div>
    );
  }

  const statusConfig = {
    pending: {
      icon: Clock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      label: 'В очереди',
      animate: false,
    },
    processing: {
      icon: Loader2,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      label: 'Обработка',
      animate: true,
    },
    completed: {
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      label: 'Готово',
      animate: false,
    },
    failed: {
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      label: 'Ошибка',
      animate: false,
    },
  };

  const config = statusConfig[latestCommand.status] || statusConfig.pending;
  const Icon = config.icon;

  if (compact) {
    return (
      <div
        className={cn(
          'w-6 h-6 rounded-lg flex items-center justify-center',
          config.bgColor,
          className
        )}
        title={`AI: ${config.label}`}
      >
        <Icon
          className={cn(
            'w-3.5 h-3.5',
            config.color,
            config.animate && 'animate-spin'
          )}
        />
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('p-1.5 rounded-lg', config.bgColor)}>
        <Icon
          className={cn(
            'w-3.5 h-3.5',
            config.color,
            config.animate && 'animate-spin'
          )}
        />
      </div>
      {showLabel && (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-foreground">
            {config.label}
          </span>
          {latestCommand.command_type && (
            <span className="text-[10px] text-muted-foreground">
              {latestCommand.command_type}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Hook for creating AI commands
export const useAICommands = () => {
  const { currentProjectId } = useProjectContext();

  const createCommand = async (
    commandType: string,
    payload?: Record<string, unknown>
  ) => {
    if (!currentProjectId) {
      throw new Error('No project selected');
    }

    const { data, error } = await supabase
      .from('ai_commands')
      .insert({
        project_id: currentProjectId,
        command_type: commandType,
        payload: payload || {},
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data as AICommand;
  };

  return { createCommand };
};
