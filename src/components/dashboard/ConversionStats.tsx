import { useMemo } from 'react';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface ConversionStep {
  label: string;
  value: number;
  color: string;
}

interface ConversionStatsProps {
  steps: ConversionStep[];
}

export const ConversionStats = ({ steps }: ConversionStatsProps) => {
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

  // Исправленный расчет общей конверсии
  const overallConversionRate = useMemo(() => {
    return steps[0]?.value > 0 
      ? ((steps[steps.length - 1]?.value / steps[0]?.value) * 100)
      : 0;
  }, [steps]);

  return (
    <div className="group bg-card/80 backdrop-blur-xl border border-border/50 hover:border-primary/30 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-lg hover:shadow-primary/10 transition-all duration-500">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-secondary/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-sm sm:text-lg text-foreground truncate">
              Конверсии воронки
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Переходы между этапами</p>
          </div>
        </div>

        <div className="space-y-4">
          {conversions.map((conv, index) => {
            const isGoodRate = conv.rate > 10;
            
            return (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="relative bg-muted/30 rounded-xl p-4 overflow-hidden border border-border/30"
              >
                {/* Background gradient */}
                <div 
                  className="absolute inset-0 opacity-10"
                  style={{
                    background: `linear-gradient(90deg, ${conv.fromColor} 0%, ${conv.toColor} 100%)`,
                  }}
                />
                
                <div className="relative flex items-center justify-between gap-3">
                  {/* From */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0 shadow-lg"
                        style={{ 
                          backgroundColor: conv.fromColor,
                          boxShadow: `0 0 12px ${conv.fromColor}80`
                        }}
                      />
                      <span className="text-xs sm:text-sm text-muted-foreground truncate">{conv.from}</span>
                    </div>
                    <p className="text-base sm:text-xl font-bold text-foreground">
                      {new Intl.NumberFormat('ru-RU').format(conv.fromValue)}
                    </p>
                  </div>

                  {/* Arrow with conversion rate */}
                  <div className="flex flex-col items-center px-2 sm:px-4 flex-shrink-0">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-lg ${
                      isGoodRate 
                        ? 'bg-success/20 text-success border border-success/30 shadow-success/30' 
                        : 'bg-warning/20 text-warning border border-warning/30'
                    }`}>
                      {isGoodRate ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                      )}
                      {conv.rate.toFixed(1)}%
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground mt-1" />
                  </div>

                  {/* To */}
                  <div className="flex-1 text-right min-w-0">
                    <div className="flex items-center gap-2 justify-end mb-1">
                      <span className="text-xs sm:text-sm text-muted-foreground truncate">{conv.to}</span>
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0 shadow-lg"
                        style={{ 
                          backgroundColor: conv.toColor,
                          boxShadow: `0 0 12px ${conv.toColor}80`
                        }}
                      />
                    </div>
                    <p className="text-base sm:text-xl font-bold text-foreground">
                      {new Intl.NumberFormat('ru-RU').format(conv.toValue)}
                    </p>
                  </div>
                </div>

                {/* Progress bar - ШИРЕ и с СВЕЧЕНИЕМ */}
                <div className="relative mt-4 h-3 bg-muted/50 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(conv.rate, 100)}%` }}
                    transition={{ duration: 1, delay: index * 0.2, ease: "easeOut" }}
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ 
                      background: `linear-gradient(90deg, ${conv.fromColor}, ${conv.toColor})`,
                      boxShadow: isGoodRate ? `0 0 16px ${conv.toColor}80` : 'none'
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Overall conversion */}
        {steps.length >= 2 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 pt-4 border-t border-border/30"
          >
            <div className="flex items-center justify-between gap-3 bg-muted/20 rounded-xl p-4">
              <div className="text-sm text-muted-foreground truncate">
                <span className="hidden sm:inline">Общая конверсия ({steps[0]?.label} → {steps[steps.length - 1]?.label})</span>
                <span className="sm:hidden">Общая конверсия</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-lg sm:text-2xl font-bold text-primary shadow-lg">
                  {overallConversionRate.toFixed(2)}%
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
