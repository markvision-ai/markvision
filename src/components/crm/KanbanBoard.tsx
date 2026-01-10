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
import { useQueryClient } from '@tanstack/react-query';

export interface KanbanStatus {
  id: string;
  label: string;
  color?: string;
}

// СЛОВАРЬ СТАТУСОВ: Связываем ID кода со словами в базе данных
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
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [paymentLead, setPaymentLead] = useState<Lead | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [animatingLeadId, setAnimatingLeadId] = useState<string | null>(null);

  const effectiveProjectId = projectId || '64c94e87-630c-470e-8ab1-8f7c8c835efa';

  // REALTIME ENGINE 2.0: Максимальная стабильность
  useEffect(() => {
    console.log('📡 Realtime: Инициализация живой связи...');
    
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads'
        },
        (payload) => {
          // Фильтруем изменения только для нашего проекта в коде (для стабильности WebSocket)
          const data = payload.new as any;
          if (data && data.project_id === effectiveProjectId) {
            console.log('⚡️ Изменение лида поймано:', data.name, data.status);
            
            // Если статус изменился на "Записан", пускаем звук победы
            if (data.status === 'Записан') {
              playSuccessSound();
              toast.success(`Клиент ${data.name} записан на диагностику!`, { icon: '🩺' });
            }
            
            // Принудительно обновляем данные в CRM
            onRefetch();
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
          }
        }
      )
      .subscribe((status) => {
        console.log('🔌 Realtime Status:', status);
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      });

    // Резервное обновление раз в 30 секунд (если Realtime упадет)
    const fallback = setInterval(() => onRefetch(), 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(fallback);
    };
  }, [effectiveProjectId, onRefetch, queryClient]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const leadsByStatus = useMemo(() => {
    const grouped: Record<string, Lead[]> = {};
    KANBAN_STATUSES.forEach(status => { grouped[status.id] = []; });
    
    leads.forEach(lead => {
      // Маппинг: если в базе 'Записан', кладем в колонку 'appointment'
      const statusId = Object.keys(statusLabels).find(key => statusLabels[key] === lead.status) || 'new';
      if (grouped[statusId]) grouped[statusId].push(lead);
    });
    
    return grouped;
  }, [leads]);

  const activeLead = useMemo(() => leads.find(l => l.id === activeId) || null, [activeId, leads]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    if (selectionMode) return;
    setActiveId(event.active.id as string);
    playDragStartSound();
  }, [selectionMode]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    setOverId(event.over?.id as string || null);
  }, []);

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

  const updateLeadStatus = async (leadId: string, statusLabel: string, amount?: number) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          status: statusLabel, 
          revenue: amount || undefined,
          updated_at: new Date().toISOString() 
        })
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
        <div className={isConnected ? "text-success flex items-center gap-1 text-xs" : "text-destructive flex items-center gap-1 text-xs"}>
          {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3 animate-pulse" />}
          <span>{isConnected ? "Realtime подключен" : "Переподключение (30с)..."}</span>
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

      {selectedLead && (
        <LeadFullPage lead={selectedLead} projectId={effectiveProjectId} onClose={() => setSelectedLead(null)} onUpdate={onRefetch} />
      )}

      <PaymentDialog
        open={!!paymentLead}
        onClose={() => setPaymentLead(null)}
        onConfirm={(amt) => updateLeadStatus(paymentLead!.id, 'Оплачено', amt)}
        leadName={paymentLead?.name || 'Клиент'}
      />
    </>
  );
};
