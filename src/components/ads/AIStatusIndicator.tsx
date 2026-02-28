import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Zap, Loader2, AlertCircle, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const AIStatusIndicator = ({ projectId }: { projectId: string | null }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'working' | 'error' | 'offline'>('idle');
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !projectId) {
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
          .eq('project_id', projectId)
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
          .eq('project_id', projectId)
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
              filter: `project_id=eq.${projectId}`
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
      void e;
    }

    return () => {
      try {
        if (channel && typeof (supabase as any).removeChannel === 'function') {
          (supabase as any).removeChannel(channel);
        }
      } catch (e) {
        void e;
      }
    };
  }, [user, projectId]);

  if (status === 'working') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 shadow-sm"
      >
        <Loader2 className="w-3 h-3 text-primary animate-spin" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">ИИ-Связь: Обработка</span>
      </motion.div>
    );
  }

  if (status === 'error') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-100 shadow-sm"
        title={lastError || 'Ошибка'}
      >
        <AlertCircle className="w-3 h-3 text-red-500" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-red-600">Системная ошибка</span>
      </motion.div>
    );
  }

  if (status === 'offline') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-white/50"
      >
        <WifiOff className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Связь: Оффлайн</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 shadow-sm"
    >
      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">ИИ-Ядро: Ожидание</span>
    </motion.div>
  );
};
