import { useLeadStatusHistory } from '@/hooks/useLeadStatusHistory';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ArrowRight, Loader2, History, DollarSign, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const statusLabels: Record<string, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  no_answer: 'Недозвон',
  appointment: 'Записан',
  paid: 'Оплачено',
  cancelled: 'Отказ',
};

const statusStyles: Record<string, { bg: string; text: string; gradient: string }> = {
  new: { bg: 'bg-blue-500/20', text: 'text-blue-500', gradient: 'from-blue-500 to-cyan-500' },
  in_progress: { bg: 'bg-yellow-500/20', text: 'text-yellow-500', gradient: 'from-yellow-500 to-orange-500' },
  no_answer: { bg: 'bg-orange-500/20', text: 'text-orange-500', gradient: 'from-orange-500 to-red-500' },
  appointment: { bg: 'bg-purple-500/20', text: 'text-purple-500', gradient: 'from-purple-500 to-pink-500' },
  paid: { bg: 'bg-success/20', text: 'text-success', gradient: 'from-emerald-500 to-green-500' },
  cancelled: { bg: 'bg-destructive/20', text: 'text-destructive', gradient: 'from-red-500 to-rose-500' },
};

interface LeadStatusHistoryProps {
  leadId: string;
}

export const LeadStatusHistory = ({ leadId }: LeadStatusHistoryProps) => {
  const { history, loading } = useLeadStatusHistory(leadId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center mx-auto mb-3">
          <Sparkles className="w-6 h-6 text-muted-foreground/50" />
        </div>
        <p className="text-sm text-muted-foreground">История изменений пуста</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((item, index) => {
        const newStyle = statusStyles[item.new_status] || statusStyles.new;
        const oldStyle = item.old_status ? statusStyles[item.old_status] : null;
        
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative pl-5 pb-4 last:pb-0"
          >
            {/* Timeline line */}
            {index < history.length - 1 && (
              <div className="absolute left-[7px] top-3 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 to-primary/10" />
            )}
            
            {/* Timeline dot */}
            <div className={cn(
              'absolute left-0 top-0 w-[15px] h-[15px] rounded-full bg-gradient-to-br flex items-center justify-center',
              newStyle.gradient
            )}>
              <div className="w-1.5 h-1.5 rounded-full bg-background" />
            </div>
            
            <div className="space-y-2 ml-2">
              {/* Status change */}
              <div className="flex items-center gap-2 flex-wrap">
                {item.old_status && oldStyle && (
                  <>
                    <Badge variant="secondary" className={cn('text-xs border-0', oldStyle.bg, oldStyle.text)}>
                      {statusLabels[item.old_status] || item.old_status}
                    </Badge>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </>
                )}
                <Badge variant="secondary" className={cn('text-xs border-0', newStyle.bg, newStyle.text)}>
                  {statusLabels[item.new_status] || item.new_status}
                </Badge>
              </div>

              {/* Amount change */}
              {item.deal_amount_change && item.deal_amount_change > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-success bg-success/10 px-2 py-1 rounded-lg w-fit">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>{new Intl.NumberFormat('ru-RU').format(item.deal_amount_change)} ₸</span>
                </div>
              )}

              {/* Meta info */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium">{item.changed_by_name || 'Пользователь'}</span>
                <span>•</span>
                <span>{format(new Date(item.created_at), 'd MMM yyyy, HH:mm', { locale: ru })}</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
