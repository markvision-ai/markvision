import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TrendIndicator } from './TrendIndicator';
import { Sparkline } from './Sparkline';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: { value: number; isPositive: boolean };
  previousValue?: number;
  sparklineData?: number[];
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'primary';
  className?: string;
}

const formatCompact = (value: string | number): string => {
  if (typeof value === 'string') {
    if (value.includes('млн')) return value;
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
  previousValue,
  sparklineData,
  icon,
  variant = 'default',
  className
}: MetricCardProps) => {
  const formattedValue = formatCompact(value);
  const numericValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.-]/g, '')) || 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "group relative overflow-hidden rounded-xl p-4",
        "bg-card/50 backdrop-blur-sm",
        "border border-border/40",
        "hover:border-border/60 hover:bg-card/60",
        "transition-all duration-200",
        className
      )}
    >
      <div className="space-y-2.5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon && (
              <div className="text-muted-foreground/70 w-4 h-4">
                {icon}
              </div>
            )}
            <span className="text-xs font-semibold text-foreground/80 dark:text-foreground/90 uppercase tracking-wide">
              {label}
            </span>
          </div>
          
          {previousValue !== undefined && numericValue !== previousValue && (
            <TrendIndicator currentValue={numericValue} previousValue={previousValue} />
          )}
        </div>

        {/* Main Content */}
        <div className="flex items-end justify-between gap-3">
          <div className="space-y-0.5 flex-1 min-w-0">
            <p className="text-2xl font-semibold text-foreground tracking-tight leading-none">
              {formattedValue}
            </p>
            {subValue && (
              <p className="text-xs text-foreground/70 dark:text-foreground/80 font-semibold leading-relaxed">
                {subValue}
              </p>
            )}
          </div>

          {sparklineData && sparklineData.length > 1 && (
            <div className="flex-shrink-0">
              <Sparkline 
                data={sparklineData} 
                width={50} 
                height={20} 
                color="hsl(var(--primary))" 
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
