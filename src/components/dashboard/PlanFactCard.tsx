import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PlanFactCardProps {
  label: string;
  value: number; // Changed to number only - no more string parsing!
  plan?: number;
  fact?: number;
  icon?: ReactNode;
  format?: 'number' | 'currency' | 'percent';
  className?: string;
}

// Single source of truth for formatting
const formatValue = (value: number, format: 'number' | 'currency' | 'percent'): string => {
  if (format === 'currency') {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1).replace('.0', '') + ' млн ₸';
    }
    if (value >= 10000) {
      return Math.round(value / 1000) + ' тыс ₸';
    }
    return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
  }
  if (format === 'percent') {
    return value.toFixed(1) + '%';
  }
  // Number format
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1).replace('.0', '') + ' млн';
  }
  if (value >= 10000) {
    return Math.round(value / 1000) + ' тыс';
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
  const showProgress = plan !== undefined && plan > 0 && fact !== undefined;
  const displayValue = formatValue(value, format);

  return (
    <div className={cn(
      "group relative overflow-hidden rounded-2xl p-4 md:p-5",
      "bg-card/60 backdrop-blur-xl",
      "border border-white/[0.08]",
      "transition-all duration-500 ease-out",
      "hover:border-primary/30 hover:shadow-[0_0_30px_hsl(var(--primary)/0.12)]",
      "hover:-translate-y-0.5",
      className
    )}>
      {/* Header with label and icon */}
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-muted-foreground/70 font-medium uppercase tracking-wide">
          {label}
        </span>
        {icon && (
          <div className="text-primary/60 group-hover:text-primary transition-colors duration-300">
            {icon}
          </div>
        )}
      </div>
      
      {/* Large value - prominent typography */}
      <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-none">
        {displayValue}
      </div>
      
      {/* Progress section - only show when plan > 0 */}
      {showProgress && (
        <div className="mt-4 space-y-1.5">
          {/* Thin progress bar with glow */}
          <div className="h-1 bg-muted/50 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-700 ease-out",
                isOnTrack ? "bg-success" : "bg-primary"
              )}
              style={{ 
                width: `${Math.min(percentage, 100)}%`,
                boxShadow: percentage > 0 
                  ? isOnTrack 
                    ? '0 0 8px hsl(var(--success) / 0.6)' 
                    : '0 0 8px hsl(var(--primary) / 0.6)'
                  : 'none'
              }}
            />
          </div>
          
          {/* Plan text - very muted */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground/40 font-medium">
              План: {formatValue(plan, format)}
            </span>
            <span className={cn(
              "text-[10px] font-semibold",
              isOnTrack ? "text-success" : "text-muted-foreground/50"
            )}>
              {percentage.toFixed(0)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
