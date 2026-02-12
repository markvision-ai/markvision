import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Lead } from '@/hooks/useLeads';
import { Phone, Calendar, GripVertical, Sparkles, MessageCircle, Globe, Crown, Flame, Zap, TrendingUp, Gem, AlertTriangle, BoltIcon, Instagram, DollarSign, Brain, Snowflake, ThermometerSun, Image, ExternalLink, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { isLeadAutomated } from '@/lib/webhooks';
import { useMemo } from 'react';
import { safeFormat } from '@/lib/dateUtils';
import { WhatsAppDialog } from './WhatsAppDialog';

export interface LeadSlaData {
  needsAttention: boolean;
  minutesWaiting: number;
  isNewLead: boolean;
}

interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
  isDragging?: boolean;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  selectionMode?: boolean;
  projectId?: string;
  slaData?: LeadSlaData;
}

export const LeadCard = ({
  lead,
  onClick,
  isDragging = false,
  isSelected = false,
  onSelect,
  selectionMode = false,
  projectId,
  slaData
}: LeadCardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging: isCurrentlyDragging } = useDraggable({
    id: lead.id,
    disabled: selectionMode,
  });

  // SLA data computed by parent (KanbanBoard) via shared timer
  const needsAttention = slaData?.needsAttention ?? false;
  const minutesWaiting = slaData?.minutesWaiting ?? 0;
  const isNewLead = slaData?.isNewLead ?? false;

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
        'rounded-2xl p-4 sm:p-5 group touch-none relative overflow-hidden transition-all duration-500',
        'interstellar-card-elevated backdrop-blur-xl border border-white/5 shadow-2xl',
        // SLA Alert
        needsAttention && 'border-red-500/50 shadow-red-500/20',
        // VIP Shine + Gold Glow for MEGA leads
        isMegaTier && !needsAttention && 'vip-shine vip-glow border-amber-500/30',
        // Glow effect for high scoring leads (>= 80)
        hasHighScore && !needsAttention && 'shadow-[0_0_30px_rgba(239,68,68,0.2)] ring-1 ring-red-500/30',
        // Golden background for MEGA leads (budget > 1M)
        isGoldenLead && !needsAttention && 'bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-amber-900/10 border-amber-500/40',

        selectionMode ? 'cursor-pointer' : 'cursor-pointer active:cursor-grabbing', // FORCE cursor-pointer
        showDragging && 'shadow-2xl opacity-90 z-50 scale-[1.02] border-primary/50',
        isSelected && 'ring-2 ring-primary bg-primary/10 border-primary/40',
        !isGoldenLead && !needsAttention && scoreTier.color
      )}
      onClick={handleCardClick}
    >
      {/* Decorative background glow based on tier */}
      <div className={cn(
        "absolute -top-12 -right-12 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-700",
        scoreTier.tier === 'HOT' ? 'bg-red-500' :
          scoreTier.tier === 'WARM' ? 'bg-yellow-500' :
            scoreTier.tier === 'COLD' ? 'bg-blue-500' : 'bg-primary'
      )} />
      {/* SLA Alert Badge - Subtle */}
      {needsAttention && (
        <div className="mb-3 flex items-center gap-2 px-2 py-1.5 rounded-md bg-red-100/50  border border-red-200  text-red-700  text-xs font-medium">
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

      {/* NEW Badge - синее свечение для лидов < 1 часа */}
      {isNewLead && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-blue-600/30 text-blue-400 border-blue-500/50 shadow-[0_0_15px_rgba(37,99,235,0.4)] animate-pulse font-black text-[10px] tracking-tighter">
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

      {/* Score Tier Badge with Glow animation for high scores */}
      {scoreTier.tier && (
        <div className={cn(
          "flex items-center gap-1.5 mb-2 pl-0",
          isGoldenLead && "relative",
          scoreTier.glow && "relative"
        )}>
          <div className={cn(
            "flex items-center gap-1.5",
            scoreTier.glow && "animate-pulse"
          )}>
            {scoreTier.icon}
            <span className={cn(
              "text-xs font-bold tracking-wide text-[14px]",
              scoreTier.tier === 'HOT' && 'text-red-500',
              scoreTier.tier === 'WARM' && 'text-yellow-500',
              scoreTier.tier === 'COLD' && 'text-blue-500',
              scoreTier.tier === 'MEGA' && 'text-amber-600 drop-shadow-sm',
              scoreTier.tier === 'HIGH' && 'text-orange-500',
              scoreTier.tier === 'MEDIUM' && 'text-blue-500'
            )}>
              {scoreTier.label || scoreTier.tier}
            </span>
            {leadScore !== null && (
              <Badge variant="outline" className="text-[12px] px-1.5 py-0">
                {leadScore}
              </Badge>
            )}
          </div>
          {isGoldenLead && (
            <Gem className="w-3.5 h-3.5 text-amber-500 ml-1 animate-pulse" />
          )}
          {/* Glow effect for scores >= 80 */}
          {scoreTier.glow && (
            <div className="absolute inset-0 rounded-xl bg-red-500/20 blur-xl -z-10 animate-pulse" />
          )}
        </div>
      )}

      {/* Header: Name + Drag Handle */}
      <div className="flex items-start gap-4 mb-4 relative z-10">
        {selectionMode ? (
          <div
            className="w-9 h-9 rounded-xl interstellar-glass flex items-center justify-center flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect?.(!!checked)}
              className="data-[state=checked]:bg-primary border-white/20"
            />
          </div>
        ) : (
          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 group-hover:border-primary/30 transition-all duration-300">
            <GripVertical className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {clinicName && (
            <p className="font-black text-[11px] uppercase tracking-widest text-primary mb-1">
              {clinicName}
            </p>
          )}
          <div className="flex items-center gap-2">
            <h4 className={cn("text-base leading-tight truncate font-bold", clinicName ? "text-foreground" : "text-foreground")}>
              {displayName}
            </h4>
            {lead.ltv && lead.ltv > 0 && (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] font-black px-1.5 py-0 h-5 flex-shrink-0">
                <DollarSign className="w-2.5 h-3 mr-0.5" />
                {new Intl.NumberFormat('ru-RU', { notation: 'compact' }).format(lead.ltv)}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Info Rows */}
      <div className="space-y-2.5 mb-4 pl-1 relative z-10">
        <div className="flex items-center gap-3 text-xs text-muted-foreground px-2 py-1 rounded-lg hover:bg-white/5 transition-colors">
          <Phone className="w-3.5 h-3.5 flex-shrink-0 text-primary/70" />
          <span className="truncate font-semibold tracking-wide">
            {lead.phone || 'Нет телефона'}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground px-2 py-1 rounded-lg hover:bg-white/5 transition-colors">
          <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-primary/70" />
          <span className="truncate font-medium">
            {safeFormat(lead.created_at, 'd MMM yyyy, HH:mm', 'Дата неизвестна')}
          </span>
        </div>

        {selectedDate && (
          <div className="flex items-center gap-3 text-[11px] text-emerald-400 px-2 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
            <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate font-black uppercase tracking-wider">
              Записан: {selectedDate}
            </span>
          </div>
        )}

        <div className="flex items-center gap-3 px-2 mt-2">
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

      {/* Budget Qualification Block - Premium "Growth Potential" Calculator */}
      {marketingBudget > 0 && (
        <div className="mb-5 relative z-10">
          <div className={cn(
            "p-3.5 rounded-2xl border transition-all duration-300 backdrop-blur-md",
            isGoldenLead
              ? "interstellar-glass border-amber-500/40 bg-amber-500/5 shadow-lg shadow-amber-500/10"
              : "bg-white/5 border-white/10"
          )}>
            <div className="flex items-center gap-2 mb-3">
              <div className={cn(
                "p-1.5 rounded-lg",
                isGoldenLead ? "bg-amber-500/20" : "bg-white/10"
              )}>
                <TrendingUp className={cn(
                  "w-3.5 h-3.5",
                  isGoldenLead ? "text-amber-400" : "text-blue-400"
                )} />
              </div>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-[0.2em]",
                isGoldenLead ? "text-amber-400" : "text-muted-foreground"
              )}>
                Квалификация
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Текущий</p>
                <p className={cn(
                  "text-sm font-black tracking-tight",
                  isGoldenLead ? "text-amber-500" : "text-foreground"
                )}>
                  {new Intl.NumberFormat('ru-RU').format(Math.round(marketingBudget))} ₸
                </p>
              </div>
              <div className="text-right border-l border-white/10 pl-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Потенциал x3</p>
                <p className={cn(
                  "text-sm font-black tracking-tight",
                  isGoldenLead ? "text-amber-400" : "text-primary"
                )}>
                  {new Intl.NumberFormat('ru-RU').format(Math.round(growthPotential))} ₸
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions - Premium Floating Buttons */}
      <div
        className="flex gap-2 mt-auto relative z-10"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-10 flex-1 rounded-xl text-[11px] font-black uppercase tracking-widest interstellar-glass",
                  lead.phone
                    ? "bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/20"
                    : "bg-white/5 text-muted-foreground opacity-50 cursor-not-allowed"
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
                variant="ghost"
                size="sm"
                className={cn(
                  "h-10 flex-1 rounded-xl text-[11px] font-black uppercase tracking-widest interstellar-glass",
                  lead.phone
                    ? "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/20"
                    : "bg-white/5 text-muted-foreground opacity-50 cursor-not-allowed"
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
                variant="ghost"
                size="sm"
                className="h-10 flex-1 rounded-xl text-[11px] font-black uppercase tracking-widest interstellar-glass bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/20"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.();
                }}
              >
                <Brain className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>ИИ-Анализ</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
