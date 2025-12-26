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
      // Округляем без копеек
      const rounded = Math.round(value);
      if (rounded >= 1000000) return (rounded / 1000000).toFixed(1) + 'M ₸';
      if (rounded >= 1000) return Math.round(rounded / 1000) + 'K ₸';
      return new Intl.NumberFormat('ru-RU').format(rounded) + ' ₸';
    case 'percent':
      return Math.round(value) + '%';
    default:
      return new Intl.NumberFormat('ru-RU').format(Math.round(value));
  }
};

interface QuickStatsProps {
  stats: StatItem[];
}

export const QuickStats = ({ stats }: QuickStatsProps) => {
  return (
    <div className="bg-card border rounded-xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h3 className="font-semibold text-sm sm:text-lg">Сравнение с прошлой неделей</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">Динамика ключевых показателей</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => {
          const change = stat.previous > 0 
            ? ((stat.current - stat.previous) / stat.previous) * 100 
            : 0;
          const isPositive = change > 0;
          const isNeutral = Math.abs(change) < 0.5;
          
          return (
            <div 
              key={stat.label} 
              className="relative bg-gradient-to-br from-secondary/80 to-secondary/40 rounded-xl p-3 sm:p-4 overflow-hidden group hover:shadow-lg transition-all duration-300"
            >
              {/* Accent bar */}
              <div 
                className={`absolute top-0 left-0 right-0 h-1 sm:h-1.5 ${
                  isPositive ? 'bg-gradient-to-r from-success to-success/60' : isNeutral ? 'bg-muted' : 'bg-gradient-to-r from-destructive to-destructive/60'
                }`}
              />
              
              <div className="space-y-2 sm:space-y-3">
                <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">{stat.label}</p>
                
                <p className="text-lg sm:text-2xl font-bold tracking-tight truncate">
                  {formatValue(stat.current, stat.format)}
                </p>
                
                <div className="flex items-center justify-between gap-1 sm:gap-2 flex-wrap">
                  <div className={`flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold ${
                    isPositive 
                      ? 'bg-success/20 text-success' 
                      : isNeutral 
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-destructive/20 text-destructive'
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

                  {/* Previous value - hidden on very small screens */}
                  <div className="hidden sm:block text-[10px] sm:text-xs text-muted-foreground truncate">
                    <span>Было: </span>
                    <span className="font-semibold">{formatValue(stat.previous, stat.format)}</span>
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
