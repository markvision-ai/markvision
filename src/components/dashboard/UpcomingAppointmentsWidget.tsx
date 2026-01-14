import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { 
  Calendar, 
  ArrowRight, 
  Clock, 
  User, 
  Phone,
  Crown,
  Flame,
  Zap,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/externalSupabase';
import { format, parseISO, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Lead } from '@/hooks/useLeads';

interface UpcomingAppointmentsWidgetProps {
  projectId: string | null;
}

interface AppointmentEvent {
  id: string;
  lead_name: string;
  lead_phone: string | null;
  appointment_date: string;
  status: string | null;
  clinic_name: string | null;
  budget_tier: string | null;
  lead_score: number | null;
  extra_data: any;
}

export const UpcomingAppointmentsWidget = ({ projectId }: UpcomingAppointmentsWidgetProps) => {
  const [appointments, setAppointments] = useState<AppointmentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentEvent | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const effectiveProjectId = projectId || '64c94e87-630c-470e-8ab1-8f7c8c835efa';

  useEffect(() => {
    const fetchUpcoming = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const weekEnd = endOfWeek(addDays(now, 7), { weekStartsOn: 1 });

        // Fetch leads with appointment_date
        const { data, error } = await supabase
          .from('leads')
          .select('id, name, phone, appointment_date, status, extra_data, lead_score')
          .eq('project_id', effectiveProjectId)
          .not('appointment_date', 'is', null)
          .gte('appointment_date', now.toISOString())
          .lte('appointment_date', weekEnd.toISOString())
          .order('appointment_date', { ascending: true })
          .limit(5);

        if (error) throw error;

        const mapped: AppointmentEvent[] = (data || []).map((lead) => {
          const extraData = lead.extra_data as any;
          return {
            id: lead.id,
            lead_name: lead.name || extraData?.contact_name || 'Без имени',
            lead_phone: lead.phone,
            appointment_date: lead.appointment_date,
            status: lead.status,
            clinic_name: extraData?.clinic_name || extraData?.clinicName || null,
            budget_tier: extraData?.budget_tier || null,
            lead_score: lead.lead_score,
            extra_data: extraData,
          };
        });

        setAppointments(mapped);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcoming();
  }, [effectiveProjectId]);

  const getScoreTier = (appointment: AppointmentEvent) => {
    const budgetTier = appointment.budget_tier?.toUpperCase?.();
    const leadScore = appointment.lead_score || 0;

    if (budgetTier === 'MEGA' || leadScore >= 90) {
      return { tier: 'MEGA', color: 'bg-purple-500', emoji: '👑' };
    }
    if (budgetTier === 'HIGH' || leadScore >= 70) {
      return { tier: 'HIGH', color: 'bg-orange-500', emoji: '🔥' };
    }
    if (budgetTier === 'MEDIUM' || leadScore >= 40) {
      return { tier: 'MEDIUM', color: 'bg-blue-500', emoji: '⚡️' };
    }
    return null;
  };

  const handleViewAll = () => {
    navigate('/calendar');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Диагностики на неделю
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleViewAll} className="text-xs">
              Смотреть всё
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              Нет записей на эту неделю
            </div>
          ) : (
            <div className="space-y-2">
              {appointments.map((appointment) => {
                const tier = getScoreTier(appointment);
                return (
                  <div
                    key={appointment.id}
                    onClick={() => {
                      setSelectedAppointment(appointment);
                      setIsDrawerOpen(true);
                    }}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors",
                      "bg-muted/50 hover:bg-muted",
                      tier && `border-l-2 ${tier.color.replace('bg-', 'border-')}`
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {tier && <span className="text-sm">{tier.emoji}</span>}
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {appointment.clinic_name || appointment.lead_name}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>
                            {format(parseISO(appointment.appointment_date), 'd MMM, HH:mm', { locale: ru })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {appointment.status || 'Новая'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointment Details Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Детали записи
            </SheetTitle>
          </SheetHeader>
          
          {selectedAppointment && (
            <div className="mt-6 space-y-4">
              {getScoreTier(selectedAppointment) && (
                <Badge className={cn(
                  "text-sm",
                  getScoreTier(selectedAppointment)?.color,
                  'text-white'
                )}>
                  {getScoreTier(selectedAppointment)?.emoji} {getScoreTier(selectedAppointment)?.tier}
                </Badge>
              )}

              {selectedAppointment.clinic_name && (
                <div>
                  <label className="text-sm text-muted-foreground">Клиника</label>
                  <p className="font-bold text-lg">{selectedAppointment.clinic_name}</p>
                </div>
              )}

              <div>
                <label className="text-sm text-muted-foreground">Контакт</label>
                <p className="font-medium">{selectedAppointment.lead_name}</p>
              </div>

              {selectedAppointment.lead_phone && (
                <div>
                  <label className="text-sm text-muted-foreground">Телефон</label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${selectedAppointment.lead_phone}`} className="font-medium hover:text-primary">
                      {selectedAppointment.lead_phone}
                    </a>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm text-muted-foreground">Дата записи</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <p className="font-medium">
                    {format(parseISO(selectedAppointment.appointment_date), 'd MMMM yyyy, HH:mm', { locale: ru })}
                  </p>
                </div>
              </div>

              {selectedAppointment.extra_data && typeof selectedAppointment.extra_data === 'object' && (
                <div className="pt-4 border-t">
                  <label className="text-sm text-muted-foreground mb-2 block">Анкета</label>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                    {Object.entries(selectedAppointment.extra_data as Record<string, any>).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="font-medium">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};
