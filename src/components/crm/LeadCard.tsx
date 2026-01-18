import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Lead } from '@/hooks/useLeads';
import { differenceInMinutes } from 'date-fns';
import { Phone, Calendar, GripVertical, Sparkles, MessageCircle, Globe, Crown, Flame, Zap, TrendingUp, Gem, AlertTriangle, BoltIcon, Instagram, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { isLeadAutomated } from '@/lib/webhooks';
import { useState, useEffect, useMemo } from 'react';
import { safeFormat, safeParseDate } from '@/lib/dateUtils';
import { WhatsAppDialog } from './WhatsAppDialog';

interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
  isDragging?: boolean;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  selectionMode?: boolean;
  projectId?: string;
}

export const LeadCard = ({ 
  lead, 
  onClick, 
  isDragging = false,
  isSelected = false,
  onSelect,
  selectionMode = false,
  projectId
}: LeadCardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging: isCurrentlyDragging } = useDraggable({
    id: lead.id,
    disabled: selectionMode,
  });

  // SLA Alert: Check if lead is in "Новая" status for more than 15 minutes
  const [needsAttention, setNeedsAttention] = useState(false);
  const [minutesWaiting, setMinutesWaiting] = useState(0);
  
  useEffect(() => {
    const checkSLA = () => {
      if (lead.status === 'Новая' || lead.status === 'new') {
        const lastUpdate = lead.updated_at || lead.created_at;
        const parsedDate = safeParseDate(lastUpdate);
        if (parsedDate) {
          const minutes = differenceInMinutes(new Date(), parsedDate);
          setMinutesWaiting(minutes);
          setNeedsAttention(minutes >= 15);
        } else {
          setNeedsAttention(false);
          setMinutesWaiting(0);
        }
      } else {
        setNeedsAttention(false);
        setMinutesWaiting(0);
      }
    };
    
    checkSLA();
    const interval = setInterval(checkSLA, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [lead.status, lead.updated_at, lead.created_at]);

  // Check if lead has active automation
  const hasAutomation = isLeadAutomated(lead.extra_data);

  // Only apply transform, no transition during drag to prevent stickiness
  const style: React.CSSProperties = transform
    ? {
        transform: CSS.Translate.toString(transform),
        transition: undefined, // Remove transition during drag
      }
    : {};

  // Lead scoring visualization based on extra_data.budget_tier, lead_score, or marketing_budget_total
  const extraData = lead.extra_data as any;
  const marketingBudget = extraData?.marketing_budget_total || 0;
  const isGoldenLead = marketingBudget > 1000000;
  
  const getScoreTier = () => {
    const budgetTier = extraData?.budget_tier?.toUpperCase?.();
    const leadScore = (lead as any).lead_score;
    
    // MEGA: budget_tier MEGA, lead_score >= 90, or marketing_budget >= 1,000,000
    if (budgetTier === 'MEGA' || leadScore >= 90 || marketingBudget >= 1000000) {
      return { tier: 'MEGA', color: '', icon: <Crown className="w-4 h-4 text-amber-500" />, emoji: '👑' };
    }
    // HIGH: budget_tier HIGH, lead_score >= 70, or marketing_budget >= 500,000
    if (budgetTier === 'HIGH' || leadScore >= 70 || marketingBudget >= 500000) {
      return { tier: 'HIGH', color: 'border-l-4 border-l-orange-500 bg-orange-500/5', icon: <Flame className="w-4 h-4 text-orange-500" />, emoji: '🔥' };
    }
    // MEDIUM: budget_tier MEDIUM, lead_score >= 40, or marketing_budget >= 100,000
    if (budgetTier === 'MEDIUM' || leadScore >= 40 || marketingBudget >= 100000) {
      return { tier: 'MEDIUM', color: 'border-l-4 border-l-blue-500 bg-blue-500/5', icon: <Zap className="w-4 h-4 text-blue-500" />, emoji: '⚡️' };
    }
    return { tier: null, color: '', icon: null, emoji: '' };
  };

  // Growth potential calculator
  const growthPotential = marketingBudget * 3;

  const scoreTier = getScoreTier();

  // Extract clinic name from extra_data if available
  const clinicName = (lead.extra_data as any)?.clinic_name || (lead.extra_data as any)?.clinicName || null;
  
  // Name mapping: prefer name, fallback to contact_name
  const displayName = lead.name || (lead.extra_data as any)?.contact_name || 'Без имени';
  
  // Chat appointment date from selected_date
  const selectedDate = (lead.extra_data as any)?.selected_date;

  const getSourceBadge = () => {
    const source = lead.utm_source?.toLowerCase();
    
    const sourceStyles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      yandex: { bg: 'bg-yellow-500/20', text: 'text-yellow-600', icon: <Globe className="w-3 h-3" /> },
      google: { bg: 'bg-blue-500/20', text: 'text-blue-600', icon: <Globe className="w-3 h-3" /> },
      vk: { bg: 'bg-sky-500/20', text: 'text-sky-600', icon: <Globe className="w-3 h-3" /> },
      facebook: { bg: 'bg-indigo-500/20', text: 'text-indigo-600', icon: <Globe className="w-3 h-3" /> },
      instagram: { bg: 'bg-pink-500/20', text: 'text-pink-600', icon: <Instagram className="w-3 h-3" /> },
      telegram: { bg: 'bg-cyan-500/20', text: 'text-cyan-600', icon: <Globe className="w-3 h-3" /> },
    };

    const styleData = source && sourceStyles[source] 
      ? sourceStyles[source] 
      : { bg: 'bg-muted', text: 'text-muted-foreground', icon: <Globe className="w-3 h-3" /> };

    return (
      <div className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
        styleData.bg, styleData.text
      )}>
        {styleData.icon}
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
  
  // Check if lead is MEGA tier for VIP Shine effect
  const isMegaTier = scoreTier.tier === 'MEGA';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(selectionMode ? {} : { ...listeners, ...attributes })}
      className={cn(
        'rounded-xl p-3 sm:p-4 group touch-none relative overflow-hidden',
        // SLA Alert - Pulsing red border for leads waiting > 15 min
        needsAttention && 'animate-pulse ring-2 ring-red-500 border-red-500',
        // VIP Shine + Gold Glow for MEGA leads
        isMegaTier && !needsAttention && 'vip-shine vip-glow',
        // Golden background for MEGA leads (budget > 1M)
        isGoldenLead && !needsAttention
          ? 'bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 dark:from-amber-900/30 dark:via-yellow-900/20 dark:to-amber-800/30 border-2 border-amber-400/70 dark:border-amber-500/50' 
          : !needsAttention && 'bg-card border border-border',
        needsAttention && 'bg-red-50 dark:bg-red-950/30',
        // Only apply hover transitions when not dragging
        !showDragging && 'transition-all duration-200 hover:shadow-lg',
        !showDragging && !isGoldenLead && !needsAttention && 'hover:border-primary/30',
        !showDragging && isGoldenLead && 'hover:shadow-[0_0_40px_rgba(251,191,36,0.5)]',
        selectionMode ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing',
        showDragging && 'shadow-xl opacity-95 z-50',
        isSelected && 'ring-2 ring-primary bg-primary/5',
        !isGoldenLead && !needsAttention && scoreTier.color // Apply tier-based styling only for non-golden
      )}
      onClick={handleCardClick}
    >
      {/* SLA Alert Banner */}
      {needsAttention && (
        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-[10px] font-bold py-1 px-2 flex items-center justify-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          ⚠️ Требует внимания! ({minutesWaiting} мин)
        </div>
      )}

      {/* Automation Badge */}
      {hasAutomation && (
        <div className="absolute top-2 right-2 z-10">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <BoltIcon className="w-3.5 h-3.5 text-blue-500" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>AI-автоматизация активна</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* Score Tier Badge - Premium styling for MEGA */}
      {scoreTier.tier && (
        <div className={cn(
          "flex items-center gap-1.5 mb-2 pl-0",
          isGoldenLead && "relative"
        )}>
          <span className="text-base">{scoreTier.emoji}</span>
          <span className={cn(
            "text-xs font-bold uppercase tracking-wide",
            scoreTier.tier === 'MEGA' && 'text-amber-600 drop-shadow-sm',
            scoreTier.tier === 'HIGH' && 'text-orange-500',
            scoreTier.tier === 'MEDIUM' && 'text-blue-500'
          )}>
            {scoreTier.tier}
          </span>
          {isGoldenLead && (
            <Gem className="w-3.5 h-3.5 text-amber-500 ml-1 animate-pulse" />
          )}
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
          <div className="flex items-center gap-2">
            <p className={cn("text-sm leading-tight truncate", clinicName ? "text-muted-foreground" : "font-semibold")}>
              {displayName}
            </p>
            {/* LTV Badge */}
            {lead.ltv && lead.ltv > 0 && (
              <Badge className="bg-emerald-500/20 text-emerald-600 border-0 text-[10px] font-bold px-1.5 py-0 h-5 flex-shrink-0">
                <DollarSign className="w-2.5 h-2.5 mr-0.5" />
                {new Intl.NumberFormat('ru-RU', { notation: 'compact' }).format(lead.ltv)}
              </Badge>
            )}
          </div>
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
          {safeFormat(lead.created_at, 'd MMM yyyy, HH:mm', 'Дата неизвестна')}
        </span>
      </div>

      {/* Chat appointment date if available */}
      {selectedDate && (
        <div className="flex items-center gap-2 text-xs text-emerald-600 mb-2 pl-9">
          <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate font-medium">
            Запись из чата: {selectedDate}
          </span>
        </div>
      )}

      {/* Source */}
      <div className="mb-3 pl-9">
        {getSourceBadge()}
      </div>

      {/* Amount Badge (if paid) */}
      {lead.status === 'paid' && lead.deal_amount && lead.deal_amount > 0 && (
        <div className="mb-3 pl-9">
          <Badge className="bg-success/20 text-success border-0 text-xs font-bold">
            <Sparkles className="w-3 h-3 mr-1" />
            {new Intl.NumberFormat('ru-RU').format(Math.round(lead.deal_amount))} ₸
          </Badge>
        </div>
      )}

      {/* Budget Qualification Block - Premium "Growth Potential" Calculator */}
      {marketingBudget > 0 && (
        <div className={cn(
          "mb-3 pl-9",
        )}>
          <div className={cn(
            "p-2.5 rounded-lg border",
            isGoldenLead 
              ? "bg-gradient-to-r from-amber-100/80 to-yellow-100/80 border-amber-300/50" 
              : "bg-muted/50 border-border/50"
          )}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <TrendingUp className={cn(
                "w-3.5 h-3.5",
                isGoldenLead ? "text-amber-600" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-[10px] font-semibold uppercase tracking-wider",
                isGoldenLead ? "text-amber-700" : "text-muted-foreground"
              )}>
                Бюджетная квалификация
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <p className={cn(
                  "text-[10px]",
                  isGoldenLead ? "text-amber-600" : "text-muted-foreground"
                )}>
                  Текущий бюджет
                </p>
                <p className={cn(
                  "text-sm font-bold",
                  isGoldenLead ? "text-amber-700" : "text-foreground"
                )}>
                  {new Intl.NumberFormat('ru-RU').format(Math.round(marketingBudget))} ₸
                </p>
              </div>
              <div className="text-right">
                <p className={cn(
                  "text-[10px]",
                  isGoldenLead ? "text-amber-600" : "text-muted-foreground"
                )}>
                  Потенциал роста ×3
                </p>
                <p className={cn(
                  "text-sm font-bold",
                  isGoldenLead ? "text-amber-700" : "text-primary"
                )}>
                  {new Intl.NumberFormat('ru-RU').format(Math.round(growthPotential))} ₸
                </p>
              </div>
            </div>
          </div>
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
              {projectId ? (
                <WhatsAppDialog
                  leadName={displayName}
                  leadPhone={lead.phone || ''}
                  projectId={projectId}
                  clinicName={clinicName}
                />
              ) : (
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
              )}
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
