import { useState, useEffect, useMemo } from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  DollarSign,
  Crown,
  Flame,
  Zap,
  Loader2,
  MessageCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Lead } from '@/hooks/useLeads';
import { safeFormat, safeParseDate, isValidDate } from '@/lib/dateUtils';

interface CalendarPageProps {
  projectId: string | null;
}

interface CalendarEvent {
  id: string;
  lead_id: string;
  lead_name: string;
  lead_phone: string | null;
  appointment_date: string;
  deal_amount: number | null;
  status: string | null;
  clinic_name: string | null;
  budget_tier: string | null;
  lead_score: number | null;
}

export const CalendarPage = ({ projectId }: CalendarPageProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [leadDetails, setLeadDetails] = useState<Lead | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Fetch appointments from leads table
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!projectId) {
        setEvents([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('id, name, phone, appointment_date, deal_amount, status, extra_data, lead_score')
          .eq('project_id', projectId)
          .not('appointment_date', 'is', null)
          .order('appointment_date', { ascending: true });

        if (error) throw error;

        const mapped: CalendarEvent[] = (data || []).map((lead) => {
          const extraData = lead.extra_data as any;
          return {
            id: lead.id,
            lead_id: lead.id,
            lead_name: lead.name || extraData?.contact_name || 'Без имени',
            lead_phone: lead.phone,
            appointment_date: lead.appointment_date,
            deal_amount: lead.deal_amount,
            status: lead.status,
            clinic_name: extraData?.clinic_name || extraData?.clinicName || null,
            budget_tier: extraData?.budget_tier || null,
            lead_score: lead.lead_score,
          };
        });

        // Also fetch leads with selected_date in extra_data
        const { data: extraDateLeads, error: extraError } = await supabase
          .from('leads')
          .select('id, name, phone, deal_amount, status, extra_data, lead_score')
          .eq('project_id', projectId)
          .is('appointment_date', null);

        if (!extraError && extraDateLeads) {
          extraDateLeads.forEach((lead) => {
            const extraData = lead.extra_data as any;
            if (extraData?.selected_date) {
              // Parse selected_date (may be in various formats)
              const dateStr = extraData.selected_date;
              let parsedDate: Date | null = null;
              try {
                // Try ISO format
                parsedDate = new Date(dateStr);
                if (isNaN(parsedDate.getTime())) {
                  // Try DD.MM.YYYY
                  const parts = dateStr.split('.');
                  if (parts.length === 3) {
                    parsedDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                  }
                }
              } catch {
                parsedDate = null;
              }

              if (parsedDate && !isNaN(parsedDate.getTime())) {
                mapped.push({
                  id: lead.id,
                  lead_id: lead.id,
                  lead_name: lead.name || extraData?.contact_name || 'Без имени',
                  lead_phone: lead.phone,
                  appointment_date: parsedDate.toISOString(),
                  deal_amount: lead.deal_amount,
                  status: lead.status,
                  clinic_name: extraData?.clinic_name || extraData?.clinicName || null,
                  budget_tier: extraData?.budget_tier || null,
                  lead_score: lead.lead_score,
                });
              }
            }
          });
        }

        setEvents(mapped);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [projectId]);

  // Get days to display based on view mode
  const displayDays = useMemo(() => {
    if (viewMode === 'month') {
      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
      const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    }
  }, [currentDate, viewMode]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};
    events.forEach((event) => {
      const parsedDate = safeParseDate(event.appointment_date);
      if (parsedDate) {
        const dateKey = safeFormat(parsedDate, 'yyyy-MM-dd', '');
        if (dateKey) {
          if (!grouped[dateKey]) grouped[dateKey] = [];
          grouped[dateKey].push(event);
        }
      }
    });
    return grouped;
  }, [events]);

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (viewMode === 'month') {
      setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    } else {
      setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    }
  };

  const handleEventClick = async (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsDrawerOpen(true);

    // Fetch full lead details
    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('id', event.lead_id)
      .maybeSingle();

    if (data) {
      setLeadDetails(data as Lead);
    }
  };

  const getScoreTier = (event: CalendarEvent) => {
    const budgetTier = event.budget_tier?.toUpperCase?.();
    const leadScore = event.lead_score || 0;

    if (budgetTier === 'MEGA' || leadScore >= 90) {
      return { tier: 'MEGA', color: 'bg-purple-500', icon: <Crown className="w-3 h-3" />, emoji: '👑' };
    }
    if (budgetTier === 'HIGH' || leadScore >= 70) {
      return { tier: 'HIGH', color: 'bg-orange-500', icon: <Flame className="w-3 h-3" />, emoji: '🔥' };
    }
    if (budgetTier === 'MEDIUM' || leadScore >= 40) {
      return { tier: 'MEDIUM', color: 'bg-blue-500', icon: <Zap className="w-3 h-3" />, emoji: '⚡️' };
    }
    return null;
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'Записан': return 'bg-purple-500/20 text-purple-600 border-purple-500/30';
      case 'Оплачено': return 'bg-green-500/20 text-green-600 border-green-500/30';
      case 'Новая': return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
      case 'В работе': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
      case 'Отказ': return 'bg-red-500/20 text-red-600 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-primary" />
            MarkCalendar
          </h2>
          <p className="text-muted-foreground">Расписание визитов и приёмов</p>
        </div>

        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'month' | 'week')}>
            <TabsList>
              <TabsTrigger value="month">Месяц</TabsTrigger>
              <TabsTrigger value="week">Неделя</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Navigation */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => handleNavigate('prev')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <CardTitle className="text-lg">
              {viewMode === 'month' 
                ? safeFormat(currentDate, 'LLLL yyyy', 'Месяц')
                : `${safeFormat(startOfWeek(currentDate, { weekStartsOn: 1 }), 'd MMM', '')} - ${safeFormat(endOfWeek(currentDate, { weekStartsOn: 1 }), 'd MMM yyyy', '')}`
              }
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => handleNavigate('next')}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Week days header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className={cn(
            "grid grid-cols-7 gap-1",
            viewMode === 'week' ? 'min-h-[400px]' : ''
          )}>
            {displayDays.map((day) => {
              const dateKey = safeFormat(day, 'yyyy-MM-dd', '');
              const dayEvents = dateKey ? (eventsByDate[dateKey] || []) : [];
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentDate);

              return (
                <div
                  key={dateKey}
                  className={cn(
                    "p-2 rounded-lg border transition-colors min-h-[100px]",
                    viewMode === 'week' && 'min-h-[300px]',
                    isToday && 'bg-primary/5 border-primary/30',
                    !isCurrentMonth && 'opacity-40',
                    'hover:border-primary/50'
                  )}
                >
                  <div className={cn(
                    "text-sm font-medium mb-1",
                    isToday && 'text-primary'
                  )}>
                    {safeFormat(day, 'd', '?')}
                  </div>

                  <div className="space-y-1">
                    {dayEvents.slice(0, viewMode === 'week' ? 10 : 3).map((event) => {
                      const tier = getScoreTier(event);
                      return (
                        <div
                          key={event.id}
                          onClick={() => handleEventClick(event)}
                          className={cn(
                            "text-xs p-1.5 rounded cursor-pointer transition-all hover:scale-[1.02]",
                            tier ? `${tier.color}/20` : 'bg-muted',
                            'border border-transparent hover:border-primary/30'
                          )}
                        >
                          <div className="flex items-center gap-1 truncate">
                            {tier && <span>{tier.emoji}</span>}
                            <span className="font-medium truncate">
                              {event.clinic_name || event.lead_name}
                            </span>
                          </div>
                          {viewMode === 'week' && event.lead_phone && (
                            <div className="text-[10px] text-muted-foreground truncate">
                              {event.lead_phone}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {dayEvents.length > (viewMode === 'week' ? 10 : 3) && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{dayEvents.length - (viewMode === 'week' ? 10 : 3)} ещё
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming appointments list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Ближайшие записи
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {events
              .filter((e) => new Date(e.appointment_date) >= new Date())
              .slice(0, 10)
              .map((event) => {
                const tier = getScoreTier(event);
                return (
                  <div
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {tier && <span className="text-lg">{tier.emoji}</span>}
                      <div>
                        <p className="font-medium">
                          {event.clinic_name || event.lead_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {safeFormat(event.appointment_date, 'd MMMM, HH:mm', 'Дата неизвестна')}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(event.status)}>
                      {event.status || 'Новая'}
                    </Badge>
                  </div>
                );
              })}
            {events.filter((e) => new Date(e.appointment_date) >= new Date()).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Нет предстоящих записей
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lead Details Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Детали записи
            </SheetTitle>
          </SheetHeader>
          
          {selectedEvent && (
            <div className="mt-6 space-y-4">
              {/* Tier badge */}
              {getScoreTier(selectedEvent) && (
                <Badge className={cn(
                  "text-sm",
                  getScoreTier(selectedEvent)?.color,
                  'text-white'
                )}>
                  {getScoreTier(selectedEvent)?.emoji} {getScoreTier(selectedEvent)?.tier}
                </Badge>
              )}

              {/* Clinic Name */}
              {selectedEvent.clinic_name && (
                <div>
                  <label className="text-sm text-muted-foreground">Клиника</label>
                  <p className="font-bold text-lg">{selectedEvent.clinic_name}</p>
                </div>
              )}

              {/* Lead Name */}
              <div>
                <label className="text-sm text-muted-foreground">Контакт</label>
                <p className="font-medium">{selectedEvent.lead_name}</p>
              </div>

              {/* Phone */}
              {selectedEvent.lead_phone && (
                <div>
                  <label className="text-sm text-muted-foreground">Телефон</label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${selectedEvent.lead_phone}`} className="font-medium hover:text-primary">
                      {selectedEvent.lead_phone}
                    </a>
                  </div>
                </div>
              )}

              {/* Appointment Date */}
              <div>
                <label className="text-sm text-muted-foreground">Дата записи</label>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                  <p className="font-medium">
                    {safeFormat(selectedEvent.appointment_date, 'd MMMM yyyy, HH:mm', 'Дата неизвестна')}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="text-sm text-muted-foreground">Статус</label>
                <Badge className={cn("mt-1", getStatusColor(selectedEvent.status))}>
                  {selectedEvent.status || 'Новая'}
                </Badge>
              </div>

              {/* Deal Amount */}
              {selectedEvent.deal_amount && selectedEvent.deal_amount > 0 && (
                <div>
                  <label className="text-sm text-muted-foreground">Сумма сделки</label>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-success" />
                    <p className="font-bold text-success">
                      {new Intl.NumberFormat('ru-RU').format(Math.round(selectedEvent.deal_amount))} ₸
                    </p>
                  </div>
                </div>
              )}

              {/* Chat History */}
              {leadDetails?.extra_data && (leadDetails.extra_data as any)?.chat_history && (
                <div className="pt-4 border-t">
                  <label className="text-sm text-muted-foreground mb-2 block flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    История переписки
                  </label>
                  <div className="bg-muted/30 rounded-lg p-3 space-y-3 max-h-[300px] overflow-y-auto">
                    {Array.isArray((leadDetails.extra_data as any).chat_history) 
                      ? (leadDetails.extra_data as any).chat_history.map((msg: any, idx: number) => (
                          <div 
                            key={idx} 
                            className={cn(
                              "p-2.5 rounded-lg text-sm",
                              msg.role === 'assistant' || msg.sender === 'bot' 
                                ? "bg-primary/10 border-l-2 border-primary" 
                                : "bg-muted"
                            )}
                          >
                            <p className="text-xs text-muted-foreground mb-1 font-medium">
                              {msg.role === 'assistant' || msg.sender === 'bot' ? '🤖 MarkVision AI' : '👤 Клиент'}
                            </p>
                            <p className="whitespace-pre-wrap">{msg.content || msg.text || msg.message}</p>
                          </div>
                        ))
                      : <p className="text-sm text-muted-foreground">История чата недоступна</p>
                    }
                  </div>
                </div>
              )}

              {/* Lead Extra Data */}
              {leadDetails?.extra_data && typeof leadDetails.extra_data === 'object' && (
                <div className="pt-4 border-t">
                  <label className="text-sm text-muted-foreground mb-2 block">Анкета лида</label>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                    {Object.entries(leadDetails.extra_data as Record<string, any>)
                      .filter(([key]) => key !== 'chat_history') // Exclude chat_history from general display
                      .map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground capitalize">
                            {key.replace(/_/g, ' ')}
                          </span>
                          <span className="font-medium text-right max-w-[200px] truncate">
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
    </div>
  );
};
