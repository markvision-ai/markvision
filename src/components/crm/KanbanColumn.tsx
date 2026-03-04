import { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Lead } from '@/hooks/useLeads';
import { LeadCard } from './LeadCard';
import { KanbanStatus } from './KanbanBoard';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  totalAmount?: number;
  totalCount?: number;
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
  animatingLeadId,
  totalAmount = 0,
  totalCount = 0
}: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status.id,
  });

  const allInColumnSelected = leads.length > 0 && leads.every(lead => selectedLeads.has(lead.id));

  // Use passed totalAmount
  const showRevenue = totalAmount > 0;

  const formatRevenue = (value: number) => {
    return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
  };

  const getColumnBg = () => {
    if (status.color === 'success') return 'bg-success/5 border-success/30';
    if (status.color === 'destructive') return 'bg-destructive/5 border-destructive/30';
    return 'bg-muted/30 border-white/50';
  };

  const getHeaderBg = () => {
    if (status.color === 'success') return 'bg-success/20 text-success';
    if (status.color === 'destructive') return 'bg-destructive/20 text-destructive';
    return 'bg-primary/20 text-primary';
  };

  const isHighlighted = isOver || isDropTarget;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-shrink-0 w-[300px] sm:w-[340px] rounded-2xl border border-white/50 bg-white/10 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 shadow-sm flex flex-col transition-all duration-200',
        isHighlighted && 'ring-2 ring-primary/30 ring-offset-2 scale-[1.01]'
      )}
    >
      {/* Column Header */}
      <div className={cn(
        "p-4 rounded-[1.2rem] flex flex-col gap-2 mx-2 mt-2 backdrop-blur-md shadow-sm border border-white/5",
        status.color === 'success' && "bg-success/10",
        status.color === 'destructive' && "bg-destructive/10",
        !status.color && "bg-white/5"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {selectionMode && leads.length > 0 && (
              <Checkbox
                checked={allInColumnSelected}
                onCheckedChange={(checked) => onSelectAllInColumn?.(status.id, !!checked)}
                className="data-[state=checked]:bg-primary"
              />
            )}
            <h3 className={cn("font-black text-xs uppercase tracking-widest", status.color === 'success' ? 'text-success' : status.color === 'destructive' ? 'text-destructive' : 'text-white/80')}>
              {status.label}
            </h3>
          </div>
          <Badge className="rounded-lg bg-white/10 text-white border border-white/10 h-6 px-3 font-black">
            {leads.length}
          </Badge>
        </div>

        {showRevenue && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold",
              status.color === 'success'
                ? 'bg-success/20 text-success'
                : 'bg-primary/20 text-primary'
            )}>
              <DollarSign className="w-3.5 h-3.5" />
              <span>{formatRevenue(totalAmount)}</span>
            </div>
            <span className="text-[10px] text-white/40 uppercase tracking-widest font-black">
              ОБОРОТ
            </span>
          </motion.div>
        )}
      </div>

      <Separator className="bg-white/10 my-2 mx-4 w-auto" />

      {/* Cards */}
      <div className="space-y-3 min-h-[200px] p-2 flex-col flex overflow-y-auto scrollbar-none pb-4 relative z-10">
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
                onClick={() => onLeadClick?.(lead)}
                selectionMode={selectionMode}
                isSelected={selectedLeads.has(lead.id)}
                onSelect={(selected) => onSelectLead?.(lead.id, selected)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {leads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground rounded-xl border border-dashed border-white/50 bg-muted/20">
            <span className="text-2xl mb-1">📭</span>
            <span className="text-sm font-medium">Нет лидов</span>
          </div>
        )}
      </div>
    </div>
  );
};
