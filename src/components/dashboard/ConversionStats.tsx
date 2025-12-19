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
    <div className="bg-card border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-lg">Конверсии воронки</h3>
          <p className="text-sm text-muted-foreground">Переходы между этапами</p>
        </div>
      </div>

      <div className="space-y-4">
        {conversions.map((conv, index) => {
          const isGoodRate = conv.rate > 10; // Consider >10% as good
          
          return (
            <div 
              key={index}
              className="relative bg-secondary/50 rounded-xl p-4 overflow-hidden"
            >
              {/* Background gradient */}
              <div 
                className="absolute inset-0 opacity-10"
                style={{
                  background: `linear-gradient(90deg, ${conv.fromColor} 0%, ${conv.toColor} 100%)`,
                }}
              />
              
              <div className="relative flex items-center justify-between">
                {/* From */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div 
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: conv.fromColor }}
                    />
                    <span className="text-sm text-muted-foreground">{conv.from}</span>
                  </div>
                  <p className="text-lg font-bold">
                    {new Intl.NumberFormat('ru-RU').format(conv.fromValue)}
                  </p>
                </div>

                {/* Arrow with conversion rate */}
                <div className="flex flex-col items-center px-4">
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
                    isGoodRate 
                      ? 'bg-success/20 text-success' 
                      : 'bg-warning/20 text-warning'
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
                <div className="flex-1 text-right">
                  <div className="flex items-center gap-2 justify-end mb-1">
                    <span className="text-sm text-muted-foreground">{conv.to}</span>
                    <div 
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: conv.toColor }}
                    />
                  </div>
                  <p className="text-lg font-bold">
                    {new Intl.NumberFormat('ru-RU').format(conv.toValue)}
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
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Общая конверсия ({steps[0].label} → {steps[steps.length - 1].label})
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary">
                {steps[0].value > 0 
                  ? ((steps[steps.length - 1].value / steps[0].value) * 100).toFixed(3)
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
