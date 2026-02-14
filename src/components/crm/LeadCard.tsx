import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Lead } from '@/hooks/useLeads';
import { differenceInMinutes, differenceInHours } from 'date-fns';
import { Phone, Calendar, GripVertical, Sparkles, MessageCircle, Globe, Crown, Flame, Zap, TrendingUp, Gem, AlertTriangle, BoltIcon, Instagram, DollarSign, Brain, Snowflake, ThermometerSun, Image, ExternalLink, Clock } from 'lucide-react';
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
  const [isNewLead, setIsNewLead] = useState(false);

  useEffect(() => {
    const checkSLA = () => {
      if (lead.status === 'Новая' || lead.status === 'new') {
        const lastUpdate = lead.updated_at || lead.created_at;
        const parsedDate = safeParseDate(lastUpdate);
        if (parsedDate) {
          const minutes = differenceInMinutes(new Date(), parsedDate);
          const hours = differenceInHours(new Date(), parsedDate);
          setMinutesWaiting(minutes);
          setNeedsAttention(minutes >= 15);
          setIsNewLead(hours < 1); // NEW badge if created less than 1 hour ago
        } else {
          setNeedsAttention(false);
          setMinutesWaiting(0);
          setIsNewLead(false);
        }
      } else {
        setNeedsAttention(false);
        setMinutesWaiting(0);
        setIsNewLead(false);
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

  // Lead scoring visualization based on lead_score from database
  const extraData = lead.extra_data as any;
  const marketingBudget = extraData?.budget || extraData?.marketing_budget_total || 0;
  const isGoldenLead = marketingBudget > 1000000;
  const leadScore = lead.lead_score ?? null;

  const getScoreTier = () => {
    const budgetTier = extraData?.budget_tier?.toUpperCase?.();

    // Приоритет: lead_score из БД > budget_tier > marketing_budget
    if (leadScore !== null) {
      // Горячий (Красный): score >= 80
      if (leadScore >= 80) {
        return {
          tier: 'HOT',
          label: 'Hot Lead',
          color: 'border-l-4 border-l-red-500 bg-red-500/5',
          icon: <Flame className="w-4 h-4 text-red-500" />,
          emoji: '🔥',
          glow: true
        };
      }
      // Теплый (Желтый): score >= 50
      if (leadScore >= 50) {
        return {
          tier: 'WARM',
          label: 'Теплый',
          color: 'border-l-4 border-l-yellow-500 bg-yellow-500/5',
          icon: <ThermometerSun className="w-4 h-4 text-yellow-500" />,
          emoji: '🌡️',
          glow: false
        };
      }
      // Холодный (Голубой): score < 50
      return {
        tier: 'COLD',
        label: 'Холодный',
        color: 'border-l-4 border-l-blue-500 bg-blue-500/5',
        icon: <Snowflake className="w-4 h-4 text-blue-500" />,
        emoji: '❄️',
        glow: false
      };
    }

    // Fallback на старую логику для совместимости
    // MEGA: budget_tier MEGA, or marketing_budget >= 1,000,000
    if (budgetTier === 'MEGA' || marketingBudget >= 1000000) {
      return { tier: 'MEGA', label: 'MEGA', color: '', icon: <Crown className="w-4 h-4 text-amber-500" />, emoji: '👑', glow: false };
    }
    // HOT (was HIGH): budget_tier HIGH, or marketing_budget >= 500,000
    if (budgetTier === 'HIGH' || marketingBudget >= 500000) {
      return { tier: 'HOT', label: 'Hot Lead', color: 'border-l-4 border-l-red-500 bg-red-500/5', icon: <Flame className="w-4 h-4 text-red-500" />, emoji: '🔥', glow: true };
    }
    // MEDIUM: budget_tier MEDIUM, or marketing_budget >= 100,000
    if (budgetTier === 'MEDIUM' || marketingBudget >= 100000) {
      return { tier: 'MEDIUM', label: 'MEDIUM', color: 'border-l-4 border-l-blue-500 bg-blue-500/5', icon: <Zap className="w-4 h-4 text-blue-500" />, emoji: '⚡️', glow: false };
    }
    return { tier: null, label: '', color: '', icon: null, emoji: '', glow: false };
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
  // Check if lead has high score for Glow effect
  const hasHighScore = scoreTier.glow && leadScore !== null && leadScore >= 80;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(selectionMode ? {} : { ...listeners, ...attributes })}
      className={cn(
        'rounded-2xl p-4 sm:p-5 group touch-none relative overflow-hidden transition-all duration-200',
        'bg-card border border-border shadow-sm hover:shadow-md',
        needsAttention && 'border-red-300 ring-1 ring-red-200',
        isMegaTier && !needsAttention && 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20',
        hasHighScore && !needsAttention && 'border-red-200 ring-1 ring-red-100',
        isGoldenLead && !needsAttention && 'border-amber-300 bg-amber-50/30 dark:bg-amber-950/15',

        selectionMode ? 'cursor-pointer' : 'cursor-pointer active:cursor-grabbing',
        showDragging && 'shadow-lg z-50 scale-[1.02] border-primary',
        isSelected && 'ring-2 ring-primary ring-offset-2 bg-primary/5 border-primary',
        !isGoldenLead && !needsAttention && scoreTier.color
      )}
      onClick={handleCardClick}
    >
      {/* SLA Alert */}
      {needsAttention && (
        <div className="mb-3 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-medium">
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            {(() => {
              const days = Math.floor(minutesWaiting / 1440);
              const hours = Math.floor((minutesWaiting % 1440) / 60);
              const minutes = minutesWaiting % 60;
              const parts = [];
              if (days > 0) parts.push(`${days} д`);
              if (hours > 0) parts.push(`${hours} ч`);
              if (minutes > 0 && days === 0) parts.push(`${minutes} мин`);
              return `Ожидает ${parts.join(' ')}`.trim();
            })()}
          </span>
        </div>
      )}

      {/* NEW Badge */}
      {isNewLead && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-blue-500 text-white border-0 font-semibold text-[10px]">
            NEW
          </Badge>
        </div>
      )}

      {/* Automation Badge */}
      {hasAutomation && !isNewLead && (
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

      {/* Score tier — компактная полоска */}
      {scoreTier.tier && (
        <div className={cn(
          "flex items-center gap-2 mb-2 px-2.5 py-1.5 rounded-lg border w-fit",
          scoreTier.tier === 'HOT' && "bg-red-500/10 border-red-500/20",
          scoreTier.tier === 'WARM' && "bg-amber-500/10 border-amber-500/20",
          scoreTier.tier === 'COLD' && "bg-blue-500/10 border-blue-500/20",
          scoreTier.tier === 'MEGA' && "bg-amber-500/15 border-amber-500/30",
          (scoreTier.tier === 'HIGH' || scoreTier.tier === 'MEDIUM') && "bg-muted/50 border-border"
        )}>
          {scoreTier.icon}
          <span className={cn(
            "text-xs font-semibold",
            scoreTier.tier === 'HOT' && "text-red-600 dark:text-red-400",
            scoreTier.tier === 'WARM' && "text-amber-600 dark:text-amber-400",
            scoreTier.tier === 'COLD' && "text-blue-600 dark:text-blue-400",
            scoreTier.tier === 'MEGA' && "text-amber-700 dark:text-amber-400",
            scoreTier.tier === 'HIGH' && "text-orange-600 dark:text-orange-400",
            scoreTier.tier === 'MEDIUM' && "text-foreground"
          )}>
            {scoreTier.label || scoreTier.tier}
          </span>
          {leadScore !== null && (
            <span className="text-[11px] font-bold text-muted-foreground tabular-nums">{leadScore}</span>
          )}
          {isGoldenLead && <Gem className="w-3.5 h-3.5 text-amber-500" />}
        </div>
      )}

      {/* Header: Name + Handle */}
      <div className="flex items-start gap-3 mb-3 relative z-10">
        {selectionMode ? (
          <div
            className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect?.(!!checked)}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        ) : (
          <div className="w-9 h-9 rounded-lg bg-muted/50 border border-border flex items-center justify-center flex-shrink-0 group-hover:bg-muted transition-colors">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {clinicName && (
            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary mb-0.5">
              {clinicName}
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-base leading-tight truncate font-semibold text-foreground">
              {displayName}
            </h4>
            {lead.ltv && lead.ltv > 0 && (
              <Badge variant="secondary" className="text-[10px] font-semibold px-1.5 py-0 h-5 flex-shrink-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-0">
                <DollarSign className="w-2.5 h-3 mr-0.5" />
                {new Intl.NumberFormat('ru-RU', { notation: 'compact' }).format(lead.ltv)}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-1.5 mb-3 pl-0 relative z-10">
        <div className="flex items-center gap-2.5 text-xs text-muted-foreground py-1">
          <Phone className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
          <span className="truncate font-medium">
            {lead.phone || 'Нет телефона'}
          </span>
        </div>

        <div className="flex items-center gap-2.5 text-xs text-muted-foreground py-1">
          <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
          <span className="truncate">
            {safeFormat(lead.created_at, 'd MMM yyyy, HH:mm', '—')}
          </span>
        </div>

        {selectedDate && (
          <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 px-2 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate font-semibold uppercase tracking-wide">
              Записан: {selectedDate}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          {getSourceBadge()}
        </div>
      </div>

      {/* Payment Screenshot - if available */}
      {(lead.extra_data as any)?.payment_screenshot && (
        <div className="mb-3 pl-9">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs gap-1.5 border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-100   "
            onClick={(e) => {
              e.stopPropagation();
              window.open((lead.extra_data as any).payment_screenshot, '_blank');
            }}
          >
            <Image className="w-3.5 h-3.5" />
            Скриншот оплаты
            <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
          </Button>
        </div>
      )}

      {/* Amount Badge (if paid) */}
      {lead.status === 'paid' && lead.deal_amount && lead.deal_amount > 0 && (
        <div className="mb-3 pl-9">
          <Badge className="bg-success/20 text-success border-0 text-xs font-bold">
            <Sparkles className="w-3 h-3 mr-1" />
            {new Intl.NumberFormat('ru-RU').format(Math.round(lead.deal_amount))} ₸
          </Badge>
        </div>
      )}

      {/* Квалификация / бюджет */}
      {marketingBudget > 0 && (
        <div className="mb-4 relative z-10">
          <div className={cn(
            "p-3 rounded-xl border",
            isGoldenLead
              ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
              : "bg-muted/50 border-border"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className={cn(
                "w-3.5 h-3.5",
                isGoldenLead ? "text-amber-600" : "text-primary"
              )} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Квалификация
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Текущий</p>
                <p className="text-sm font-semibold text-foreground">
                  {new Intl.NumberFormat('ru-RU').format(Math.round(marketingBudget))} ₸
                </p>
              </div>
              <div className="text-right border-l border-border pl-3">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Потенциал x3</p>
                <p className="text-sm font-semibold text-primary">
                  {new Intl.NumberFormat('ru-RU').format(Math.round(growthPotential))} ₸
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div
        className="flex gap-2 mt-auto pt-2 border-t border-border relative z-10"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-9 flex-1 rounded-lg border",
                  lead.phone
                    ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                    : "opacity-50 cursor-not-allowed"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  if (lead.phone) {
                    const phone = formatPhoneForWhatsApp(lead.phone);
                    window.open(`https://wa.me/${phone}`, '_blank');
                  }
                }}
                disabled={!lead.phone}
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>WhatsApp</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-9 flex-1 rounded-lg border",
                  lead.phone
                    ? "bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30"
                    : "opacity-50 cursor-not-allowed"
                )}
                onClick={(e) => handleQuickAction(e, 'call')}
                disabled={!lead.phone}
              >
                <Phone className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Звонок</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 flex-1 rounded-lg border bg-violet-500/10 hover:bg-violet-500/20 text-violet-700 dark:text-violet-400 border-violet-500/30"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.();
                }}
              >
                <Brain className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Карточка / ИИ</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
