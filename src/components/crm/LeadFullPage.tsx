import { useState, useEffect } from 'react';
import { Lead, useLeads } from '@/hooks/useLeads';
import { useLeadTouchpoints } from '@/hooks/useLeadTouchpoints';
import { useAuth } from '@/hooks/useAuth';
import { logStatusChange } from '@/hooks/useLeadStatusHistory';
import { supabase } from '@/lib/externalSupabase';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Calendar, 
  Tag, 
  Target,
  DollarSign,
  Save,
  Loader2,
  X,
  ListTodo,
  History,
  MessageCircle,
  Activity,
  RefreshCw,
  Gift,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { ViralLoopDialog } from './ViralLoopDialog';
import { ReferralsList } from './ReferralsList';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const statusLabels: Record<string, string> = {
  new: 'Новый лид',
  invoiced: 'Счет выставлен',
  paid: 'Оплачено',
  appointment: 'Записан',
  in_progress: 'В работе',
  no_answer: 'Недозвон',
  cancelled: 'Отказ',
};

const statusStyles: Record<string, { bg: string; text: string; gradient: string }> = {
  new: { bg: 'bg-blue-500/20', text: 'text-blue-500', gradient: 'from-blue-500 to-cyan-500' },
  invoiced: { bg: 'bg-indigo-500/20', text: 'text-indigo-500', gradient: 'from-indigo-500 to-violet-500' },
  paid: { bg: 'bg-success/20', text: 'text-success', gradient: 'from-emerald-500 to-green-500' },
  appointment: { bg: 'bg-purple-500/20', text: 'text-purple-500', gradient: 'from-purple-500 to-pink-500' },
  in_progress: { bg: 'bg-yellow-500/20', text: 'text-yellow-500', gradient: 'from-yellow-500 to-orange-500' },
  no_answer: { bg: 'bg-orange-500/20', text: 'text-orange-500', gradient: 'from-orange-500 to-red-500' },
  cancelled: { bg: 'bg-destructive/20', text: 'text-destructive', gradient: 'from-red-500 to-rose-500' },
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
    status: lead.status || 'new',
    deal_amount: lead.deal_amount || 0,
  });
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [diagnosisLoading, setDiagnosisLoading] = useState(false);
  const [viralLoopOpen, setViralLoopOpen] = useState(false);
  const [refreshReferrals, setRefreshReferrals] = useState(0);

  // Check if diagnosis has already been done (status is appointment or paid)
  const isDiagnosisDone = formData.status === 'appointment' || formData.status === 'paid';
  const isDiagnosisDisabled = formData.status === 'cancelled';

  const handleDiagnosisClick = async () => {
    if (isDiagnosisDisabled) return;
    
    setDiagnosisLoading(true);
    try {
      // If status is new or no_answer, change to in_progress first
      if (formData.status === 'new' || formData.status === 'no_answer') {
        const { error } = await supabase
          .from('leads')
          .update({ 
            status: 'in_progress', 
            updated_at: new Date().toISOString() 
          })
          .eq('id', lead.id);

        if (error) throw error;

        // Log status change
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('user_id', user.id)
            .single();

          await logStatusChange(
            lead.id,
            user.id,
            profile?.name || user.email?.split('@')[0] || 'Пользователь',
            formData.status,
            'in_progress'
          );
        }

        setFormData(prev => ({ ...prev, status: 'in_progress' }));
        onUpdate?.();
        
        toast.success('Статус обновлен, переход к диагностике...');
      } else {
        toast.info('Переход к диагностике...');
      }
      
      // Build URL and open in new tab AFTER successful status update
      const diagnosticsUrl = `https://diagnostoka.vercel.app/?lead_id=${lead.id}`;
      window.open(diagnosticsUrl, '_blank');
    } catch (error) {
      console.error('Error updating status for diagnosis:', error);
      toast.error('Ошибка обновления статуса');
    } finally {
      setDiagnosisLoading(false);
    }
  };

  useEffect(() => {
    const changed = 
      formData.name !== (lead.name || '') ||
      formData.phone !== (lead.phone || '') ||
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
        status: formData.status,
        deal_amount: formData.deal_amount,
      });

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

  const currentStatusStyle = statusStyles[formData.status] || statusStyles.new;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-50 bg-background flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Premium Header */}
        <header className="flex items-center justify-between px-4 md:px-6 py-4 border-b crm-card-glass shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-primary/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg', currentStatusStyle.gradient)}>
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold">
                  {lead.name || 'Без имени'}
                </h1>
                <Badge className={cn('mt-1', currentStatusStyle.bg, currentStatusStyle.text, 'border-0')}>
                  {statusLabels[formData.status]}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Button 
                  onClick={handleSave} 
                  disabled={saving} 
                  size="sm"
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Сохранить
                </Button>
              </motion.div>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-destructive/10">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Lead Details */}
          <div className="w-1/2 border-r border-border/50 overflow-hidden flex flex-col bg-gradient-to-b from-background to-muted/20">
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6 max-w-lg">
                {/* Contact Info Section */}
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="crm-card-glass rounded-xl p-5"
                >
                  <h2 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <User className="w-4 h-4 text-primary-foreground" />
                    </div>
                    Контактные данные
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-xs font-medium text-muted-foreground">Имя</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Имя клиента"
                        className="mt-1.5 bg-background/50 border-border/50 focus:border-primary"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-xs font-medium text-muted-foreground">Телефон</Label>
                      <div className="relative mt-1.5">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60" />
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+7 (___) ___-__-__"
                          className="pl-10 bg-background/50 border-border/50 focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>
                </motion.section>

                {/* Status & Deal Section */}
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="crm-card-glass rounded-xl p-5"
                >
                  <h2 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-success to-emerald-500 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-success-foreground" />
                    </div>
                    Статус и сделка
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="status" className="text-xs font-medium text-muted-foreground">Статус</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger className="mt-1.5 bg-background/50 border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <div className={cn('w-2 h-2 rounded-full bg-gradient-to-r', statusStyles[key]?.gradient)} />
                                {label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="amount" className="text-xs font-medium text-muted-foreground">Сумма сделки</Label>
                      <div className="relative mt-1.5">
                        <Input
                          id="amount"
                          type="number"
                          value={formData.deal_amount}
                          onChange={(e) => setFormData({ ...formData, deal_amount: Number(e.target.value) })}
                          placeholder="0"
                          className="pr-10 bg-background/50 border-border/50 focus:border-primary"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₸</span>
                      </div>
                    </div>
                    {/* Diagnosis Button */}
                    <div className="pt-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={handleDiagnosisClick}
                              disabled={isDiagnosisDisabled || diagnosisLoading}
                              className={cn(
                                'w-full text-white transition-all',
                                isDiagnosisDone 
                                  ? 'bg-purple-500 hover:bg-purple-600' 
                                  : 'bg-blue-500 hover:bg-blue-600',
                                isDiagnosisDisabled && 'opacity-50 cursor-not-allowed'
                              )}
                            >
                              {diagnosisLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : isDiagnosisDone ? (
                                <RefreshCw className="w-4 h-4 mr-2" />
                              ) : (
                                <Activity className="w-4 h-4 mr-2" />
                              )}
                              {isDiagnosisDone ? 'Повторить диагностику' : 'Провести диагностику'}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs">
                            <p>Данные диагностики автоматически сохранятся в историю этого клиента</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {/* Viral Loop Button */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={() => setViralLoopOpen(true)}
                              disabled={isDiagnosisDisabled}
                              className={cn(
                                'w-full text-white transition-all shadow-lg',
                                'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500',
                                'hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600',
                                'hover:shadow-blue-500/50 hover:scale-[1.02]',
                                isDiagnosisDisabled && 'opacity-50 cursor-not-allowed'
                              )}
                            >
                              <Gift className="w-4 h-4 mr-2" />
                              Подарить 3 сертификата друзьям 🎁
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs">
                            <p>Запустить виральную петлю: отправить сертификаты на 10 000 ₸ друзьям пациента</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </motion.section>


                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="crm-card-glass rounded-xl p-5"
                >
                  <h2 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Tag className="w-4 h-4 text-white" />
                    </div>
                    UTM-метки
                  </h2>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'utm_source', label: 'Source', value: lead.utm_source },
                      { key: 'utm_medium', label: 'Medium', value: lead.utm_medium },
                      { key: 'utm_campaign', label: 'Campaign', value: lead.utm_campaign },
                      { key: 'utm_content', label: 'Content', value: lead.utm_content },
                      { key: 'utm_term', label: 'Term', value: lead.utm_term },
                    ].filter(item => item.value).map(item => (
                      <div key={item.key} className="p-3 bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg border border-border/30">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{item.label}</p>
                        <p className="text-sm font-semibold truncate">{item.value}</p>
                      </div>
                    ))}
                    {!lead.utm_source && !lead.utm_medium && !lead.utm_campaign && (
                      <p className="text-sm text-muted-foreground col-span-2 text-center py-4">
                        UTM-метки отсутствуют
                      </p>
                    )}
                  </div>
                </motion.section>

                {/* Touchpoints Section */}
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="crm-card-glass rounded-xl p-5"
                >
                  <h2 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                      <Target className="w-4 h-4 text-white" />
                    </div>
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
                          className="flex items-start gap-3 p-3 bg-gradient-to-r from-muted/30 to-transparent rounded-lg border border-border/20"
                        >
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-primary-foreground">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-semibold text-sm">{tp.channel_name}</span>
                              {tp.is_first && (
                                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">Первый</Badge>
                              )}
                              {tp.is_last && (
                                <Badge variant="outline" className="text-[10px] border-success/30 text-success">Последний</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {tp.campaign_name && <span>{tp.campaign_name}</span>}
                              {tp.campaign_name && <span>•</span>}
                              <span>
                                {format(new Date(tp.touched_at), 'd MMM yyyy, HH:mm', { locale: ru })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      История касаний недоступна
                    </p>
                  )}
                </motion.section>

                {/* Tasks Section */}
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="crm-card-glass rounded-xl p-5"
                >
                  <h2 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                      <ListTodo className="w-4 h-4 text-white" />
                    </div>
                    Задачи
                  </h2>
                  <LeadTasks leadId={lead.id} />
                </motion.section>

                {/* Referrals Section */}
                <motion.section
                  key={refreshReferrals}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                  className="crm-card-glass rounded-xl p-5"
                >
                  <h2 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    Приглашенные друзья
                  </h2>
                  <ReferralsList leadId={lead.id} projectId={projectId || lead.project_id} />
                </motion.section>

                {/* Status History Section */}
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="crm-card-glass rounded-xl p-5"
                >
                  <h2 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center">
                      <History className="w-4 h-4 text-white" />
                    </div>
                    История изменений
                  </h2>
                  <LeadStatusHistory leadId={lead.id} />
                </motion.section>

                {/* Meta Info */}
                <motion.div 
                  className="flex items-center gap-2 text-xs text-muted-foreground p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    Создано: {format(new Date(lead.created_at), 'd MMMM yyyy, HH:mm', { locale: ru })}
                  </span>
                </motion.div>
              </div>
            </ScrollArea>
          </div>

          {/* Right: Chat */}
          <motion.div 
            className="w-1/2 flex flex-col overflow-hidden bg-gradient-to-b from-muted/10 to-background"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <LeadChat leadId={lead.id} />
          </motion.div>
        </div>

        {/* Viral Loop Dialog */}
        <ViralLoopDialog
          open={viralLoopOpen}
          onOpenChange={setViralLoopOpen}
          lead={lead}
          projectId={projectId || lead.project_id}
          onSuccess={() => setRefreshReferrals(prev => prev + 1)}
        />
      </motion.div>
    </AnimatePresence>
  );
};
