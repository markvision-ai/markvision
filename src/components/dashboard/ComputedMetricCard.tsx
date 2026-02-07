import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ComputedMetricCardProps {
  label: string;
  value: number | null;
  icon: ReactNode;
  format: 'currency' | 'percent' | 'multiplier';
  subtitle?: string;
  className?: string;
}

const formatValue = (value: number | null, format: 'currency' | 'percent' | 'multiplier'): string => {
  if (value === null || isNaN(value) || !isFinite(value)) return '—';

  switch (format) {
    case 'currency':
      if (value >= 1000000) {
        return (value / 1000000).toFixed(1).replace('.0', '') + ' млн ₸';
      }
      return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
    case 'percent':
      if (value < 1) {
        return value.toFixed(2) + '%';
      }
      return value.toFixed(1) + '%';
    case 'multiplier':
      return value.toFixed(2) + 'x';
    default:
      return String(value);
  }
};

const getSubtitle = (format: 'currency' | 'percent' | 'multiplier', subtitle?: string): string => {
  if (subtitle) return subtitle;
  switch (format) {
    case 'currency':
      return 'Расходы / показатель';
    case 'percent':
      return 'Коэффициент конверсии';
    case 'multiplier':
      return 'Возврат инвестиций';
    default:
      return '';
  }
};

export const ComputedMetricCard = ({
  label,
  value,
  icon,
  format,
  subtitle,
  className
}: ComputedMetricCardProps) => {
  const displayValue = formatValue(value, format);
  const hasValue = value !== null && !isNaN(value) && isFinite(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "group relative overflow-hidden rounded-xl p-3",
        "bg-card",
        "border border-border/40",
        "hover:border-primary/30 hover:bg-card",
        "hover:shadow-lg hover:shadow-primary/5",
        "transition-all duration-200",
        className
      )}
    >
      <div className="space-y-1.5">
        {/* Header: Icon + Label */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground/80 leading-tight truncate">
            {label}
          </span>
          <div className="h-6 w-6 rounded-lg bg-primary/5 dark:bg-primary/10 flex items-center justify-center text-muted-foreground/70 flex-shrink-0 group-hover:bg-primary/10 group-hover:text-primary/70 transition-colors">
            <div className="w-3 h-3">
              {icon}
            </div>
          </div>
        </div>

        {/* Main Value */}
        <div className="space-y-0.5">
          <p className={cn(
            "text-xl font-semibold tracking-tight leading-none",
            hasValue ? "text-foreground" : "text-muted-foreground/50"
          )}>
            {format === 'percent' && hasValue ? (
              <>
                {displayValue.replace('%', '')}
                <span className="text-muted-foreground/60">%</span>
              </>
            ) : format === 'multiplier' && hasValue ? (
              <>
                {displayValue.replace('x', '')}
                <span className="text-muted-foreground/60">x</span>
              </>
            ) : (
              displayValue
            )}
          </p>

          {/* Subtitle */}
          <p className="text-[10px] text-muted-foreground/50 leading-tight">
            {hasValue ? getSubtitle(format, subtitle) : 'Нет данных'}
          </p>
        </div>
      </div>

      {/* Hover accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/0 to-transparent group-hover:via-primary/30 transition-all duration-300" />
    </motion.div>
  );
};

export default ComputedMetricCard;
