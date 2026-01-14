import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { Lead } from '@/hooks/useLeads';
import { KanbanColumn } from './KanbanColumn';
import { LeadCard } from './LeadCard';
import { LeadFullPage } from './LeadFullPage';
import { PaymentDialog } from './PaymentDialog';
import { AppointmentDialog } from './AppointmentDialog';
import { RejectionDialog } from './RejectionDialog';
import { KanbanColumnSkeleton } from './KanbanColumnSkeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logStatusChange } from '@/hooks/useLeadStatusHistory';
import { sendStatusChangeWebhook } from '@/lib/webhooks';
import { triggerSuccessConfetti } from '@/lib/confetti';
import { toast } from 'sonner';
import { Loader2, WifiOff, Wifi } from 'lucide-react';

export interface KanbanStatus {
  id: string;
  label: string;
  color?: string;
}

export const KANBAN_STATUSES: KanbanStatus[] = [
  { id: 'new', label: 'Новая' },
  { id: 'in_progress', label: 'В работе' },
  { id: 'no_answer', label: 'Недозвон' },
  { id: 'appointment', label: 'Записан' },
  { id: 'paid', label: 'Оплачено', color: 'success' },
  { id: 'cancelled', label: 'Отказ', color: 'destructive' },
];

const statusLabels: Record<string, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  no_answer: 'Недозвон',
  appointment: 'Записан',
  paid: 'Оплачено',
  cancelled: 'Отказ',
};

interface KanbanBoardProps {
  leads: Lead[];
  loading: boolean;
  onRefetch: () => void;
  projectId?: string | null;
  selectionMode?: boolean;
  selectedLeads?: Set<string>;
  onSelectLead?: (leadId: string, selected: boolean) => void;
  onSelectAllInColumn?: (statusId: string, selected: boolean) => void;
}

