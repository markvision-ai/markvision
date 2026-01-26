import { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Lead } from '@/hooks/useLeads';
import { LeadCard } from './LeadCard';
import { KanbanStatus } from './KanbanBoard';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign } from 'lucide-react';

interface KanbanColumnProps {
  status: KanbanStatus;
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  isDropTarget?: boolean;
  selectionMode?: boolean;
  selectedLeads?: Set<string>;
  onSelectLead?: (leadId: string, selected: boolean) => void;
  onSelectAllInColumn?: (statusId: string, selected: boolean) => void;
  animatingLeadId?: string | null;
}

export const KanbanColumn = ({ 
  status, 
  leads, 
  onLeadClick, 
  isDropTarget,
  selectionMode = false,
  selectedLeads = new Set(),
  onSelectLead,
  onSelectAllInColumn,
  animatingLeadId
}: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status.id,
  });

  const allInColumnSelected = leads.length > 0 && leads.every(lead => selectedLeads.has(lead.id));

  // Calculate total revenue for "Записан" and "Оплачено" columns
  const showRevenue = status.id === 'appointment' || status.id === 'paid';
  const totalRevenue = useMemo(() => {
    if (!showRevenue) return 0;
    return leads.reduce((sum, lead) => sum + (lead.deal_amount || 0), 0);
  }, [leads, showRevenue]);

  const formatRevenue = (value: number) => {
    return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
  };

  const getColumnBg = () => {
    if (status.color === 'success') return 'bg-success/5 border-success/30';
    if (status.color === 'destructive') return 'bg-destructive/5 border-destructive/30';
    return 'bg-muted/30 border-border';
  };

  const getHeaderBg = () => {
    if (status.color === 'success') return 'bg-success text-success-foreground';
    if (status.color === 'destructive') return 'bg-destructive text-destructive-foreground';
    return 'bg-primary/10 text-foreground';
  };

  const isHighlighted = isOver || isDropTarget;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-shrink-0 w-[280px] sm:w-80 rounded-xl border backdrop-blur-sm bg-card/50 border-border p-3 sm:p-4 transition-all duration-300',
        isHighlighted && 'ring-2 ring-primary/50 ring-offset-2 ring-offset-background/50 shadow-lg shadow-primary/20'
      )}
    >
      {/* Column Header - Glassmorphism */}
      <div className={cn(
        'flex flex-col gap-1 mb-4 px-3 py-2 rounded-lg backdrop-blur-sm border border-border',
        status.color === 'success' && 'bg-emerald-500/20 border-emerald-500/30',
        status.color === 'destructive' && 'bg-red-500/20 border-red-500/30',
        !status.color && 'bg-primary/10 border-primary/20'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selectionMode && leads.length > 0 && (
              <Checkbox
                checked={allInColumnSelected}
                onCheckedChange={(checked) => onSelectAllInColumn?.(status.id, !!checked)}
                className="border-current/50"
              />
            )}
            <h3 className="font-semibold text-sm">
              {status.label}
            </h3>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-background/30">
            {leads.length}
          </span>
        </div>
        {/* Revenue total for Записан and Оплачено */}
        {showRevenue && totalRevenue > 0 && (
          <div className="flex items-center gap-1 text-xs opacity-90">
            <DollarSign className="w-3 h-3" />
            <span className="font-semibold">{formatRevenue(totalRevenue)}</span>
          </div>
        )}
      </div>

      {/* Cards Container with AnimatePresence */}
      <div className="space-y-3 min-h-[200px]">
        <AnimatePresence mode="popLayout">
          {leads.map((lead) => (
            <motion.div
              key={lead.id}
              layout
              initial={{ opacity: 0, scale: 0.8, y: -20 }}
              animate={{ 
                opacity: 1, 
                scale: animatingLeadId === lead.id ? 1.02 : 1, 
                y: 0,
                boxShadow: animatingLeadId === lead.id 
                  ? '0 0 20px rgba(var(--primary), 0.3)' 
                  : 'none'
              }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{
                layout: { type: 'spring', stiffness: 400, damping: 25 },
                opacity: { duration: 0.2 },
                scale: { duration: 0.2, ease: 'easeOut' }
              }}
              className={cn(
                animatingLeadId === lead.id && 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-xl'
              )}
            >
              <LeadCard
                lead={lead}
                onClick={() => onLeadClick(lead)}
                selectionMode={selectionMode}
                isSelected={selectedLeads.has(lead.id)}
                onSelect={(selected) => onSelectLead?.(lead.id, selected)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {leads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2">
              <span className="text-xl opacity-50">📭</span>
            </div>
            <span className="text-sm">Нет лидов</span>
          </div>
        )}
      </div>
    </div>
  );
};
