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

// Format large numbers - NO "тыс", only "млн" for millions
const formatCompact = (value: string | number): string => {
  if (typeof value === 'string') {
    if (value.includes('млн')) return value;
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
        return new Intl.NumberFormat('ru-RU').format(num) + (suffix ? ' ' + suffix : '');
      }
    }
    return value;
  }
  
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1).replace('.0', '') + ' млн';
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
      "group relative overflow-hidden rounded-xl p-4 md:p-5",
      "bg-card",
      "border border-border",
      "shadow-sm",
      "transition-all duration-300",
      "hover:shadow-md hover:border-primary/20",
      className
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs text-muted-foreground">
          {label}
        </span>
        {icon && (
          <div className="text-muted-foreground group-hover:text-primary transition-colors duration-300">
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className={cn(
        "text-xl md:text-2xl font-semibold tracking-tight leading-none",
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
        <span className="text-[10px] text-muted-foreground mt-1 block">
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
