import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Users, CheckCircle, Clock, Send, XCircle, Gift, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Referral {
  id: string;
  referee_name: string;
  referee_phone: string;
  certificate_value: number;
  status: 'pending' | 'sent' | 'opened' | 'converted' | 'cancelled';
  sent_at: string | null;
  converted_at: string | null;
  created_at: string;
}

interface ReferralsListProps {
  leadId: string;
  projectId: string;
}

const statusConfig = {
  pending: {
    label: 'В обработке',
    icon: Clock,
    color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    iconColor: 'text-amber-500'
  },
  sent: {
    label: 'Отправлено',
    icon: Send,
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    iconColor: 'text-blue-500'
  },
  opened: {
    label: 'Открыто',
    icon: Gift,
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    iconColor: 'text-purple-500'
  },
  converted: {
    label: 'Пришёл',
    icon: CheckCircle,
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    iconColor: 'text-blue-500'
  },
  cancelled: {
    label: 'Отменено',
    icon: XCircle,
    color: 'bg-red-500/10 text-red-500 border-red-500/20',
    iconColor: 'text-red-500'
  }
};

export const ReferralsList = ({ leadId, projectId }: ReferralsListProps) => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReferrals = async () => {
      setLoading(true);
      try {
        const { data, error } = await (supabase as any)
          .from('referrals')
          .select('*')
          .eq('referrer_id', leadId)
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Map DB response to UI interface
        const mappedReferrals: Referral[] = (data || []).map((item: any) => ({
          id: item.id,
          referee_name: item.friend_name || 'Неизвестно',
          referee_phone: item.friend_phone || '',
          certificate_value: item.certificate_amount || 0,
          status: (item.status as any) || 'pending',
          sent_at: item.created_at, // Fallback
          converted_at: item.status === 'converted' ? item.created_at : null, // Fallback
          created_at: item.created_at || new Date().toISOString()
        }));
        
        setReferrals(mappedReferrals);
      } catch (error) {
        console.error('Error fetching referrals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReferrals();

    // Real-time subscription
    const channel = supabase
      .channel('referrals-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'referrals',
          filter: `referrer_lead_id=eq.${leadId}`
        },
        () => {
          fetchReferrals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId, projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (referrals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <p className="text-sm font-medium text-foreground mb-1">
          Ещё нет приглашённых друзей
        </p>
        <p className="text-xs text-muted-foreground">
          Нажмите "Подарить сертификаты" чтобы запустить виральную петлю
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {referrals.map((referral, index) => {
          const config = statusConfig[referral.status];
          const Icon = config.icon;

          return (
            <motion.div
              key={referral.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "relative overflow-hidden rounded-xl p-4 border transition-all",
                "bg-white/10 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 hover:border-primary/30"
              )}
            >
              {/* Background decoration */}
              <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/5 to-indigo-500/5 blur-2xl" />

              <div className="relative flex items-start gap-4">
                {/* Avatar */}
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
                  referral.status === 'converted' 
                    ? "bg-gradient-to-br from-blue-500 to-cyan-500 shadow-2xl shadow-blue-900/5 shadow-blue-500/30"
                    : "bg-gradient-to-br from-blue-500/20 to-indigo-500/20"
                )}>
                  <Icon className={cn(
                    "w-5 h-5",
                    referral.status === 'converted' ? "text-white" : config.iconColor
                  )} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-semibold text-sm text-foreground truncate">
                        {referral.referee_name}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {referral.referee_phone}
                      </p>
                    </div>
                    <Badge 
                      variant="outline"
                      className={cn("whitespace-nowrap text-xs", config.color)}
                    >
                      {config.label}
                    </Badge>
                  </div>

                  {/* Certificate info */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Gift className="w-3.5 h-3.5" />
                      <span>{referral.certificate_value.toLocaleString('ru-RU')} ₸</span>
                    </div>
                    <div>
                      {referral.converted_at ? (
                        <span className="text-blue-500 font-medium">
                          Пришёл {format(new Date(referral.converted_at), 'd MMM', { locale: ru })}
                        </span>
                      ) : referral.sent_at ? (
                        <span>
                          Отправлено {format(new Date(referral.sent_at), 'd MMM', { locale: ru })}
                        </span>
                      ) : (
                        <span>
                          Создано {format(new Date(referral.created_at), 'd MMM', { locale: ru })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-between px-4 py-3 bg-muted/30 rounded-lg mt-4"
      >
        <span className="text-xs font-medium text-muted-foreground">
          Всего приглашений
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">
            {referrals.length}
          </span>
          <span className="text-xs text-muted-foreground">
            • {referrals.filter(r => r.status === 'converted').length} пришли
          </span>
        </div>
      </motion.div>
    </div>
  );
};
