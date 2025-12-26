import { useDraggable } from '@dnd-kit/core';
import { Lead } from '@/hooks/useLeads';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Phone, Calendar, Eye, GripVertical, Sparkles } from 'lucide-react';
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

    const sourceStyles: Record<string, { bg: string; text: string; glow: string }> = {
      yandex: { bg: 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20', text: 'text-yellow-500', glow: 'shadow-yellow-500/20' },
      google: { bg: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20', text: 'text-blue-500', glow: 'shadow-blue-500/20' },
      vk: { bg: 'bg-gradient-to-r from-sky-500/20 to-blue-500/20', text: 'text-sky-500', glow: 'shadow-sky-500/20' },
      facebook: { bg: 'bg-gradient-to-r from-indigo-500/20 to-blue-500/20', text: 'text-indigo-500', glow: 'shadow-indigo-500/20' },
      instagram: { bg: 'bg-gradient-to-r from-pink-500/20 to-purple-500/20', text: 'text-pink-500', glow: 'shadow-pink-500/20' },
      telegram: { bg: 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20', text: 'text-cyan-500', glow: 'shadow-cyan-500/20' },
    };

    const style = sourceStyles[source] || { bg: 'bg-secondary', text: 'text-secondary-foreground', glow: '' };

    return (
      <Badge variant="secondary" className={cn('text-[10px] font-semibold border-0', style.bg, style.text, style.glow)}>
        {lead.utm_source}
      </Badge>
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'crm-card-glass rounded-xl p-3 sm:p-4 cursor-grab active:cursor-grabbing transition-all duration-300 premium-border',
        isDragging && 'opacity-95 shadow-2xl rotate-2 scale-105 z-50',
        !isDragging && 'hover:scale-[1.02] hover:shadow-lg hover:border-primary/30'
      )}
    >
      {/* Drag Handle & Name */}
      <div
        {...listeners}
        {...attributes}
        className="flex items-center gap-2 mb-3"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
          <GripVertical className="w-4 h-4 text-primary/70" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">
            {lead.name || 'Без имени'}
          </p>
        </div>
        {getSourceBadge()}
      </div>

      {/* Phone */}
      {lead.phone && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 pl-10">
          <Phone className="w-3.5 h-3.5 text-primary/60" />
          <span className="truncate font-medium">{lead.phone}</span>
        </div>
      )}

      {/* Date */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 pl-10">
        <Calendar className="w-3.5 h-3.5 text-primary/60" />
        <span className="truncate">
          {format(new Date(lead.created_at), 'd MMM, HH:mm', { locale: ru })}
        </span>
      </div>

      {/* Amount Badge (if paid) */}
      {lead.status === 'paid' && lead.deal_amount && lead.deal_amount > 0 && (
        <div className="mb-3 pl-10">
          <Badge className="bg-gradient-to-r from-success to-emerald-500 text-success-foreground border-0 text-xs font-bold shadow-lg shadow-success/20">
            <Sparkles className="w-3 h-3 mr-1" />
            {new Intl.NumberFormat('ru-RU', { notation: 'compact' }).format(lead.deal_amount)} ₸
          </Badge>
        </div>
      )}

      {/* Open Card Button */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full h-8 text-xs bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 border border-primary/20 hover:border-primary/40 transition-all"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        <Eye className="w-3.5 h-3.5 mr-1.5" />
        Открыть карточку
      </Button>
    </div>
  );
};
