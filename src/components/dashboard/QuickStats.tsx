import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface StatItem {
  label: string;
  current: number;
  previous: number;
  format: 'currency' | 'number' | 'percent';
}

const formatValue = (value: number, format: string): string => {
  switch (format) {
    case 'currency':
      const rounded = Math.round(value);
      if (rounded >= 1000000) return (rounded / 1000000).toFixed(1) + ' млн ₸';
      return new Intl.NumberFormat('ru-RU').format(rounded) + ' ₸';
    case 'percent':
      return Math.round(value) + '%';
    default:
      if (value >= 1000000) return (value / 1000000).toFixed(1) + ' млн';
      return new Intl.NumberFormat('ru-RU').format(Math.round(value));
  }
};

interface QuickStatsProps {
  stats: StatItem[];
}

export const QuickStats = ({ stats }: QuickStatsProps) => {
  return (
    <div className="bg-card border border-border rounded-xl p-5 md:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-sm sm:text-base text-foreground">Сравнение с прошлой неделей</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Динамика ключевых показателей</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat) => {
          const change = stat.previous > 0 
            ? ((stat.current - stat.previous) / stat.previous) * 100 
            : 0;
          const isPositive = change > 0;
          const isNeutral = Math.abs(change) < 0.5;
          
          return (
            <div 
              key={stat.label} 
              className="relative bg-secondary rounded-xl p-4 overflow-hidden border border-border transition-all duration-300 hover:border-primary/20 group"
            >
              {/* Accent bar */}
              <div 
                className={`absolute top-0 left-0 right-0 h-1 transition-all duration-300 ${
                  isPositive 
                    ? 'bg-success group-hover:shadow-[0_0_10px_hsl(var(--success)/0.5)]' 
                    : isNeutral 
                      ? 'bg-muted-foreground/30' 
                      : 'bg-destructive group-hover:shadow-[0_0_10px_hsl(var(--destructive)/0.5)]'
                }`}
              />
              
              <div className="space-y-2.5">
                <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                
                <p className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                  {formatValue(stat.current, stat.format)}
                </p>
                
                <div className="flex items-center justify-between gap-2">
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isPositive 
                      ? 'bg-success/10 text-success' 
                      : isNeutral 
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-destructive/10 text-destructive'
                  }`}>
                    {isPositive ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : isNeutral ? (
                      <Minus className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {Math.abs(Math.round(change))}%
                  </div>

                  {/* Previous value */}
                  <div className="hidden sm:block text-[10px] text-muted-foreground/50">
                    {formatValue(stat.previous, stat.format)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
