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
    if (status.color === 'success') return 'bg-success text-success-foreground';
    if (status.color === 'destructive') return 'bg-destructive text-destructive-foreground';
    return 'bg-primary/10 text-foreground';
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
        "p-4 rounded-t-2xl flex flex-col gap-2",
        status.color === 'success' && "bg-blue-500/10",
        status.color === 'destructive' && "bg-destructive/10",
        !status.color && "bg-muted/30"
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
            <h3 className="font-semibold text-sm text-foreground">
              {status.label}
            </h3>
          </div>
          <Badge variant="secondary" className="rounded-md h-6 px-2 font-semibold text-xs">
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
              "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold",
              status.color === 'success'
                ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
                : 'bg-primary/10 text-primary'
            )}>
              <DollarSign className="w-3 h-3" />
              <span>{formatRevenue(totalAmount)}</span>
            </div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Оборот
            </span>
          </motion.div>
        )}
      </div>

      <Separator className="bg-border" />

      {/* Cards */}
      <div className="space-y-3 min-h-[200px] p-4 scrollbar-none overflow-y-auto">
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
