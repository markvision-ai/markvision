import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { GlassCard } from '@/components/ui/GlassCard';

interface PlanFactCardProps {
  label: string;
  value: number;
  plan?: number;
  fact?: number;
  icon?: ReactNode;
  format?: 'number' | 'currency' | 'percent';
  className?: string;
}

// Apple-style formatting: clean, minimal
const formatValue = (value: number, format: 'number' | 'currency' | 'percent'): string => {
  if (format === 'currency') {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1).replace('.0', '') + ' млн ₸';
    }
    return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
  }
  if (format === 'percent') {
    return Math.round(value) + '%';
  }
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1).replace('.0', '') + ' млн';
  }
  return new Intl.NumberFormat('ru-RU').format(Math.round(value));
};

const formatPlanValue = (value: number, format: 'number' | 'currency' | 'percent'): string => {
  if (format === 'currency') {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1).replace('.0', '') + ' млн';
    }
    return new Intl.NumberFormat('ru-RU').format(Math.round(value));
  }
  if (format === 'percent') {
    return Math.round(value) + '%';
  }
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1).replace('.0', '') + ' млн';
  }
  return new Intl.NumberFormat('ru-RU').format(Math.round(value));
};

export const PlanFactCard = ({
  label,
  value,
  plan,
  fact,
  icon,
  format = 'number',
  className
}: PlanFactCardProps) => {
  const percentage = plan && plan > 0 && fact !== undefined ? (fact / plan) * 100 : 0;
  const isOnTrack = percentage >= 100;
  const isOverPerforming = percentage >= 200;
  const showProgress = plan !== undefined && plan > 0 && fact !== undefined;
  const displayValue = formatValue(value, format);

  const stripe =
    label.toLowerCase().includes('показ') ? 'blue' :
      label.toLowerCase().includes('лид') ? 'cyan' :
        label.toLowerCase().includes('визит') || label.toLowerCase().includes('диагност') ? 'emerald' :
          label.toLowerCase().includes('продаж') ? 'gold' :
            'cyan';

  return (
    <div
      className={cn("group relative overflow-hidden rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300", className)}
    >
      <GlassCard stripe={stripe} className="p-4">
        <div className="space-y-2.5">
          {/* Header: Icon, Label, Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {icon && (
                <div className="text-muted-foreground/70 w-4 h-4">
                  {icon}
                </div>
              )}
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                {label}
              </span>
            </div>

            {showProgress && (
              <Badge
                className={cn(
                  "text-[10px] font-semibold px-1.5 py-0 h-5",
                  isOnTrack
                    ? "bg-emerald-500/10 text-emerald-600  border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-600  border-amber-500/20"
                )}
                variant="outline"
              >
                {percentage.toFixed(0)}%
              </Badge>
            )}
          </div>

          {/* Main Value - Apple typography */}
          <div className="space-y-1">
            <p className="text-2xl font-semibold text-foreground tracking-tight leading-none">
              {displayValue}
            </p>

            {/* Plan - minimal, clean */}
            {plan !== undefined && plan > 0 && (
              <p className="text-[11px] text-muted-foreground/70 font-medium">
                План {formatPlanValue(plan, format)}
              </p>
            )}
          </div>

          {/* Progress Bar - thin, elegant */}
          {showProgress && (
            <div className="w-full bg-muted-foreground/20 rounded-full h-1 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-1000 ease-out",
                  isOverPerforming
                    ? "bg-amber-500"
                    : isOnTrack
                      ? "bg-emerald-500"
                      : "bg-primary"
                )}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};
