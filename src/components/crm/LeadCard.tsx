import { useDraggable } from '@dnd-kit/core';
import { Lead } from '@/hooks/useLeads';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Phone, Calendar, Eye, GripVertical, Sparkles, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
  isDragging?: boolean;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  selectionMode?: boolean;
}

export const LeadCard = ({ 
  lead, 
  onClick, 
  isDragging = false,
  isSelected = false,
  onSelect,
  selectionMode = false
}: LeadCardProps) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: lead.id,
    disabled: selectionMode,
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

    const styleData = sourceStyles[source] || { bg: 'bg-secondary', text: 'text-secondary-foreground', glow: '' };

    return (
      <Badge variant="secondary" className={cn('text-[10px] font-semibold border-0', styleData.bg, styleData.text, styleData.glow)}>
        {lead.utm_source}
      </Badge>
    );
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    return phone.replace(/\D/g, '');
  };

  const handleQuickAction = (e: React.MouseEvent, action: 'call' | 'whatsapp') => {
    e.stopPropagation();
    
    switch (action) {
      case 'call':
        if (lead.phone) {
          window.open(`tel:${lead.phone}`, '_self');
        }
        break;
      case 'whatsapp':
        if (lead.phone) {
          const phone = formatPhoneForWhatsApp(lead.phone);
          window.open(`https://wa.me/${phone}`, '_blank');
        }
        break;
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    onSelect?.(checked);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'crm-card-glass rounded-xl p-3 sm:p-4 transition-all duration-300 premium-border group',
        !selectionMode && 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-95 shadow-2xl rotate-2 scale-105 z-50',
        !isDragging && !selectionMode && 'hover:scale-[1.02] hover:shadow-lg hover:border-primary/30',
        isSelected && 'ring-2 ring-primary bg-primary/5',
        selectionMode && 'cursor-pointer'
      )}
      onClick={selectionMode ? () => onSelect?.(!isSelected) : undefined}
    >
      {/* Selection Checkbox & Drag Handle */}
      <div className="flex items-center gap-2 mb-3">
        {selectionMode ? (
          <div 
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={handleCheckboxChange}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
          </div>
        ) : (
          <div 
            {...listeners}
            {...attributes}
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0"
          >
            <GripVertical className="w-4 h-4 text-primary/70" />
          </div>
        )}
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

      {/* Quick Actions */}
      <div className="flex gap-1.5 mb-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-lg",
                  lead.phone 
                    ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500" 
                    : "bg-muted/50 text-muted-foreground cursor-not-allowed"
                )}
                onClick={(e) => handleQuickAction(e, 'call')}
                disabled={!lead.phone}
              >
                <Phone className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{lead.phone ? 'Позвонить' : 'Нет телефона'}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-lg",
                  lead.phone 
                    ? "bg-green-500/10 hover:bg-green-500/20 text-green-500" 
                    : "bg-muted/50 text-muted-foreground cursor-not-allowed"
                )}
                onClick={(e) => handleQuickAction(e, 'whatsapp')}
                disabled={!lead.phone}
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{lead.phone ? 'WhatsApp' : 'Нет телефона'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Open Card Button */}
      {!selectionMode && (
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
      )}
    </div>
  );
};
