import { useDroppable } from '@dnd-kit/core';
import { Lead } from '@/hooks/useLeads';
import { LeadCard } from './LeadCard';
import { KanbanStatus } from './KanbanBoard';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface KanbanColumnProps {
  status: KanbanStatus;
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  isDropTarget?: boolean;
}

export const KanbanColumn = ({ status, leads, onLeadClick, isDropTarget }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status.id,
  });

  const getColumnStyles = () => {
    if (status.color === 'success') {
      return 'bg-gradient-to-b from-success/10 to-success/5 border-success/30';
    }
    if (status.color === 'destructive') {
      return 'bg-gradient-to-b from-destructive/10 to-destructive/5 border-destructive/30';
    }
    return 'crm-column-glass';
  };

  const getHeaderStyles = () => {
    if (status.color === 'success') {
      return 'bg-gradient-to-r from-success to-success/80 text-success-foreground';
    }
    if (status.color === 'destructive') {
      return 'bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground';
    }
    return 'bg-gradient-to-r from-primary/20 to-accent/20 text-foreground';
  };

  const getGlowStyles = () => {
    if (status.color === 'success') return 'crm-glow-success';
    if (status.color === 'destructive') return '';
    return '';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 24,
      },
    },
  };

  return (
    <motion.div
      ref={setNodeRef}
      className={cn(
        'flex-shrink-0 w-[280px] sm:w-80 rounded-2xl border p-3 sm:p-4 transition-all duration-300',
        getColumnStyles(),
        getGlowStyles(),
        (isOver || isDropTarget) && 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]'
      )}
      animate={{
        scale: isOver || isDropTarget ? 1.02 : 1,
      }}
      transition={{ duration: 0.2 }}
    >
      {/* Premium Column Header */}
      <div className={cn(
        'flex items-center justify-between mb-4 px-3 py-2 rounded-xl',
        getHeaderStyles()
      )}>
        <h3 className="font-bold text-sm tracking-wide uppercase">
          {status.label}
        </h3>
        <span className={cn(
          'text-xs font-bold px-2.5 py-1 rounded-full',
          status.color === 'success' 
            ? 'bg-success-foreground/20 text-success-foreground' 
            : status.color === 'destructive'
            ? 'bg-destructive-foreground/20 text-destructive-foreground'
            : 'bg-background/50 text-foreground'
        )}>
          {leads.length}
        </span>
      </div>

      {/* Cards Container */}
      <motion.div 
        className="space-y-3 min-h-[200px]"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {leads.map((lead) => (
          <motion.div key={lead.id} variants={itemVariants}>
            <LeadCard
              lead={lead}
              onClick={() => onLeadClick(lead)}
            />
          </motion.div>
        ))}

        {leads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
              <span className="text-2xl opacity-50">📭</span>
            </div>
            <span className="text-sm font-medium">Нет лидов</span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
