import { memo } from 'react';

import { cn } from '@/lib/utils';
import { TrendIndicator } from './TrendIndicator';
import { Sparkline } from './Sparkline';
import { GlassCard } from '@/components/ui/GlassCard';

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

export const MetricCard = memo(({
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
    <div
      className={cn("group relative animate-in fade-in slide-in-from-bottom-2 duration-500", className)}
    >
      <GlassCard
        stripe={variant === 'primary' ? 'marsala' : 'none'}
        className="p-5 sm:p-6"
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="text-[#955251] w-5 h-5 transition-transform group-hover:scale-110 group-hover:rotate-3 duration-500">
                  {icon}
                </div>
              )}
              <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                {label}
              </span>
            </div>

            {previousValue !== undefined && numericValue !== previousValue && (
              <TrendIndicator currentValue={numericValue} previousValue={previousValue} />
            )}
          </div>

          {/* Main Content */}
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-1 flex-1 min-w-0">
              <p className="text-3xl sm:text-4xl font-black text-white tracking-tighter leading-none transition-transform duration-500 origin-left group-hover:scale-[1.02]">
                {formattedValue}
              </p>
              {subValue && (
                <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em]">
                  {subValue}
                </p>
              )}
            </div>

            {sparklineData && sparklineData.length > 1 && (
              <div className="flex-shrink-0 pb-1">
                <Sparkline
                  data={sparklineData}
                  width={60}
                  height={24}
                  color="#955251"
                />
              </div>
            )}
          </div>
        </div>

        {/* Decorative Glow for primary variant */}
        {variant === 'primary' && (
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-[#955251] rounded-full blur-3xl opacity-5 transition-opacity group-hover:opacity-15" />
        )}
      </GlassCard>
    </div>
  );
});
