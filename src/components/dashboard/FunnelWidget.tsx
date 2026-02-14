import { useMemo } from 'react';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';

import { GlassCard } from '@/components/ui/GlassCard';

interface FunnelStep {
  label: string;
  value: number;
  color: string;
}

interface FunnelWidgetProps {
  steps: FunnelStep[];
}

export const FunnelWidget = ({ steps }: FunnelWidgetProps) => {
  const conversions = useMemo(() => {
    return steps.slice(0, -1).map((step, index) => {
      const nextStep = steps[index + 1];
      const rate = step.value > 0 ? (nextStep.value / step.value) * 100 : 0;
      return {
        from: step.label,
        to: nextStep.label,
        fromValue: step.value,
        toValue: nextStep.value,
        rate,
        fromColor: step.color,
        toColor: nextStep.color,
      };
    });
  }, [steps]);

  const overallConversionRate = useMemo(() => {
    return steps[0]?.value > 0
      ? ((steps[steps.length - 1]?.value / steps[0]?.value) * 100)
      : 0;
  }, [steps]);

  const maxValue = steps[0]?.value || 1;
  const formatNumber = (n: number) => new Intl.NumberFormat('ru-RU').format(Math.round(n));

  return (
    <GlassCard className="stripe-blue">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm md:text-base text-foreground">Воронка конверсии</h3>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 rounded-lg">
          <span className="text-xs font-semibold text-primary">CR общий {overallConversionRate.toFixed(1)}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Stages with larger type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {steps.map((s, i) => {
            const stageRate = i > 0 && steps[i - 1].value > 0 ? (s.value / steps[i - 1].value) * 100 : null;
            return (
              <GlassCard key={i} className="p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs md:text-sm font-medium text-foreground">{s.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${stageRate !== null && stageRate >= 10 ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'}`}>
                    {stageRate !== null ? `${stageRate.toFixed(1)}%` : '—'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-muted-foreground/15 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${Math.min((s.value / maxValue) * 100, 100)}%`,
                        backgroundColor: s.color
                      }}
                    />
                  </div>
                  <div className="text-lg md:text-xl font-semibold text-foreground font-mono">
                    {formatNumber(s.value)}
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>

        {/* Conversion pairs with clearer layout */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-semibold text-muted-foreground">Переходы</h4>
          {conversions.map((c, idx) => {
            const good = c.rate >= 10;
            return (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{c.from}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{c.to}</span>
                </div>
                <div className={`px-2 py-0.5 rounded-full text-xs font-semibold ${good ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'}`}>
                  {c.rate.toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
};
