import { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Lead } from '@/hooks/useLeads';
import { LeadCard, type LeadSlaData } from './LeadCard';
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
  slaDataMap?: Record<string, LeadSlaData>;
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
  totalCount = 0,
  slaDataMap
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
        'flex-shrink-0 w-[300px] sm:w-[340px] rounded-2xl border transition-all duration-500 flex flex-col',
        'interstellar-glass border-white/5 shadow-2xl backdrop-blur-xl',
        isHighlighted ? 'ring-2 ring-primary/40 ring-offset-4 ring-offset-background/50 scale-[1.01]' : 'opacity-95 hover:opacity-100'
      )}
    >
      {/* Column Header - Premium Branded */}
      <div className="p-4 flex flex-col gap-2 relative overflow-hidden group">
        {/* Subtle header glow */}
        <div className={cn(
          "absolute -top-12 -right-12 w-32 h-32 blur-3xl opacity-20 transition-opacity duration-500 group-hover:opacity-40",
          status.color === 'success' ? 'bg-emerald-500' :
            status.color === 'destructive' ? 'bg-red-500' : 'bg-primary'
        )} />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            {selectionMode && leads.length > 0 && (
              <Checkbox
                checked={allInColumnSelected}
                onCheckedChange={(checked) => onSelectAllInColumn?.(status.id, !!checked)}
                className="border-white/20 data-[state=checked]:bg-primary"
              />
            )}
            <h3 className="font-black text-xs uppercase tracking-[0.15em] text-foreground/80">
              {status.label}
            </h3>
          </div>
          <Badge
            variant="outline"
            className="rounded-lg h-7 px-2.5 font-bold border-white/10 bg-white/5 text-[11px]"
          >
            {leads.length}
          </Badge>
        </div>

        {/* Revenue/Lead Metrics */}
        {(showRevenue) && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 relative z-10"
          >
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-black shadow-sm",
              status.color === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
            )}>
              <DollarSign className="w-3 h-3" />
              <span>{formatRevenue(totalAmount)}</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider opacity-60">
              Оборот этапа
            </span>
          </motion.div>
        )}
      </div>

      <Separator className="bg-white/5 mx-4 w-auto" />

      {/* Cards Container with AnimatePresence */}
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
                slaData={slaDataMap?.[lead.id]}
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
