import { useMemo } from 'react';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

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

  return (
    <div className="group bg-card/80 backdrop-blur-xl border border-border/50 hover:border-primary/30 rounded-xl p-4 shadow-sm hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-foreground">
            Конверсии воронки
          </h3>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 rounded-lg">
            <span className="text-xs font-bold text-primary">
              {overallConversionRate.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="space-y-2.5">
          {conversions.map((conv, index) => {
            const isGoodRate = conv.rate > 10;
            
            return (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="relative bg-muted/20 rounded-lg p-2.5 overflow-hidden border border-border/20"
              >
                <div className="relative flex items-center justify-between gap-2">
                  {/* From */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <div 
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: conv.fromColor }}
                      />
                      <span className="text-[10px] text-muted-foreground truncate">{conv.from}</span>
                    </div>
                    <p className="text-sm font-bold text-foreground">
                      {new Intl.NumberFormat('ru-RU').format(conv.fromValue)}
                    </p>
                  </div>

                  {/* Arrow with conversion rate */}
                  <div className="flex flex-col items-center px-1.5 flex-shrink-0">
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      isGoodRate 
                        ? 'bg-success/20 text-success' 
                        : 'bg-warning/20 text-warning'
                    }`}>
                      {isGoodRate ? (
                        <TrendingUp className="w-2.5 h-2.5" />
                      ) : (
                        <TrendingDown className="w-2.5 h-2.5" />
                      )}
                      {conv.rate.toFixed(1)}%
                    </div>
                    <ArrowRight className="w-3 h-3 text-muted-foreground mt-0.5" />
                  </div>

                  {/* To */}
                  <div className="flex-1 text-right min-w-0">
                    <div className="flex items-center gap-1.5 justify-end mb-0.5">
                      <span className="text-[10px] text-muted-foreground truncate">{conv.to}</span>
                      <div 
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: conv.toColor }}
                      />
                    </div>
                    <p className="text-sm font-bold text-foreground">
                      {new Intl.NumberFormat('ru-RU').format(conv.toValue)}
                    </p>
                  </div>
                </div>

                {/* Compact progress bar */}
                <div className="relative mt-2 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(conv.rate, 100)}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ 
                      background: `linear-gradient(90deg, ${conv.fromColor}, ${conv.toColor})`,
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};