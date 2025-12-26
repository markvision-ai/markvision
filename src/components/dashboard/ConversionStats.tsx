import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';

interface ConversionStep {
  label: string;
  value: number;
  color: string;
}

interface ConversionStatsProps {
  steps: ConversionStep[];
}

export const ConversionStats = ({ steps }: ConversionStatsProps) => {
  const conversions = steps.slice(0, -1).map((step, index) => {
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

  return (
    <div className="bg-card border rounded-xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm sm:text-lg truncate">Конверсии воронки</h3>
          <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Переходы между этапами</p>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {conversions.map((conv, index) => {
          const isGoodRate = conv.rate > 10;
          
          return (
            <div 
              key={index}
              className="relative bg-secondary/50 rounded-lg sm:rounded-xl p-3 sm:p-4 overflow-hidden"
            >
              {/* Background gradient */}
              <div 
                className="absolute inset-0 opacity-10"
                style={{
                  background: `linear-gradient(90deg, ${conv.fromColor} 0%, ${conv.toColor} 100%)`,
                }}
              />
              
              <div className="relative flex items-center justify-between gap-2">
                {/* From */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                    <div 
                      className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: conv.fromColor }}
                    />
                    <span className="text-xs sm:text-sm text-muted-foreground truncate">{conv.from}</span>
                  </div>
                  <p className="text-sm sm:text-lg font-bold">
                    {new Intl.NumberFormat('ru-RU', { notation: 'compact' }).format(conv.fromValue)}
                  </p>
                </div>

                {/* Arrow with conversion rate */}
                <div className="flex flex-col items-center px-1.5 sm:px-4 flex-shrink-0">
                  <div className={`flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-sm font-semibold ${
                    isGoodRate 
                      ? 'bg-success/20 text-success' 
                      : 'bg-warning/20 text-warning'
                  }`}>
                    {isGoodRate ? (
                      <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    ) : (
                      <TrendingDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    )}
                    {conv.rate.toFixed(0)}%
                  </div>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground mt-0.5 sm:mt-1" />
                </div>

                {/* To */}
                <div className="flex-1 text-right min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 justify-end mb-0.5 sm:mb-1">
                    <span className="text-xs sm:text-sm text-muted-foreground truncate">{conv.to}</span>
                    <div 
                      className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: conv.toColor }}
                    />
                  </div>
                  <p className="text-sm sm:text-lg font-bold">
                    {new Intl.NumberFormat('ru-RU', { notation: 'compact' }).format(conv.toValue)}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min(conv.rate, 100)}%`,
                    background: `linear-gradient(90deg, ${conv.fromColor}, ${conv.toColor})`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall conversion */}
      {steps.length >= 2 && (
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-border">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs sm:text-sm text-muted-foreground truncate">
              <span className="hidden sm:inline">Общая конверсия ({steps[0].label} → {steps[steps.length - 1].label})</span>
              <span className="sm:hidden">Общая</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm sm:text-lg font-bold text-primary">
                {steps[0].value > 0 
                  ? ((steps[steps.length - 1].value / steps[0].value) * 100).toFixed(2)
                  : 0
                }%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
