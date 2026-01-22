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

// ИСПРАВЛЕНО: Полные числа БЕЗ сокращений (К)
const formatCompact = (value: string | number): string => {
  if (typeof value === 'string') {
    if (value.includes('млн')) return value;
    const numMatch = value.match(/^([\d\s]+)/);
    if (numMatch) {
      const numStr = numMatch[1].replace(/\s/g, '');
      const num = parseInt(numStr, 10);
      if (!isNaN(num)) {
        const suffix = value.slice(numMatch[0].length).trim();
        // Только "млн" для миллионов
        if (num >= 1000000) {
          return (num / 1000000).toFixed(1).replace('.0', '') + ' млн' + (suffix ? ' ' + suffix : '');
        }
        return new Intl.NumberFormat('ru-RU').format(num) + (suffix ? ' ' + suffix : '');
      }
    }
    return value;
  }
  
  // Только "млн" для миллионов
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
          
          {/* Trend Indicator */}
          {previousValue !== undefined && numericValue !== previousValue && (
            <TrendIndicator currentValue={numericValue} previousValue={previousValue} />
          )}
        </div>

        {/* Main Value & Sparkline */}
        <div className="flex items-end justify-between gap-3">
          <div className="space-y-1 flex-1 min-w-0">
            <p className={cn(
              "text-2xl md:text-3xl font-bold whitespace-nowrap",
              "text-foreground"
            )}>
              {formattedValue}
            </p>
            {subValue && (
              <p className="text-xs text-muted-foreground whitespace-nowrap">
                {subValue}
              </p>
            )}
          </div>

          {/* Sparkline */}
          {sparklineData && sparklineData.length > 1 && (
            <div className="flex-shrink-0">
              <Sparkline 
                data={sparklineData} 
                width={60} 
                height={24} 
                color="hsl(var(--primary))" 
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
