import { useMemo } from 'react';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';

export interface FunnelStep {
  label: string;
  value: number;
  color: string;
}

export interface FunnelStandaloneProps {
  steps: FunnelStep[];
  onStageClick?: (stageIndex: number, stage: FunnelStep) => void;
}

export const FunnelStandalone = ({ steps, onStageClick }: FunnelStandaloneProps) => {
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
    return steps[0]?.value > 0 ? ((steps[steps.length - 1]?.value / steps[0]?.value) * 100) : 0;
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
        <div className="p-2">
          <div className="w-full" role="img" aria-label="Пирамида конверсии">
            <svg width="100%" height={steps.length * 52} viewBox={`0 0 100 ${steps.length * 10}`} preserveAspectRatio="none">
              {steps.map((s, i) => {
                const topWidth = Math.max(10, ((steps[i].value / maxValue) * 90));
                const bottomWidth = i === 0 ? topWidth : Math.max(10, ((steps[i - 1].value / maxValue) * 90));
                const y = i * 10;
                const xTop = (100 - topWidth) / 2;
                const xBottom = (100 - bottomWidth) / 2;
                const color = s.color;
                return (
                  <g key={i} onClick={() => onStageClick?.(i, s)} style={{ cursor: 'pointer' }}>
                    <polygon
                      points={`${xTop},${y} ${xTop + topWidth},${y} ${xBottom + bottomWidth},${y + 10} ${xBottom},${y + 10}`}
                      fill={color}
                      opacity={0.25}
                      stroke={color}
                      strokeWidth={0.6}
                    />
                    <text x={xTop + 2} y={y + 6} fontSize="3" fill="currentColor">
                      {s.label}: {formatNumber(s.value)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

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
}
