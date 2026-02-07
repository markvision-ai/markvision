import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Zap, Loader2, AlertCircle, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const TARGET_PROJECT_ID = '64c94e87-630c-470e-8ab1-8f7c8c835efa';

export const AIStatusIndicator = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'working' | 'error' | 'offline'>('idle');
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setStatus('idle');
      return;
    }

    const checkInitialStatus = async () => {
      try {
        if (!user.id) return;

        // Check active commands
        const { data: activeCommands } = await supabase
          .from('ai_commands')
          .select('id')
          .eq('user_id', user.id)
          .in('status', ['pending', 'in_progress'])
          .limit(1);

        if (activeCommands && activeCommands.length > 0) {
          setStatus('working');
          setLastError(null);
          return;
        }

        // Check last command
        const { data: lastCommand }: any = await supabase
          .from('ai_commands')
          .select('status, error')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastCommand) {
          if ((lastCommand as any).status === 'failed') {
            setStatus('error');
            setLastError((lastCommand as any).error);
          } else {
            setStatus('idle');
            setLastError(null);
          }
        }
      } catch (error) {
        console.error('Error checking status:', error);
      }
    };

    checkInitialStatus();

    // Subscribe to Realtime updates (guarded for test/JSDOM)
    let channel: any = null;
    try {
      const canChannel = typeof (supabase as any).channel === 'function';
      if (canChannel) {
        channel = (supabase as any)
          .channel('ai_status_updates')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'ai_commands',
              filter: `project_id=eq.${TARGET_PROJECT_ID}`
            },
            (payload: any) => {
              if (payload.new && payload.new.user_id === user.id) {
                const newStatus = payload.new.status;
                if (['pending', 'in_progress'].includes(newStatus)) {
                  setStatus('working');
                  setLastError(null);
                } else if (newStatus === 'failed') {
                  setStatus('error');
                  setLastError(payload.new.error);
                } else if (newStatus === 'completed') {
                  setStatus('idle');
                  setLastError(null);
                }
              }
            }
          )
          .subscribe();
      }
    } catch (e) {
      // ignore realtime in tests
    }

    return () => {
      try {
        if (channel && typeof (supabase as any).removeChannel === 'function') {
          (supabase as any).removeChannel(channel);
        }
      } catch {}
    };
  }, [user]);

  if (status === 'working') {
    return (
      <Badge className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0 text-xs animate-pulse">
        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        AI Generating...
      </Badge>
    );
  }

  if (status === 'error') {
     return (
      <Badge variant="destructive" className="text-xs" title={lastError || 'Error'}>
        <AlertCircle className="w-3 h-3 mr-1" />
        AI Error
      </Badge>
    );
  }

  if (status === 'offline') {
    return (
      <Badge variant="outline" className="text-xs text-muted-foreground border-dashed">
        <WifiOff className="w-3 h-3 mr-1" />
        Offline
      </Badge>
    );
  }

  return (
    <Badge className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0 text-xs">
      <Zap className="w-3 h-3 mr-1" />
      AI Active
    </Badge>
  );
};
