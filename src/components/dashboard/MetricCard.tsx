import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: { value: number; isPositive: boolean };
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'primary';
  className?: string;
}

// Format large numbers to compact form
const formatCompact = (value: string): string => {
  // Extract numeric part and currency
  const numMatch = value.match(/^([\d\s]+)/);
  if (!numMatch) return value;
  
  const numStr = numMatch[1].replace(/\s/g, '');
  const num = parseInt(numStr, 10);
  
  if (isNaN(num)) return value;
  
  const suffix = value.replace(numStr, '').replace(/^\s+/, '');
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace('.0', '') + ' млн' + (suffix ? ' ' + suffix : '');
  }
  if (num >= 100000) {
    return (num / 1000).toFixed(0) + ' тыс' + (suffix ? ' ' + suffix : '');
  }
  
  return value;
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
  const displayValue = formatCompact(value);
  
  return (
    <div className={cn(
      "premium-card p-5 md:p-6 group",
      className
    )}>
      <div className="flex items-start justify-between mb-4 gap-2">
        <p className="text-xs md:text-sm text-muted-foreground font-medium">{label}</p>
        {icon && (
          <div className="flex-shrink-0 p-2 md:p-2.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
            {icon}
          </div>
        )}
      </div>
      
      {/* Large value - prominent typography with proper spacing */}
      <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-none">
        {displayValue}
      </p>
      
      <div className="flex items-center justify-between mt-3 gap-2">
        {subValue && (
          <p className="text-[10px] md:text-xs text-muted-foreground/50">{subValue}</p>
        )}
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium flex-shrink-0 px-2 py-0.5 rounded-full",
            trend.isPositive ? 'text-success bg-success/10' : 'text-destructive bg-destructive/10'
          )}>
            {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
          </div>
        )}
      </div>
    </div>
  );
};
