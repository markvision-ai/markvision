import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PlanFactCardProps {
  label: string;
  value: number;
  plan?: number;
  fact?: number;
  icon?: ReactNode;
  format?: 'number' | 'currency' | 'percent';
  className?: string;
}

// Single source of truth for formatting - NO "тыс", only "млн" for millions
const formatValue = (value: number, format: 'number' | 'currency' | 'percent'): string => {
  if (format === 'currency') {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1).replace('.0', '') + ' млн ₸';
    }
    // Full number with spaces, NO "тыс"
    return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
  }
  if (format === 'percent') {
    return value.toFixed(1) + '%';
  }
  // Number format - only abbreviate millions
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
  const showProgress = plan !== undefined && plan > 0 && fact !== undefined;
  const displayValue = formatValue(value, format);

  return (
    <div className={cn(
      "group relative overflow-hidden rounded-xl p-4 md:p-5",
      "bg-card",
      "border border-border",
      "shadow-sm",
      "transition-all duration-300",
      "hover:shadow-md hover:border-primary/20",
      className
    )}>
      {/* Header with label and icon */}
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-muted-foreground">
          {label}
        </span>
        {icon && (
          <div className="text-muted-foreground group-hover:text-primary transition-colors duration-300">
            {icon}
          </div>
        )}
      </div>
      
      {/* Large value - prominent typography */}
      <div className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight leading-none">
        {displayValue}
      </div>
      
      {/* Progress section - only show when plan > 0 */}
      {showProgress && (
        <div className="mt-4 space-y-1.5">
          {/* Thin progress bar */}
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isOnTrack ? "bg-success" : "bg-primary"
              )}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          
          {/* Plan text */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              План: {formatValue(plan, format)}
            </span>
            <span className={cn(
              "text-[10px] font-medium",
              isOnTrack ? "text-success" : "text-muted-foreground"
            )}>
              {percentage.toFixed(0)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
