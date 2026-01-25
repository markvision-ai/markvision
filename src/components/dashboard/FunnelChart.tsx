interface FunnelStep {
  label: string;
  value: number;
  color: string;
}

interface FunnelChartProps {
  steps: FunnelStep[];
}

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('ru-RU').format(value);
};

export const FunnelChart = ({ steps }: FunnelChartProps) => {
  const maxValue = Math.max(...steps.map(s => s.value));

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <h3 className="font-semibold text-foreground mb-6">Воронка продаж</h3>
      
      <div className="space-y-4">
        {steps.map((step, index) => {
          const width = (step.value / maxValue) * 100;
          const conversionFromPrev = index > 0 
            ? ((step.value / steps[index - 1].value) * 100).toFixed(1)
            : null;
          
          return (
            <div key={step.label} className="relative">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-base font-semibold text-foreground/90 dark:text-foreground/95">{step.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-foreground">{formatNumber(step.value)}</span>
                  {conversionFromPrev && (
                    <span className="text-sm font-semibold text-foreground/80 dark:text-foreground/90 bg-muted/50 px-2 py-0.5 rounded-full">
                      {conversionFromPrev}%
                    </span>
                  )}
                </div>
              </div>
              <div className="h-10 bg-muted/30 rounded-lg overflow-hidden">
                <div 
                  className="h-full rounded-lg transition-all duration-1000 ease-out flex items-center justify-end pr-3"
                  style={{ 
                    width: `${width}%`, 
                    backgroundColor: step.color,
                    boxShadow: `0 0 20px ${step.color}40`
                  }}
                >
                  {width > 20 && (
                    <span className="text-xs font-medium text-white">{width.toFixed(0)}%</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