export const KanbanBoard = ({ 
  leads, 
  loading, 
  onRefetch, 
  projectId,
  selectionMode = false,
  selectedLeads = new Set(),
  onSelectLead,
  onSelectAllInColumn
}: KanbanBoardProps) => {
  const { user } = useAuth();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [paymentLead, setPaymentLead] = useState<Lead | null>(null);
  const [appointmentLead, setAppointmentLead] = useState<Lead | null>(null);
  const [rejectionLead, setRejectionLead] = useState<Lead | null>(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<{ leadId: string; oldStatus: string } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  const effectiveProjectId = projectId || '64c94e87-630c-470e-8ab1-8f7c8c835efa';

  // Realtime подписка вынесена в Index.tsx — здесь только UI состояние
  // Статус подключения синхронизируется через глобальный канал
  useEffect(() => {
    // Проверяем статус realtime соединения
    const checkConnection = () => {
      const channels = supabase.getChannels();
      const isActive = channels.some(ch => ch.state === 'joined');
      setIsConnected(isActive);
    };
    
    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const leadsByStatus = useMemo(() => {
    const grouped: Record<string, Lead[]> = {};
    KANBAN_STATUSES.forEach(status => { grouped[status.id] = []; });
    leads.forEach(lead => {
      const statusId = Object.keys(statusLabels).find(key => statusLabels[key] === lead.status) || 'new';
      if (grouped[statusId]) grouped[statusId].push(lead);
    });
    return grouped;
  }, [leads]);

  const activeLead = useMemo(() => leads.find(l => l.id === activeId) || null, [activeId, leads]);

  const handleDragStart = (event: DragStartEvent) => {
    if (selectionMode) return;
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id as string || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);
    if (!over || selectionMode) return;

    const leadId = active.id as string;
    const newStatusId = over.id as string;
    const newStatusLabel = statusLabels[newStatusId];
    const lead = leads.find(l => l.id === leadId);

    if (!lead || lead.status === newStatusLabel) return;

    const oldStatus = lead.status || 'new';
    setPendingStatusChange({ leadId, oldStatus });

    // Handle special status transitions with modals
    if (newStatusId === 'paid') {
      setPaymentLead(lead);
      return;
    }
    
    if (newStatusId === 'appointment') {
      setAppointmentLead(lead);
      return;
    }
    
    if (newStatusId === 'cancelled') {
      setRejectionLead(lead);
      return;
    }

    await updateLeadStatus(leadId, newStatusLabel, oldStatus);
  };

  const updateLeadStatus = async (
    leadId: string, 
    statusLabel: string, 
    oldStatus?: string,
    extraData?: { appointment_date?: string; rejection_reason?: string }
  ) => {
    setIsUpdating(true);
    try {
      const lead = leads.find(l => l.id === leadId);
      const updateData: any = { 
        status: statusLabel, 
        updated_at: new Date().toISOString() 
      };
      
      if (extraData?.appointment_date) {
        updateData.appointment_date = extraData.appointment_date;
      }
      if (extraData?.rejection_reason) {
        updateData.rejection_reason = extraData.rejection_reason;
      }

      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', leadId);
      
      if (error) throw error;

      // Log status change
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('user_id', user.id)
          .single();

        await logStatusChange(
          leadId,
          user.id,
          profile?.name || user.email?.split('@')[0] || 'Пользователь',
          oldStatus || null,
          statusLabel
        );
      }

      // Send webhook to n8n
      await sendStatusChangeWebhook({
        lead_id: leadId,
        old_status: oldStatus || null,
        new_status: statusLabel,
        manager_id: user?.id || 'unknown',
        timestamp: new Date().toISOString(),
        project_id: projectId || undefined,
        lead_name: lead?.name || undefined,
        lead_phone: lead?.phone || undefined,
        appointment_date: extraData?.appointment_date,
        rejection_reason: extraData?.rejection_reason,
      });

      toast.success('Статус обновлен');
      onRefetch();
    } catch (error) {
      toast.error('Ошибка сохранения');
    } finally {
      setIsUpdating(false);
      setPendingStatusChange(null);
    }
  };

  // Payment confirmation handler
  const handlePaymentConfirm = async (amount: number) => {
    if (!paymentLead || !pendingStatusChange) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          status: 'Оплачено', 
          deal_amount: amount,
          updated_at: new Date().toISOString() 
        })
        .eq('id', paymentLead.id);
      
      if (error) throw error;

      // ✨ AUTO-SYNC: Create income transaction in MarkFinance
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          project_id: effectiveProjectId,
          type: 'income',
          category: 'sales',
          amount: amount,
          currency: 'KZT',
          description: `Оплата от ${paymentLead.name || 'клиента'}${paymentLead.phone ? ` (${paymentLead.phone})` : ''}`,
          lead_id: paymentLead.id,
          transaction_date: new Date().toISOString(),
        });

      if (transactionError) {
        if (import.meta.env.DEV) {
          console.error('Failed to sync payment to MarkFinance:', transactionError);
        }
        // Don't fail the whole operation, just warn
        toast.warning('Оплата записана, но не синхронизирована с MarkFinance');
      }

      // Log status change
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('user_id', user.id)
          .single();

        await logStatusChange(
          paymentLead.id,
          user.id,
          profile?.name || user.email?.split('@')[0] || 'Пользователь',
          pendingStatusChange.oldStatus,
          'paid',
          amount
        );
      }

      // Send webhook
      await sendStatusChangeWebhook({
        lead_id: paymentLead.id,
        old_status: pendingStatusChange.oldStatus,
        new_status: 'Оплачено',
        manager_id: user?.id || 'unknown',
        timestamp: new Date().toISOString(),
        project_id: projectId || undefined,
        lead_name: paymentLead.name || undefined,
        lead_phone: paymentLead.phone || undefined,
      });

      // Trigger confetti celebration!
      triggerSuccessConfetti();
      
      toast.success('Оплата зарегистрирована и синхронизирована с MarkFinance! 🎉');
      onRefetch();
    } catch (error) {
      toast.error('Ошибка сохранения');
    } finally {
      setIsUpdating(false);
      setPaymentLead(null);
      setPendingStatusChange(null);
    }
  };

  // Appointment confirmation handler
  const handleAppointmentConfirm = async (appointmentDate: string) => {
    if (!appointmentLead || !pendingStatusChange) return;
    await updateLeadStatus(
      appointmentLead.id, 
      'Записан', 
      pendingStatusChange.oldStatus,
      { appointment_date: appointmentDate }
    );
    setAppointmentLead(null);
    toast.success('Запись создана');
  };

  // Rejection confirmation handler
  const handleRejectionConfirm = async (reasonId: string, reasonText: string) => {
    if (!rejectionLead || !pendingStatusChange) return;
    await updateLeadStatus(
      rejectionLead.id, 
      'Отказ', 
      pendingStatusChange.oldStatus,
      { rejection_reason: reasonText }
    );
    setRejectionLead(null);
    toast.info('Причина отказа сохранена');
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_STATUSES.map(s => <KanbanColumnSkeleton key={s.id} />)}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-end mb-2">
        <div className={isConnected ? "text-green-500 flex items-center gap-1 text-xs" : "text-red-500 flex items-center gap-1 text-xs"}>
          {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3 animate-pulse" />}
          <span>{isConnected ? "Realtime подключен" : "Переподключение..."}</span>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[600px]">
          {KANBAN_STATUSES.map(status => (
            <KanbanColumn
              key={status.id}
              status={status}
              leads={leadsByStatus[status.id] || []}
              onLeadClick={setSelectedLead}
              isDropTarget={overId === status.id}
              selectionMode={selectionMode}
              selectedLeads={selectedLeads}
              onSelectLead={onSelectLead}
            />
          ))}
        </div>
        <DragOverlay>{activeLead && <LeadCard lead={activeLead} isDragging />}</DragOverlay>
      </DndContext>

      {isUpdating && (
        <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {selectedLead && (
        <LeadFullPage lead={selectedLead} projectId={effectiveProjectId} onClose={() => setSelectedLead(null)} onUpdate={onRefetch} />
      )}

      {paymentLead && (
        <PaymentDialog
          open={!!paymentLead}
          onClose={() => {
            setPaymentLead(null);
            setPendingStatusChange(null);
          }}
          onConfirm={handlePaymentConfirm}
          leadName={paymentLead.name || 'Клиент'}
        />
      )}

      {appointmentLead && (
        <AppointmentDialog
          open={!!appointmentLead}
          onClose={() => {
            setAppointmentLead(null);
            setPendingStatusChange(null);
          }}
          onConfirm={handleAppointmentConfirm}
          leadName={appointmentLead.name || 'Клиент'}
        />
      )}

      {rejectionLead && (
        <RejectionDialog
          open={!!rejectionLead}
          onClose={() => {
            setRejectionLead(null);
            setPendingStatusChange(null);
          }}
          onConfirm={handleRejectionConfirm}
          leadName={rejectionLead.name || 'Клиент'}
        />
      )}
    </>
  );
};
