// @ts-nocheck
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
      setStatus('offline');
      return;
    }

    const checkStatus = async () => {
      try {
        // Validate user ID exists
        if (!user.id) {
            throw new Error('User ID is missing');
        }

        // Check for any pending or in_progress commands
        // Filter by user_id AND project_id
        const { data: activeCommands, error: activeError } = await supabase
          .from('ai_commands')
          .select('id')
          .eq('user_id', user.id)
          .eq('project_id', TARGET_PROJECT_ID)
          .in('status', ['pending', 'in_progress'])
          .limit(1);

        if (activeError) throw activeError;

        if (activeCommands && activeCommands.length > 0) {
          setStatus('working');
          setLastError(null);
          return;
        }

        // If no active commands, check the last completed/failed command to show status
        const { data: lastCommand, error: lastErrorQuery } = await supabase
          .from('ai_commands')
          .select('status, error')
          .eq('user_id', user.id)
          .eq('project_id', TARGET_PROJECT_ID)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastErrorQuery) throw lastErrorQuery;

        if (lastCommand) {
           if (lastCommand.status === 'failed') {
            setStatus('error');
            setLastError(lastCommand.error);
          } else {
            setStatus('idle');
            setLastError(null);
          }
        } else {
            setStatus('idle');
        }

      } catch (err) {
        // Silent error handling: switch to offline status without console spam
        setStatus('offline');
        // Optional: store error for debug but don't show to user unless critical
        // console.error('AI Status check suppressed error:', err); 
      }
    };

    // Initial check
    checkStatus();

    // Poll every 3 seconds
    const interval = setInterval(checkStatus, 3000);

    return () => clearInterval(interval);
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
