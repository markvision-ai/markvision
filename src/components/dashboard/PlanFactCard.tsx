import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

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
    return value.toFixed(1) + '%';
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
    return value.toFixed(1) + '%';
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "group relative overflow-hidden rounded-xl p-4",
        // Apple-style: subtle, clean
        "bg-card/90 backdrop-blur-sm",
        "border border-border",
        "hover:border-border/80 hover:bg-card",
        isOverPerforming && "border-amber-400/40",
        "transition-all duration-200",
        className
      )}
    >
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
          <div className="w-full bg-muted/30 rounded-full h-1 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(percentage, 100)}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "h-full rounded-full",
                isOverPerforming 
                  ? "bg-gradient-to-r from-amber-400 to-amber-500"
                  : isOnTrack
                    ? "bg-emerald-500"
                    : "bg-primary"
              )}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};
