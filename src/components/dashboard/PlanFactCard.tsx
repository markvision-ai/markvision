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

// ИСПРАВЛЕНО: Полные числа БЕЗ сокращений (К, млн)
const formatValue = (value: number, format: 'number' | 'currency' | 'percent'): string => {
  if (format === 'currency') {
    // Только "млн" для миллионов, остальное - полностью
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1).replace('.0', '') + ' млн ₸';
    }
    return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
  }
  if (format === 'percent') {
    return value.toFixed(1) + '%';
  }
  // Number format - только "млн", остальное полностью
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1).replace('.0', '') + ' млн';
  }
  return new Intl.NumberFormat('ru-RU').format(Math.round(value));
};

// Форматирование для строки плана (БЕЗ валюты)
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl p-5",
        // Glassmorphism для ОБЕИХ тем
        "bg-card/80 backdrop-blur-xl",
        "border border-border/50",
        // Glow on hover
        "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10",
        // Golden border для overperformance > 200%
        isOverPerforming && "border-amber-400/50 shadow-lg shadow-amber-500/20",
        "transition-all duration-500",
        className
      )}
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-secondary/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10 space-y-3">
        {/* Icon & Label */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-primary/80 transition-colors group-hover:text-primary">
              {icon}
            </div>
            <span className="text-xs md:text-sm font-medium text-muted-foreground whitespace-nowrap">
              {label}
            </span>
          </div>
          
          {/* Glow Badge для Percentage */}
          {showProgress && (
            <Badge 
              className={cn(
                "text-xs font-semibold px-2 py-0.5 whitespace-nowrap",
                isOnTrack 
                  ? "bg-success/20 text-success border-success/30 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                  : "bg-warning/20 text-warning border-warning/30"
              )}
              variant="outline"
            >
              {percentage.toFixed(0)}%
            </Badge>
          )}
        </div>

        {/* Main Value */}
        <div className="space-y-2">
          <p className={cn(
            "text-2xl md:text-3xl font-bold whitespace-nowrap",
            "text-foreground",
            "transition-all duration-300"
          )}>
            {displayValue}
          </p>

          {/* Plan Line */}
          {plan !== undefined && plan > 0 && (
            <p className="text-sm md:text-base font-semibold text-muted-foreground whitespace-nowrap">
              План: {formatPlanValue(plan, format)}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="space-y-1.5">
            <div className="w-full bg-muted/50 rounded-full h-2.5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(percentage, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isOverPerforming 
                    ? "bg-gradient-to-r from-amber-400 via-amber-500 to-indigo-500"
                    : isOnTrack
                      ? "bg-gradient-to-r from-success to-success/80 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                      : "bg-gradient-to-r from-primary to-primary/80"
                )}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
