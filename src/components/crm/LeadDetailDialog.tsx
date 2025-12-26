import { Lead } from '@/hooks/useLeads';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Phone, 
  Calendar, 
  Tag, 
  Target, 
  Link, 
  MessageSquare,
  DollarSign
} from 'lucide-react';
import { useLeadTouchpoints } from '@/hooks/useLeadTouchpoints';
import { Loader2 } from 'lucide-react';

const statusLabels: Record<string, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  no_answer: 'Недозвон',
  appointment: 'Записан',
  paid: 'Оплачено',
  cancelled: 'Отказ',
};

interface LeadDetailDialogProps {
  lead: Lead | null;
  onClose: () => void;
  projectId?: string | null;
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-600',
  in_progress: 'bg-yellow-500/20 text-yellow-600',
  no_answer: 'bg-orange-500/20 text-orange-600',
  appointment: 'bg-purple-500/20 text-purple-600',
  paid: 'bg-success/20 text-success',
  cancelled: 'bg-destructive/20 text-destructive',
};

export const LeadDetailDialog = ({ lead, onClose, projectId }: LeadDetailDialogProps) => {
  const { touchpoints, loading: touchpointsLoading } = useLeadTouchpoints(
    lead?.id || null,
    lead?.client_id || null,
    projectId || lead?.project_id || null
  );

  if (!lead) return null;

  const status = lead.status || 'new';

  return (
    <Dialog open={!!lead} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-xl">
              {lead.name || 'Без имени'}
            </DialogTitle>
            <Badge className={statusColors[status]}>
              {statusLabels[status]}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lead.phone && (
              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                <Phone className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Телефон</p>
                  <p className="font-medium">{lead.phone}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Дата создания</p>
                <p className="font-medium">
                  {format(new Date(lead.created_at), 'd MMMM yyyy, HH:mm', { locale: ru })}
                </p>
              </div>
            </div>
            {lead.deal_amount && lead.deal_amount > 0 && (
              <div className="flex items-center gap-3 p-3 bg-success/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-success" />
                <div>
                  <p className="text-xs text-muted-foreground">Сумма сделки</p>
                  <p className="font-medium text-success">
                    {new Intl.NumberFormat('ru-RU').format(lead.deal_amount)} ₸
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* UTM Tags */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              UTM-метки
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {lead.utm_source && (
                <div className="p-2 bg-secondary/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Source</p>
                  <p className="text-sm font-medium">{lead.utm_source}</p>
                </div>
              )}
              {lead.utm_medium && (
                <div className="p-2 bg-secondary/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Medium</p>
                  <p className="text-sm font-medium">{lead.utm_medium}</p>
                </div>
              )}
              {lead.utm_campaign && (
                <div className="p-2 bg-secondary/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Campaign</p>
                  <p className="text-sm font-medium">{lead.utm_campaign}</p>
                </div>
              )}
              {lead.utm_content && (
                <div className="p-2 bg-secondary/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Content</p>
                  <p className="text-sm font-medium">{lead.utm_content}</p>
                </div>
              )}
              {lead.utm_term && (
                <div className="p-2 bg-secondary/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Term</p>
                  <p className="text-sm font-medium">{lead.utm_term}</p>
                </div>
              )}
              {!lead.utm_source && !lead.utm_medium && !lead.utm_campaign && (
                <p className="text-sm text-muted-foreground col-span-3">
                  UTM-метки отсутствуют
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Touchpoints / Customer Journey */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              История касаний
            </h4>
            
            {touchpointsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : touchpoints.length > 0 ? (
              <div className="space-y-2">
                {touchpoints.map((tp, index) => (
                  <div
                    key={tp.id}
                    className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{tp.channel_name}</span>
                        {tp.is_first && (
                          <Badge variant="outline" className="text-xs">Первый</Badge>
                        )}
                        {tp.is_last && (
                          <Badge variant="outline" className="text-xs">Последний</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {tp.campaign_name && (
                          <span>{tp.campaign_name}</span>
                        )}
                        <span>•</span>
                        <span>
                          {format(new Date(tp.touched_at), 'd MMM yyyy, HH:mm', { locale: ru })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                История касаний недоступна
              </p>
            )}
          </div>

          {/* Extra Data */}
          {lead.extra_data && Object.keys(lead.extra_data).length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Дополнительные данные
                </h4>
                <pre className="text-xs bg-secondary/50 p-3 rounded-lg overflow-x-auto">
                  {JSON.stringify(lead.extra_data, null, 2)}
                </pre>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
