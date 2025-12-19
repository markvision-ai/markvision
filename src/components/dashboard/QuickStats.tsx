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
      if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M ₸';
      if (value >= 1000) return (value / 1000).toFixed(0) + 'K ₸';
      return new Intl.NumberFormat('ru-RU').format(value) + ' ₸';
    case 'percent':
      return value.toFixed(1) + '%';
    default:
      return new Intl.NumberFormat('ru-RU').format(value);
  }
};

interface QuickStatsProps {
  stats: StatItem[];
}

export const QuickStats = ({ stats }: QuickStatsProps) => {
  return (
    <div className="bg-card border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-lg">Сравнение с прошлым периодом</h3>
          <p className="text-sm text-muted-foreground">Динамика ключевых показателей</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const change = stat.previous > 0 
            ? ((stat.current - stat.previous) / stat.previous) * 100 
            : 0;
          const isPositive = change > 0;
          const isNeutral = change === 0;
          
          return (
            <div 
              key={stat.label} 
              className="relative bg-secondary/50 rounded-xl p-4 overflow-hidden group hover:bg-secondary/70 transition-colors"
            >
              {/* Accent bar */}
              <div 
                className={`absolute top-0 left-0 right-0 h-1 ${
                  isPositive ? 'bg-success' : isNeutral ? 'bg-muted' : 'bg-destructive'
                }`}
              />
              
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                
                <div className="flex items-end justify-between gap-2">
                  <p className="text-2xl font-bold tracking-tight">
                    {formatValue(stat.current, stat.format)}
                  </p>
                  
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                    isPositive 
                      ? 'bg-success/15 text-success' 
                      : isNeutral 
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-destructive/15 text-destructive'
                  }`}>
                    {isPositive ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : isNeutral ? (
                      <Minus className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                    {Math.abs(change).toFixed(1)}%
                  </div>
                </div>

                {/* Previous value */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Было:</span>
                  <span className="font-medium">{formatValue(stat.previous, stat.format)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
