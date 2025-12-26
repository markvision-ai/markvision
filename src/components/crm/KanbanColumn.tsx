import { useDroppable } from '@dnd-kit/core';
import { Lead } from '@/hooks/useLeads';
import { LeadCard } from './LeadCard';
import { KanbanStatus } from './KanbanBoard';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

interface KanbanColumnProps {
  status: KanbanStatus;
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  isDropTarget?: boolean;
  selectionMode?: boolean;
  selectedLeads?: Set<string>;
  onSelectLead?: (leadId: string, selected: boolean) => void;
  onSelectAllInColumn?: (statusId: string, selected: boolean) => void;
}

export const KanbanColumn = ({ 
  status, 
  leads, 
  onLeadClick, 
  isDropTarget,
  selectionMode = false,
  selectedLeads = new Set(),
  onSelectLead,
  onSelectAllInColumn
}: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status.id,
  });

  const allInColumnSelected = leads.length > 0 && leads.every(lead => selectedLeads.has(lead.id));

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
        'flex-shrink-0 w-[280px] sm:w-80 rounded-xl border p-3 sm:p-4 transition-all duration-200',
        getColumnBg(),
        isHighlighted && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
    >
      {/* Column Header */}
      <div className={cn(
        'flex items-center justify-between mb-4 px-3 py-2 rounded-lg',
        getHeaderBg()
      )}>
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

      {/* Cards Container */}
      <div className="space-y-3 min-h-[200px]">
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onClick={() => onLeadClick(lead)}
            selectionMode={selectionMode}
            isSelected={selectedLeads.has(lead.id)}
            onSelect={(selected) => onSelectLead?.(lead.id, selected)}
          />
        ))}

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
