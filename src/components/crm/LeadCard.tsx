import { useDraggable } from '@dnd-kit/core';
import { Lead } from '@/hooks/useLeads';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Phone, Calendar, Eye, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
  isDragging?: boolean;
}

export const LeadCard = ({ lead, onClick, isDragging = false }: LeadCardProps) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: lead.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const getSourceBadge = () => {
    const source = lead.utm_source?.toLowerCase();
    if (!source) return null;

    const sourceColors: Record<string, string> = {
      yandex: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
      google: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
      vk: 'bg-sky-500/20 text-sky-600 dark:text-sky-400',
      facebook: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
      instagram: 'bg-pink-500/20 text-pink-600 dark:text-pink-400',
      telegram: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400',
    };

    const colorClass = sourceColors[source] || 'bg-secondary text-secondary-foreground';

    return (
      <Badge variant="secondary" className={cn('text-xs font-normal', colorClass)}>
        {lead.utm_source}
      </Badge>
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-background border rounded-lg p-2 sm:p-3 cursor-grab active:cursor-grabbing transition-all',
        isDragging && 'opacity-90 shadow-lg rotate-2 scale-105',
        !isDragging && 'hover:border-primary/50 hover:shadow-sm'
      )}
    >
      {/* Drag Handle */}
      <div
        {...listeners}
        {...attributes}
        className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2"
      >
        <GripVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-xs sm:text-sm truncate">
            {lead.name || 'Без имени'}
          </p>
        </div>
        {getSourceBadge()}
      </div>

      {/* Phone */}
      {lead.phone && (
        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground mb-1.5 sm:mb-2">
          <Phone className="w-3 h-3" />
          <span className="truncate">{lead.phone}</span>
        </div>
      )}

      {/* Date */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3">
        <Calendar className="w-3 h-3" />
        <span className="truncate">
          {format(new Date(lead.created_at), 'd MMM, HH:mm', { locale: ru })}
        </span>
      </div>

      {/* Amount Badge (if paid) */}
      {lead.status === 'paid' && lead.deal_amount && lead.deal_amount > 0 && (
        <div className="mb-2 sm:mb-3">
          <Badge variant="secondary" className="bg-success/20 text-success text-[10px] sm:text-xs">
            {new Intl.NumberFormat('ru-RU', { notation: 'compact' }).format(lead.deal_amount)} ₸
          </Badge>
        </div>
      )}

      {/* Quick View Button */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full h-6 sm:h-7 text-[10px] sm:text-xs"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        <Eye className="w-3 h-3 mr-1" />
        <span className="hidden sm:inline">Быстрый просмотр</span>
        <span className="sm:hidden">Просмотр</span>
      </Button>
    </div>
  );
};
