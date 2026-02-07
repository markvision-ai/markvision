import { cn } from '@/lib/utils';
import { TrendingUp, Percent, BadgeRussianRuble } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

interface Props {
  customerCost: number | null;
  visitCost: number | null;
  leadCost: number | null;
  romi: number | null;
  profitability: number | null;
  roas: number | null;
}

const formatCurrency = (value: number | null) => {
  if (value === null || isNaN(value)) return '—';
  const rounded = Math.round(value);
  return new Intl.NumberFormat('ru-RU').format(rounded) + ' ₸';
};

const formatPercent = (value: number | null) => {
  if (value === null || isNaN(value)) return '—';
  return value.toFixed(1).replace('.0', '') + '%';
};

const formatRatio = (value: number | null) => {
  if (value === null || isNaN(value)) return '—';
  return value.toFixed(2).replace(/\.00$/, '') + 'x';
};

export const ComputedMetricsWidget = ({
  customerCost,
  visitCost,
  leadCost,
  romi,
  profitability,
  roas,
}: Props) => {
  const items = [
    { label: 'CPL', value: formatCurrency(leadCost), icon: BadgeRussianRuble },
    { label: 'CPV', value: formatCurrency(visitCost), icon: BadgeRussianRuble },
    { label: 'CPA', value: formatCurrency(customerCost), icon: BadgeRussianRuble },
    { label: 'ROMI', value: formatRatio(romi), icon: TrendingUp },
    { label: 'Маржинальность', value: formatPercent(profitability), icon: Percent },
    { label: 'ROAS', value: formatRatio(roas), icon: TrendingUp },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map(({ label, value, icon: Icon }) => (
        <GlassCard
          key={label}
          stripe={
            label === 'Маржинальность'
              ? 'cyan'
              : label === 'ROMI' || label === 'ROAS'
              ? 'blue'
              : 'emerald'
          }
          className="group rounded-xl p-4 transition-all duration-200"
          aria-label={label}
          tabIndex={0}
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                {label}
              </p>
              <p className="text-xl font-semibold text-foreground tracking-tight leading-none">
                {value}
              </p>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
};
