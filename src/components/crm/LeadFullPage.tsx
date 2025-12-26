import { useState, useEffect } from 'react';
import { Lead, useLeads } from '@/hooks/useLeads';
import { useLeadTouchpoints } from '@/hooks/useLeadTouchpoints';
import { useAuth } from '@/hooks/useAuth';
import { logStatusChange } from '@/hooks/useLeadStatusHistory';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Tag, 
  Target,
  DollarSign,
  Save,
  Loader2,
  X,
  ListTodo,
  History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { LeadChat } from './LeadChat';
import { LeadTasks } from './LeadTasks';
import { LeadStatusHistory } from './LeadStatusHistory';
import { toast } from 'sonner';
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

interface LeadFullPageProps {
  lead: Lead;
  projectId?: string | null;
  onClose: () => void;
  onUpdate?: () => void;
}

export const LeadFullPage = ({ lead, projectId, onClose, onUpdate }: LeadFullPageProps) => {
  const { user } = useAuth();
  const { updateLead } = useLeads(projectId || lead.project_id);
  const { touchpoints, loading: touchpointsLoading } = useLeadTouchpoints(
    lead.id,
    lead.client_id,
    projectId || lead.project_id
  );

  const [formData, setFormData] = useState({
    name: lead.name || '',
    phone: lead.phone || '',
    email: lead.email || '',
    status: lead.status || 'new',
    deal_amount: lead.deal_amount || 0,
  });
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [rightTab, setRightTab] = useState('chat');

  useEffect(() => {
    const changed = 
      formData.name !== (lead.name || '') ||
      formData.phone !== (lead.phone || '') ||
      formData.email !== (lead.email || '') ||
      formData.status !== (lead.status || 'new') ||
      formData.deal_amount !== (lead.deal_amount || 0);
    setHasChanges(changed);
  }, [formData, lead]);

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const oldStatus = lead.status || 'new';
      const newStatus = formData.status;
      const statusChanged = oldStatus !== newStatus;
      const amountChanged = formData.deal_amount !== (lead.deal_amount || 0);

      await updateLead(lead.id, {
        name: formData.name || null,
        phone: formData.phone || null,
        email: formData.email || null,
        status: formData.status,
        deal_amount: formData.deal_amount,
      });

      // Log status change to history
      if (statusChanged || amountChanged) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('user_id', user.id)
          .single();

        await logStatusChange(
          lead.id,
          user.id,
          profile?.name || user.email?.split('@')[0] || 'Пользователь',
          oldStatus,
          newStatus,
          amountChanged ? formData.deal_amount : undefined
        );
      }

      toast.success('Изменения сохранены');
      onUpdate?.();
      setHasChanges(false);
    } catch (error) {
      toast.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-background shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">
              {lead.name || 'Без имени'}
            </h1>
            <Badge className={statusColors[formData.status]}>
              {statusLabels[formData.status]}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button onClick={handleSave} disabled={saving} size="sm">
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Сохранить
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Lead Details */}
        <div className="w-1/2 border-r overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6 max-w-lg">
              {/* Contact Info */}
              <section>
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Контактные данные
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Имя</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Имя клиента"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Телефон</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+7 (___) ___-__-__"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@example.com"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <Separator />

              {/* Status & Deal */}
              <section>
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Статус и сделка
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="status">Статус</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="amount">Сумма сделки</Label>
                    <div className="relative">
                      <Input
                        id="amount"
                        type="number"
                        value={formData.deal_amount}
                        onChange={(e) => setFormData({ ...formData, deal_amount: Number(e.target.value) })}
                        placeholder="0"
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">₸</span>
                    </div>
                  </div>
                </div>
              </section>

              <Separator />

              {/* UTM Tags */}
              <section>
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  UTM-метки
                </h2>
                <div className="grid grid-cols-2 gap-2">
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
                    <p className="text-sm text-muted-foreground col-span-2">
                      UTM-метки отсутствуют
                    </p>
                  )}
                </div>
              </section>

              <Separator />

              {/* Touchpoints */}
              <section>
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  История касаний
                </h2>
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
                            {tp.campaign_name && <span>{tp.campaign_name}</span>}
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
              </section>

              {/* Tasks */}
              <section>
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <ListTodo className="w-4 h-4" />
                  Задачи
                </h2>
                <LeadTasks leadId={lead.id} />
              </section>

              <Separator />

              {/* Status History */}
              <section>
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  История изменений
                </h2>
                <LeadStatusHistory leadId={lead.id} />
              </section>

              {/* Meta Info */}
              <section className="pt-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Создано: {format(new Date(lead.created_at), 'd MMMM yyyy, HH:mm', { locale: ru })}
                  </span>
                </div>
              </section>
            </div>
          </ScrollArea>
        </div>

        {/* Right: Chat */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          <LeadChat leadId={lead.id} />
        </div>
      </div>
    </div>
  );
};
