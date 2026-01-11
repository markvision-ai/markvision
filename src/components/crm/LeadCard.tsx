import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Lead } from '@/hooks/useLeads';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Phone, Calendar, GripVertical, Sparkles, MessageCircle, Globe, Crown, Flame, Zap } from 'lucide-react';
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
  const { attributes, listeners, setNodeRef, transform, isDragging: isCurrentlyDragging } = useDraggable({
    id: lead.id,
    disabled: selectionMode,
  });

  // Only apply transform, no transition during drag to prevent stickiness
  const style: React.CSSProperties = transform
    ? {
        transform: CSS.Translate.toString(transform),
        transition: undefined, // Remove transition during drag
      }
    : {};

  // Lead scoring visualization based on extra_data.budget_tier or lead_score
  const getScoreTier = () => {
    const extraData = lead.extra_data as any;
    const budgetTier = extraData?.budget_tier?.toUpperCase?.();
    const leadScore = (lead as any).lead_score;
    
    if (budgetTier === 'MEGA' || leadScore >= 90) {
      return { tier: 'MEGA', color: 'border-l-4 border-l-purple-500 bg-purple-500/5', icon: <Crown className="w-4 h-4 text-purple-500" />, emoji: '👑' };
    }
    if (budgetTier === 'HIGH' || leadScore >= 70) {
      return { tier: 'HIGH', color: 'border-l-4 border-l-orange-500 bg-orange-500/5', icon: <Flame className="w-4 h-4 text-orange-500" />, emoji: '🔥' };
    }
    if (budgetTier === 'MEDIUM' || leadScore >= 40) {
      return { tier: 'MEDIUM', color: 'border-l-4 border-l-blue-500 bg-blue-500/5', icon: <Zap className="w-4 h-4 text-blue-500" />, emoji: '⚡️' };
    }
    return { tier: null, color: '', icon: null, emoji: '' };
  };

  const scoreTier = getScoreTier();

  // Extract clinic name from extra_data if available
  const clinicName = (lead.extra_data as any)?.clinic_name || (lead.extra_data as any)?.clinicName || null;

  const getSourceBadge = () => {
    const source = lead.utm_source?.toLowerCase();
    
    const sourceStyles: Record<string, { bg: string; text: string }> = {
      yandex: { bg: 'bg-yellow-500/20', text: 'text-yellow-600' },
      google: { bg: 'bg-blue-500/20', text: 'text-blue-600' },
      vk: { bg: 'bg-sky-500/20', text: 'text-sky-600' },
      facebook: { bg: 'bg-indigo-500/20', text: 'text-indigo-600' },
      instagram: { bg: 'bg-pink-500/20', text: 'text-pink-600' },
      telegram: { bg: 'bg-cyan-500/20', text: 'text-cyan-600' },
    };

    const styleData = source && sourceStyles[source] 
      ? sourceStyles[source] 
      : { bg: 'bg-muted', text: 'text-muted-foreground' };

    return (
      <div className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
        styleData.bg, styleData.text
      )}>
        <Globe className="w-3 h-3" />
        <span className="truncate max-w-[80px]">
          {lead.utm_source || 'Прямой'}
        </span>
      </div>
    );
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    return phone.replace(/\D/g, '');
  };

  const handleQuickAction = (e: React.MouseEvent, action: 'call' | 'whatsapp') => {
    e.stopPropagation();
    e.preventDefault();
    
    if (action === 'call' && lead.phone) {
      window.open(`tel:${lead.phone}`, '_self');
    } else if (action === 'whatsapp' && lead.phone) {
      const phone = formatPhoneForWhatsApp(lead.phone);
      window.open(`https://wa.me/${phone}`, '_blank');
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Ignore clicks on interactive elements
    if ((e.target as HTMLElement).closest('button, a, [role="checkbox"]')) {
      return;
    }
    
    if (selectionMode) {
      onSelect?.(!isSelected);
    } else {
      onClick?.();
    }
  };

  const showDragging = isDragging || isCurrentlyDragging;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(selectionMode ? {} : { ...listeners, ...attributes })}
      className={cn(
        'bg-card border border-border rounded-xl p-3 sm:p-4 group touch-none',
        // Only apply hover transitions when not dragging
        !showDragging && 'transition-shadow duration-200 hover:shadow-md hover:border-primary/30',
        selectionMode ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing',
        showDragging && 'shadow-xl opacity-95 z-50',
        isSelected && 'ring-2 ring-primary bg-primary/5',
        scoreTier.color // Apply tier-based styling
      )}
      onClick={handleCardClick}
    >
      {/* Score Tier Badge */}
      {scoreTier.tier && (
        <div className="flex items-center gap-1.5 mb-2 pl-0">
          <span className="text-base">{scoreTier.emoji}</span>
          <span className={cn(
            "text-xs font-bold uppercase tracking-wide",
            scoreTier.tier === 'MEGA' && 'text-purple-500',
            scoreTier.tier === 'HIGH' && 'text-orange-500',
            scoreTier.tier === 'MEDIUM' && 'text-blue-500'
          )}>
            {scoreTier.tier}
          </span>
        </div>
      )}

      {/* Header: Name + Drag Handle */}
      <div className="flex items-start gap-2 mb-3">
        {selectionMode ? (
          <div 
            className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect?.(!!checked)}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
          </div>
        ) : (
          <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {/* Clinic name bold if available */}
          {clinicName && (
            <p className="font-bold text-sm leading-tight truncate text-primary mb-0.5">
              {clinicName}
            </p>
          )}
          <p className={cn("text-sm leading-tight truncate", clinicName ? "text-muted-foreground" : "font-semibold")}>
            {lead.name || 'Без имени'}
          </p>
        </div>
      </div>

      {/* Phone */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 pl-9">
        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="truncate font-medium">
          {lead.phone || 'Нет телефона'}
        </span>
      </div>

      {/* Date */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 pl-9">
        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="truncate">
          {format(new Date(lead.created_at), 'd MMM yyyy, HH:mm', { locale: ru })}
        </span>
      </div>

      {/* Source */}
      <div className="mb-3 pl-9">
        {getSourceBadge()}
      </div>

      {/* Amount Badge (if paid) */}
      {lead.status === 'paid' && lead.deal_amount && lead.deal_amount > 0 && (
        <div className="mb-3 pl-9">
          <Badge className="bg-success/20 text-success border-0 text-xs font-bold">
            <Sparkles className="w-3 h-3 mr-1" />
            {new Intl.NumberFormat('ru-RU').format(lead.deal_amount)} ₸
          </Badge>
        </div>
      )}

      {/* Quick Actions - visible on hover */}
      <div 
        className="flex gap-1.5 pl-9 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 px-2 rounded-md text-xs",
                  lead.phone 
                    ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600" 
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
                onClick={(e) => handleQuickAction(e, 'call')}
                disabled={!lead.phone}
              >
                <Phone className="w-3.5 h-3.5 mr-1" />
                Звонок
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
                size="sm"
                className={cn(
                  "h-7 px-2 rounded-md text-xs",
                  lead.phone 
                    ? "bg-green-500/10 hover:bg-green-500/20 text-green-600" 
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
                onClick={(e) => handleQuickAction(e, 'whatsapp')}
                disabled={!lead.phone}
              >
                <MessageCircle className="w-3.5 h-3.5 mr-1" />
                WhatsApp
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{lead.phone ? 'Написать в WhatsApp' : 'Нет телефона'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
