import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PlanFactCardProps {
  label: string;
  value: string | number;
  plan?: number;
  fact?: number;
  icon?: ReactNode;
  format?: 'number' | 'currency' | 'percent';
  className?: string;
}

const formatValue = (value: number, format: 'number' | 'currency' | 'percent'): string => {
  if (format === 'currency') {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1).replace('.0', '') + ' млн ₸';
    }
    if (value >= 100000) {
      return (value / 1000).toFixed(0) + ' тыс ₸';
    }
    return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
  }
  if (format === 'percent') {
    return value.toFixed(1) + '%';
  }
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1).replace('.0', '') + ' млн';
  }
  if (value >= 100000) {
    return (value / 1000).toFixed(0) + ' тыс';
  }
  return new Intl.NumberFormat('ru-RU').format(Math.round(value));
};

const formatDisplayValue = (value: string | number, format: 'number' | 'currency' | 'percent'): string => {
  if (typeof value === 'string') {
    // Try to extract number and format it compactly
    const numMatch = value.match(/^([\d\s]+)/);
    if (numMatch) {
      const numStr = numMatch[1].replace(/\s/g, '');
      const num = parseInt(numStr, 10);
      if (!isNaN(num)) {
        const suffix = value.replace(numStr, '').replace(/^\s+/, '');
        if (num >= 1000000) {
          return (num / 1000000).toFixed(1).replace('.0', '') + ' млн' + (suffix ? ' ' + suffix : '');
        }
        if (num >= 100000) {
          return (num / 1000).toFixed(0) + ' тыс' + (suffix ? ' ' + suffix : '');
        }
      }
    }
    return value;
  }
  return formatValue(value, format);
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
  const percentage = plan && fact ? (fact / plan) * 100 : 0;
  const isOnTrack = percentage >= 100;
  const displayValue = formatDisplayValue(value, format);

  return (
    <div className={cn(
      "premium-card p-5 md:p-6 group",
      className
    )}>
      <div className="flex items-center justify-between mb-4 gap-2">
        <span className="text-xs md:text-sm text-muted-foreground font-medium">{label}</span>
        {icon && (
          <div className="flex-shrink-0 p-2 md:p-2.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
            {icon}
          </div>
        )}
      </div>
      
      {/* Large value - prominent typography */}
      <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-none mb-4">
        {displayValue}
      </div>
      
      {plan !== undefined && fact !== undefined && (
        <div className="space-y-2">
          {/* Progress bar */}
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-700",
                isOnTrack ? "bg-success" : "bg-primary"
              )}
              style={{ 
                width: `${Math.min(percentage, 100)}%`,
                boxShadow: isOnTrack 
                  ? '0 0 10px hsl(var(--success) / 0.5)' 
                  : '0 0 10px hsl(var(--primary) / 0.5)'
              }}
            />
          </div>
          
          {/* Plan text - muted and smaller */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] md:text-xs text-muted-foreground/50">
              План: {formatValue(plan, format)}
            </span>
            <span className={cn(
              "text-[10px] md:text-xs font-medium",
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
