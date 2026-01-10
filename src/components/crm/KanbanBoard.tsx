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
import { KanbanColumnSkeleton } from './KanbanColumnSkeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, WifiOff, Wifi } from 'lucide-react';
import { playSuccessSound, playDragStartSound, playDropSound } from '@/lib/sounds';

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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [paymentLead, setPaymentLead] = useState<Lead | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  const effectiveProjectId = projectId || '64c94e87-630c-470e-8ab1-8f7c8c835efa';

  // REALTIME 2.1: Стабильная подписка без лишних хуков
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        (payload) => {
          const data = payload.new as any;
          if (data && (data.project_id === effectiveProjectId || !data.project_id)) {
            if (data.status === 'Записан' && payload.eventType === 'UPDATE') {
              playSuccessSound();
              toast.success(`Клиент ${data.name || ''} записан!`, { icon: '🩺' });
            }
            // Вызываем обновление через пропсы
            onRefetch();
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [effectiveProjectId, onRefetch]);

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
    playDragStartSound();
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

    playDropSound();
    if (newStatusId === 'paid') {
      setPaymentLead(lead);
      return;
    }
    await updateLeadStatus(leadId, newStatusLabel);
  };

  const updateLeadStatus = async (leadId: string, statusLabel: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: statusLabel, updated_at: new Date().toISOString() })
        .eq('id', leadId);
      if (error) throw error;
      toast.success('Статус обновлен');
      onRefetch();
    } catch (error) {
      toast.error('Ошибка сохранения');
    } finally {
      setIsUpdating(false);
    }
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
          onClose={() => setPaymentLead(null)}
          onConfirm={(amt) => {
             updateLeadStatus(paymentLead.id, 'Оплачено');
             setPaymentLead(null);
          }}
          leadName={paymentLead.name || 'Клиент'}
        />
      )}
    </>
  );
};
