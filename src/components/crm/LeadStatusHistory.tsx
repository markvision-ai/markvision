import { useLeadStatusHistory } from '@/hooks/useLeadStatusHistory';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ArrowRight, Loader2, History, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusLabels: Record<string, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  no_answer: 'Недозвон',
  appointment: 'Записан',
  paid: 'Оплачено',
  cancelled: 'Отказ',
};

const statusColors: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-600',
  in_progress: 'bg-yellow-500/20 text-yellow-600',
  no_answer: 'bg-orange-500/20 text-orange-600',
  appointment: 'bg-purple-500/20 text-purple-600',
  paid: 'bg-success/20 text-success',
  cancelled: 'bg-destructive/20 text-destructive',
};

interface LeadStatusHistoryProps {
  leadId: string;
}

export const LeadStatusHistory = ({ leadId }: LeadStatusHistoryProps) => {
  const { history, loading } = useLeadStatusHistory(leadId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-4">
        <History className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">История изменений пуста</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((item) => (
        <div
          key={item.id}
          className="relative pl-4 pb-3 border-l-2 border-border last:pb-0"
        >
          {/* Timeline dot */}
          <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-primary" />
          
          <div className="space-y-1">
            {/* Status change */}
            <div className="flex items-center gap-2 flex-wrap">
              {item.old_status && (
                <>
                  <Badge variant="secondary" className={cn('text-xs', statusColors[item.old_status])}>
                    {statusLabels[item.old_status] || item.old_status}
                  </Badge>
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                </>
              )}
              <Badge variant="secondary" className={cn('text-xs', statusColors[item.new_status])}>
                {statusLabels[item.new_status] || item.new_status}
              </Badge>
            </div>

            {/* Amount change */}
            {item.deal_amount_change && item.deal_amount_change > 0 && (
              <div className="flex items-center gap-1 text-xs text-success">
                <DollarSign className="w-3 h-3" />
                <span>{new Intl.NumberFormat('ru-RU').format(item.deal_amount_change)} ₸</span>
              </div>
            )}

            {/* Meta info */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{item.changed_by_name || 'Пользователь'}</span>
              <span>•</span>
              <span>{format(new Date(item.created_at), 'd MMM yyyy, HH:mm', { locale: ru })}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
