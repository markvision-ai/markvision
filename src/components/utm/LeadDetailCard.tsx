import { 
  User, 
  Mail, 
  Phone, 
  Tag, 
  Calendar, 
  DollarSign,
  MapPin,
  Globe,
  Monitor,
  ArrowRight,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Lead } from '@/hooks/useLeads';
import { useLeadTouchpoints } from '@/hooks/useLeadTouchpoints';

interface LeadDetailCardProps {
  lead: Lead;
  projectId: string | null;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
};

const sourceTypeColors: Record<string, string> = {
  'paid': 'bg-orange-900/50 text-orange-200 border-orange-800',
  'organic': 'bg-green-900/50 text-green-200 border-green-800',
  'social': 'bg-blue-900/50 text-blue-200 border-blue-800',
  'email': 'bg-purple-900/50 text-purple-200 border-purple-800',
  'referral': 'bg-pink-900/50 text-pink-200 border-pink-800',
  'direct': 'bg-secondary text-secondary-foreground border-border',
};

export const LeadDetailCard = ({ lead, projectId }: LeadDetailCardProps) => {
  const { touchpoints, visits, loading } = useLeadTouchpoints(lead.id, lead.client_id, projectId);

  return (
    <div className="space-y-6">
      {/* Lead Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Контактная информация</h3>
          <div className="space-y-3">
            {lead.name && (
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{lead.name}</span>
              </div>
            )}
            {lead.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{lead.email}</span>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{lead.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{format(new Date(lead.created_at), 'dd MMMM yyyy, HH:mm', { locale: ru })}</span>
            </div>
            {lead.deal_amount && lead.deal_amount > 0 && (
              <div className="flex items-center gap-3">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold text-success">{formatCurrency(lead.deal_amount)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">UTM-метки заявки</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 px-3 bg-secondary rounded-lg">
              <span className="text-sm text-muted-foreground">utm_source</span>
              <Badge variant="outline">{lead.utm_source || '—'}</Badge>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-secondary rounded-lg">
              <span className="text-sm text-muted-foreground">utm_medium</span>
              <Badge variant="secondary">{lead.utm_medium || '—'}</Badge>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-secondary rounded-lg">
              <span className="text-sm text-muted-foreground">utm_campaign</span>
              <span className="text-sm font-medium">{lead.utm_campaign || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-secondary rounded-lg">
              <span className="text-sm text-muted-foreground">utm_content</span>
              <span className="text-sm">{lead.utm_content || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-secondary rounded-lg">
              <span className="text-sm text-muted-foreground">utm_term</span>
              <span className="text-sm">{lead.utm_term || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Customer Journey */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Путь клиента</h3>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Visits timeline */}
            {visits.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Всего визитов: {visits.length}
                </p>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                  <div className="space-y-4">
                    {visits.map((visit, index) => (
                      <div key={visit.id} className="relative flex gap-4 pl-10">
                        <div 
                          className={`absolute left-2.5 w-3 h-3 rounded-full border-2 ${
                            index === visits.length - 1 
                              ? 'bg-primary border-primary' 
                              : 'bg-background border-muted-foreground'
                          }`}
                        />
                        <div className="flex-1 bg-secondary rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="outline" 
                                className={sourceTypeColors[visit.source_type] || sourceTypeColors.direct}
                              >
                                {visit.utm_source || 'direct'}
                              </Badge>
                              {visit.utm_medium && (
                                <Badge variant="secondary">{visit.utm_medium}</Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(visit.visited_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                            </span>
                          </div>
                          {visit.utm_campaign && (
                            <p className="text-sm text-muted-foreground">
                              Кампания: {visit.utm_campaign}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            {visit.landing_page && (
                              <div className="flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                <span className="truncate max-w-[200px]">{visit.landing_page}</span>
                              </div>
                            )}
                            {visit.device_type && (
                              <div className="flex items-center gap-1">
                                <Monitor className="w-3 h-3" />
                                <span>{visit.device_type}</span>
                              </div>
                            )}
                            {visit.city && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span>{visit.city}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Lead conversion point */}
                    <div className="relative flex gap-4 pl-10">
                      <div className="absolute left-2.5 w-3 h-3 rounded-full bg-success border-2 border-success" />
                      <div className="flex-1 bg-success/10 border border-success/30 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-success text-success-foreground">Конверсия</Badge>
                            <span className="font-medium">Заявка получена</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(lead.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Touchpoints summary */}
            {touchpoints.length > 0 && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-3">Точки касания (Touchpoints)</h4>
                <div className="flex flex-wrap gap-2">
                  {touchpoints.map((tp, index) => (
                    <div key={tp.id} className="flex items-center gap-1">
                      <Badge 
                        variant="outline"
                        className={sourceTypeColors[tp.source_type] || sourceTypeColors.direct}
                      >
                        {tp.channel_name}
                      </Badge>
                      {index < touchpoints.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {visits.length === 0 && touchpoints.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>История визитов не найдена</p>
                <p className="text-sm mt-1">
                  Для отслеживания пути клиента необходимо передавать client_id в вебхуке
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Raw Data */}
      {lead.extra_data && (
        <>
          <Separator />
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Сырые данные вебхука</h3>
            <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
              {JSON.stringify(lead.extra_data, null, 2)}
            </pre>
          </div>
        </>
      )}
    </div>
  );
};
