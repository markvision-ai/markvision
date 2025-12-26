import { useState, useMemo, useCallback } from 'react';
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
import { LeadDetailDialog } from './LeadDetailDialog';
import { PaymentDialog } from './PaymentDialog';
import { KanbanColumnSkeleton } from './KanbanColumnSkeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { playSuccessSound, playDragStartSound, playDropSound } from '@/lib/sounds';
import { motion, AnimatePresence } from 'framer-motion';

export interface KanbanStatus {
  id: string;
  label: string;
  color?: string;
}

const KANBAN_STATUSES: KanbanStatus[] = [
  { id: 'new', label: 'Новая' },
  { id: 'in_progress', label: 'В работе' },
  { id: 'no_answer', label: 'Недозвон' },
  { id: 'appointment', label: 'Записан' },
  { id: 'paid', label: 'Оплачено', color: 'success' },
  { id: 'cancelled', label: 'Отказ', color: 'destructive' },
];

interface KanbanBoardProps {
  leads: Lead[];
  loading: boolean;
  onRefetch: () => void;
  projectId?: string | null;
}

export const KanbanBoard = ({ leads, loading, onRefetch, projectId }: KanbanBoardProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [paymentLead, setPaymentLead] = useState<Lead | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const leadsByStatus = useMemo(() => {
    const grouped: Record<string, Lead[]> = {};
    KANBAN_STATUSES.forEach(status => {
      grouped[status.id] = [];
    });
    
    leads.forEach(lead => {
      const status = lead.status || 'new';
      if (grouped[status]) {
        grouped[status].push(lead);
      } else {
        grouped['new'].push(lead);
      }
    });
    
    return grouped;
  }, [leads]);

  const activeLead = useMemo(() => {
    if (!activeId) return null;
    return leads.find(lead => lead.id === activeId) || null;
  }, [activeId, leads]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    playDragStartSound();
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    setOverId(over?.id as string || null);
  }, []);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over) return;

    const leadId = active.id as string;
    const newStatus = over.id as string;
    const lead = leads.find(l => l.id === leadId);

    if (!lead || lead.status === newStatus) return;

    // Play drop sound
    playDropSound();

    // If dropping into "paid" column, show payment dialog
    if (newStatus === 'paid') {
      setPaymentLead(lead);
      return;
    }

    // Otherwise, update status immediately
    await updateLeadStatus(leadId, newStatus);
  };

  const updateLeadStatus = async (leadId: string, status: string, amount?: number) => {
    setIsUpdating(true);
    try {
      const updateData: { status: string; updated_at: string; deal_amount?: number } = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (amount !== undefined) {
        updateData.deal_amount = amount;
      }

      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', leadId);

      if (error) throw error;

      // Play success sound for paid status
      if (status === 'paid') {
        playSuccessSound();
      }

      toast.success('Статус обновлен');
      onRefetch();
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Ошибка обновления статуса');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePaymentConfirm = async (amount: number) => {
    if (!paymentLead) return;
    await updateLeadStatus(paymentLead.id, 'paid', amount);
    setPaymentLead(null);
  };

  if (loading) {
    return (
      <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-4 min-h-[500px] sm:min-h-[600px] -mx-2 px-2 sm:mx-0 sm:px-0">
        {KANBAN_STATUSES.map((status, index) => (
          <KanbanColumnSkeleton 
            key={status.id} 
            cardCount={index === 0 ? 4 : index < 3 ? 2 : 1} 
          />
        ))}
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-4 min-h-[500px] sm:min-h-[600px] -mx-2 px-2 sm:mx-0 sm:px-0">
          {KANBAN_STATUSES.map(status => (
            <KanbanColumn
              key={status.id}
              status={status}
              leads={leadsByStatus[status.id] || []}
              onLeadClick={setSelectedLead}
              isDropTarget={overId === status.id}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}>
          {activeLead && (
            <motion.div
              initial={{ scale: 1, rotate: 0 }}
              animate={{ scale: 1.05, rotate: 2, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
              className="cursor-grabbing"
            >
              <LeadCard lead={activeLead} isDragging />
            </motion.div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Loading overlay */}
      {isUpdating && (
        <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Lead Detail Dialog */}
      <LeadDetailDialog
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        projectId={projectId}
      />

      {/* Payment Dialog */}
      <PaymentDialog
        open={!!paymentLead}
        onClose={() => setPaymentLead(null)}
        onConfirm={handlePaymentConfirm}
        leadName={paymentLead?.name || 'Клиент'}
      />
    </>
  );
};

