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
        className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 shadow-[0_0_15px_rgba(124,58,237,0.3)] animate-pulse"
      >
        <Loader2 className="w-3 h-3 text-primary animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Neural Link: Processing</span>
      </motion.div>
    );
  }

  if (status === 'error') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
        title={lastError || 'Error'}
      >
        <AlertCircle className="w-3 h-3 text-red-500" />
        <span className="text-[10px] font-black uppercase tracking-widest text-red-500">System Error: Fault Detected</span>
      </motion.div>
    );
  }

  if (status === 'offline') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-500/10 border border-slate-500/30"
      >
        <WifiOff className="w-3 h-3 text-slate-500" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Uplink: Offline</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
    >
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">AI Engine: Standby</span>
    </motion.div>
  );
};
