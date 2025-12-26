import { useDroppable } from '@dnd-kit/core';
import { Lead } from '@/hooks/useLeads';
import { LeadCard } from './LeadCard';
import { KanbanStatus } from './KanbanBoard';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  status: KanbanStatus;
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
}

export const KanbanColumn = ({ status, leads, onLeadClick }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status.id,
  });

  const getColumnStyles = () => {
    if (status.color === 'success') {
      return 'bg-success/5 border-success/20';
    }
    if (status.color === 'destructive') {
      return 'bg-destructive/5 border-destructive/20';
    }
    return 'bg-card border-border';
  };

  const getHeaderStyles = () => {
    if (status.color === 'success') {
      return 'text-success';
    }
    if (status.color === 'destructive') {
      return 'text-destructive';
    }
    return 'text-foreground';
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-shrink-0 w-[260px] sm:w-72 rounded-xl border p-2 sm:p-3 transition-colors',
        getColumnStyles(),
        isOver && 'ring-2 ring-primary'
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className={cn('font-semibold text-sm', getHeaderStyles())}>
          {status.label}
        </h3>
        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
          {leads.length}
        </span>
      </div>

      {/* Cards Container */}
      <div className="space-y-2 min-h-[200px]">
        {leads.map(lead => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onClick={() => onLeadClick(lead)}
          />
        ))}

        {leads.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Нет лидов
          </div>
        )}
      </div>
    </div>
  );
};
