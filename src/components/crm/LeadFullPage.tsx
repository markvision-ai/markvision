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
  Users,
  Copy,
  AlertCircle,
  Sparkles,
  Zap,
  ChevronRight,
  ShieldCheck,
  Award,
  Crown
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
  visit_completed: 'Визит пройден',
  in_progress: 'В работе',
  no_answer: 'Недозвон',
  cancelled: 'Отказ',
};

const statusStyles: Record<string, { bg: string; text: string; gradient: string; glow: string }> = {
  new: { bg: 'bg-blue-600/20', text: 'text-blue-400', gradient: 'from-blue-600 to-cyan-500', glow: 'shadow-blue-500/20' },
  invoiced: { bg: 'bg-indigo-600/20', text: 'text-indigo-400', gradient: 'from-indigo-600 to-violet-500', glow: 'shadow-indigo-500/20' },
  paid: { bg: 'bg-blue-600/20', text: 'text-blue-400', gradient: 'from-blue-500 to-green-500', glow: 'shadow-blue-500/20' },
  appointment: { bg: 'bg-purple-600/20', text: 'text-purple-400', gradient: 'from-purple-500 to-pink-500', glow: 'shadow-purple-500/20' },
  visit_completed: { bg: 'bg-fuchsia-600/20', text: 'text-fuchsia-400', gradient: 'from-fuchsia-500 to-pink-500', glow: 'shadow-fuchsia-500/20' },
  in_progress: { bg: 'bg-yellow-600/20', text: 'text-yellow-400', gradient: 'from-yellow-500 to-orange-500', glow: 'shadow-yellow-500/20' },
  no_answer: { bg: 'bg-orange-600/20', text: 'text-orange-400', gradient: 'from-orange-500 to-red-500', glow: 'shadow-orange-500/20' },
  cancelled: { bg: 'bg-red-600/20', text: 'text-red-400', gradient: 'from-red-500 to-rose-500', glow: 'shadow-red-500/20' },
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
  const [visitLoading, setVisitLoading] = useState(false);
  const [viralLoopOpen, setViralLoopOpen] = useState(false);
  const [refreshReferrals, setRefreshReferrals] = useState(0);

  // Check if visit has already been done (status is appointment or paid)
  const isVisitDone = ['appointment', 'paid', 'visit_completed'].includes(formData.status || '');
  const isVisitDisabled = formData.status === 'cancelled';

  const handleVisitClick = async () => {
    if (isVisitDisabled) return;

    setVisitLoading(true);
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

        toast.success('Статус обновлен, переход к визиту...');
      } else {
        toast.info('Переход к визиту...');
      }

      // Build URL and open in new tab AFTER successful status update
      // Updated to new visits app URL
      const visitUrl = `https://markvision-visits.vercel.app/?lead_id=${lead.id}`;
      window.open(visitUrl, '_blank');
    } catch (error) {
      console.error('Error updating status for visit:', error);
      toast.error('Ошибка обновления статуса');
    } finally {
      setVisitLoading(false);
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

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] bg-slate-50 flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Premium Profile Header */}
        <header className="relative h-24 md:h-32 flex items-center px-6 overflow-hidden shrink-0 border-b border-white/5">
          {/* Dynamic Background Glow */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-r opacity-20 blur-3xl -z-10 transition-all duration-1000",
            currentStatusStyle.gradient
          )} />
          <div className="absolute inset-0 bg-background/40 backdrop-blur-xl -z-20" />
          <div className="absolute inset-0 dot-pattern opacity-10 -z-10" />

          <div className="flex items-center justify-between w-full max-w-[1600px] mx-auto">
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-12 w-12 rounded-2xl bg-white/5 border border-slate-200 hover:bg-primary/10 transition-all"
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>

              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className={cn(
                    'w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-2xl transition-all duration-1000 rotate-3 group-hover:rotate-0',
                    currentStatusStyle.gradient,
                    currentStatusStyle.glow
                  )}>
                    <User className="w-8 h-8 text-white drop-shadow-2xl shadow-blue-900/5" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-blue-500 border-2 border-background flex items-center justify-center">
                    <Zap className="w-3 h-3 text-white fill-current" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white drop-shadow-sm">
                      {lead.name || 'Анонимный клиент'}
                    </h1>
                    {lead.ltv && lead.ltv > 0 && (
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/40 font-black px-3 py-1">
                        VIP • {new Intl.NumberFormat('ru-RU').format(lead.ltv)} ₸
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={cn('font-black uppercase tracking-[0.1em] text-[10px] px-3 py-1 rounded-lg border-slate-200 shadow-2xl shadow-blue-900/5', currentStatusStyle.bg, currentStatusStyle.text)}>
                      {statusLabels[formData.status]}
                    </Badge>
                    <span className="text-muted-foreground/60 text-xs font-bold px-2">•</span>
                    <span className="text-muted-foreground/80 text-xs font-bold tracking-wide">
                      ID: {lead.id.slice(0, 8)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <AnimatePresence>
                {hasChanges && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="h-12 px-6 rounded-2xl bg-gradient-to-br from-primary to-accent hover:opacity-90 shadow-2xl shadow-primary/20 font-black tracking-wide"
                    >
                      {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                      СОХРАНИТЬ
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-12 w-12 rounded-2xl bg-white/5 border border-slate-200 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </header>

        {/* Content Workspace */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Lead Intelligence System */}
          <div className="w-full lg:w-[65%] border-r border-white/5 flex flex-col bg-background/30 backdrop-blur-md relative">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-6 md:p-8 max-w-[1200px] mx-auto pb-40 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Phase 1: Contact Intelligence */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="md:col-span-2 bg-white/70 backdrop-blur-3xl border border-white/60 shadow-xl p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -z-10 group-hover:bg-primary/10 transition-colors duration-700" />

                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black tracking-tight text-white/90 uppercase">Основные данные</h2>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Contact Intelligence</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground pl-1">ФИО Клиента</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Введите имя..."
                          className="interstellar-input h-14 text-lg font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground pl-1">Канал связи</Label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/60" />
                          <Input
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+7 (___) ___-__-__"
                            className="interstellar-input h-14 pl-12 text-lg font-bold tracking-wider"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Phase 2: Deal Strategy */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/70 backdrop-blur-3xl border border-white/60 shadow-xl p-8 rounded-[2.5rem] border-white/5"
                  >
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                        <DollarSign className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black tracking-tight text-white/90 uppercase">Сделка</h2>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Deal Strategy</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground pl-1">Статус воронки</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) => setFormData({ ...formData, status: value })}
                        >
                          <SelectTrigger className="interstellar-input h-14 font-black">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white/70 backdrop-blur-3xl border border-white/60 shadow-xl border-slate-200">
                            {Object.entries(statusLabels).map(([key, label]) => (
                              <SelectItem key={key} value={key} className="focus:bg-primary/20 focus:text-primary transition-colors cursor-pointer">
                                <div className="flex items-center gap-3">
                                  <div className={cn('w-2.5 h-2.5 rounded-full shadow-2xl shadow-blue-900/5', statusStyles[key]?.gradient)} />
                                  <span className="font-bold">{label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground pl-1">Сумма оплаты</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={formData.deal_amount}
                            onChange={(e) => setFormData({ ...formData, deal_amount: Number(e.target.value) })}
                            className="interstellar-input h-14 text-xl font-black pr-12 text-blue-400"
                          />
                          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-blue-500/80 font-black text-lg">₸</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 pt-2">
                        <Button
                          onClick={handleVisitClick}
                          disabled={isVisitDisabled || visitLoading}
                          className={cn(
                            'h-14 rounded-2xl font-black uppercase tracking-widest transition-all shadow-2xl',
                            isVisitDone
                              ? 'bg-white/70 backdrop-blur-3xl border border-white/60 shadow-xl bg-violet-600/20 text-violet-400 hover:bg-violet-600/30'
                              : 'bg-primary text-primary-foreground hover:scale-[1.02]'
                          )}
                        >
                          {visitLoading ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : isVisitDone ? <RefreshCw className="w-5 h-5 mr-3" /> : <Activity className="w-5 h-5 mr-3" />}
                          {isVisitDone ? 'Повторный замер' : 'Провести замер/визит'}
                        </Button>

                        <Button
                          onClick={() => setViralLoopOpen(true)}
                          disabled={isVisitDisabled}
                          className="h-14 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 font-black uppercase tracking-widest shadow-[0_8px_30px_rgb(0,0,0,0.04)] shadow-indigo-600/20 hover:scale-[1.02] transition-transform"
                        >
                          <Gift className="w-5 h-5 mr-3" />
                          Виральная петля 🔥
                        </Button>
                      </div>
                    </div>
                  </motion.div>

                  {/* Phase 3: Actionable Insights */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/70 backdrop-blur-3xl border border-white/60 shadow-xl p-8 rounded-[2.5rem] border-white/5"
                  >
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                        <Target className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black tracking-tight text-white/90 uppercase">Задачи</h2>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Actionable Insights</p>
                      </div>
                    </div>

                    <div className="max-h-[350px] overflow-hidden">
                      <LeadTasks leadId={lead.id} />
                    </div>
                  </motion.div>

                  {/* Phase 4: Marketing Intelligence (UTM) */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="md:col-span-2 bg-white/70 backdrop-blur-3xl border border-white/60 shadow-xl p-8 rounded-[2.5rem] border-white/5"
                  >
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                        <Tag className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black tracking-tight text-white/90 uppercase">Маркетинг</h2>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Origin Tracking</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                      {[
                        { key: 'utm_source', label: 'Channel', value: lead.utm_source, icon: <Users className="w-3 h-3" /> },
                        { key: 'utm_medium', label: 'Medium', value: lead.utm_medium, icon: <Activity className="w-3 h-3" /> },
                        { key: 'utm_campaign', label: 'Campaign', value: lead.utm_campaign, icon: <Target className="w-3 h-3" /> },
                        { key: 'utm_content', label: 'Content', value: lead.utm_content, icon: <Copy className="w-3 h-3" /> },
                        { key: 'utm_term', label: 'Keyword', value: lead.utm_term, icon: <Tag className="w-3 h-3" /> },
                      ].map(item => (
                        <div key={item.key} className={cn(
                          "p-4 rounded-[1.5rem] transition-all duration-500",
                          item.value ? "bg-white/5 border border-slate-200 shadow-2xl shadow-blue-900/5" : "bg-black/20 border border-white/5 opacity-40"
                        )}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground">
                              {item.icon}
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</p>
                          </div>
                          <p className="text-xs font-black truncate text-white/90">{item.value || 'None'}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Secondary Views: History, Referrals, etc */}
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                      <div className="bg-white/70 backdrop-blur-3xl border border-white/60 shadow-xl p-8 rounded-[2.5rem] border-white/5">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="w-12 h-12 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center text-success">
                            <Activity className="w-6 h-6" />
                          </div>
                          <div>
                            <h2 className="text-lg font-black tracking-tight text-white/90 uppercase">Касания</h2>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Customer Journey</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {touchpoints.slice(0, 5).map((tp, idx) => (
                            <div key={tp.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-black text-xs">
                                  {idx + 1}
                                </div>
                                <span className="font-bold text-sm">{tp.channel_name}</span>
                              </div>
                              <span className="text-[10px] font-bold opacity-40">{format(new Date(tp.touched_at), 'd MMM')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-white/70 backdrop-blur-3xl border border-white/60 shadow-xl p-8 rounded-[2.5rem] border-white/5">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                            <History className="w-5 h-5" />
                          </div>
                          <h2 className="text-lg font-black tracking-tight text-white/90 uppercase">История</h2>
                        </div>
                        <LeadStatusHistory leadId={lead.id} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Modern Messenger Interface */}
          <motion.div
            className="hidden lg:flex flex-1 flex-col overflow-hidden bg-background/20 backdrop-blur-3xl relative border-l border-white/5"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, type: "spring", damping: 30 }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
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
    </AnimatePresence>,
    document.body
  );
};
