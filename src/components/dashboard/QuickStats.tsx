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
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-xs sm:text-sm text-foreground">Сравнение с прошлой неделей</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">Динамика ключевых показателей</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {stats.map((stat) => {
          const change = stat.previous > 0 
            ? ((stat.current - stat.previous) / stat.previous) * 100 
            : 0;
          const isPositive = change > 0;
          const isNeutral = Math.abs(change) < 0.5;
          
          return (
            <div 
              key={stat.label} 
              className="relative bg-secondary rounded-lg p-3 overflow-hidden border border-border transition-all duration-200 hover:border-primary/30 hover:shadow-sm group"
            >
              {/* Accent bar */}
              <div 
                className={`absolute top-0 left-0 right-0 h-0.5 transition-all duration-200 ${
                  isPositive 
                    ? 'bg-success' 
                    : isNeutral 
                      ? 'bg-muted-foreground/30' 
                      : 'bg-destructive'
                }`}
              />
              
              <div className="space-y-1.5">
                <p className="text-[10px] text-muted-foreground font-medium truncate">{stat.label}</p>
                
                <p className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                  {formatValue(stat.current, stat.format)}
                </p>
                
                <div className="flex items-center justify-between gap-1.5">
                  <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                    isPositive 
                      ? 'bg-success/10 text-success' 
                      : isNeutral 
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-destructive/10 text-destructive'
                  }`}>
                    {isPositive ? (
                      <ArrowUpRight className="w-2.5 h-2.5" />
                    ) : isNeutral ? (
                      <Minus className="w-2.5 h-2.5" />
                    ) : (
                      <ArrowDownRight className="w-2.5 h-2.5" />
                    )}
                    {Math.abs(Math.round(change))}%
                  </div>

                  {/* Previous value */}
                  <div className="text-[9px] text-muted-foreground/50 truncate">
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
