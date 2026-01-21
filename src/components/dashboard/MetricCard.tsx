import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: { value: number; isPositive: boolean };
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'primary';
  className?: string;
}

// Format large numbers compactly
const formatCompact = (value: string | number): string => {
  // If it's already a string with formatting, return as-is
  if (typeof value === 'string') {
    // Check if it contains compact format already
    if (value.includes('млн') || value.includes('тыс')) {
      return value;
    }
    // Try to extract and format number
    const numMatch = value.match(/^([\d\s]+)/);
    if (numMatch) {
      const numStr = numMatch[1].replace(/\s/g, '');
      const num = parseInt(numStr, 10);
      if (!isNaN(num)) {
        const suffix = value.slice(numMatch[0].length).trim();
        if (num >= 1000000) {
          return (num / 1000000).toFixed(1).replace('.0', '') + ' млн' + (suffix ? ' ' + suffix : '');
        }
        if (num >= 10000) {
          return Math.round(num / 1000) + ' тыс' + (suffix ? ' ' + suffix : '');
        }
        return new Intl.NumberFormat('ru-RU').format(num) + (suffix ? ' ' + suffix : '');
      }
    }
    return value;
  }
  
  // Number value
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1).replace('.0', '') + ' млн';
  }
  if (value >= 10000) {
    return Math.round(value / 1000) + ' тыс';
  }
  return new Intl.NumberFormat('ru-RU').format(Math.round(value));
};

export const MetricCard = ({
  label,
  value,
  subValue,
  trend,
  icon,
  variant = 'default',
  className
}: MetricCardProps) => {
  const formattedValue = formatCompact(value);

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
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs text-muted-foreground/70 font-medium uppercase tracking-wide">
          {label}
        </span>
        {icon && (
          <div className="text-primary/60 group-hover:text-primary transition-colors duration-300">
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className={cn(
        "text-xl sm:text-2xl md:text-3xl font-bold tracking-tight leading-none",
        variant === 'success' && "text-success",
        variant === 'danger' && "text-destructive",
        variant === 'warning' && "text-warning",
        variant === 'primary' && "text-primary",
        variant === 'default' && "text-foreground"
      )}>
        {formattedValue}
      </div>

      {/* Subvalue */}
      {subValue && (
        <span className="text-[10px] text-muted-foreground/40 font-medium mt-1 block">
          {subValue}
        </span>
      )}

      {/* Trend indicator */}
      {trend && (
        <div className={cn(
          "inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium",
          trend.isPositive 
            ? "bg-success/10 text-success" 
            : "bg-destructive/10 text-destructive"
        )}>
          {trend.isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {Math.abs(trend.value).toFixed(1)}%
        </div>
      )}
    </div>
  );
};
