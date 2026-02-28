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
  const getHint = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('выруч') || l.includes('доход')) return 'Доход за выбранный период';
    if (l.includes('расход') || l.includes('spend')) return 'Затраты на рекламу/маркетинг';
    if (l.includes('лид')) return 'Количество целевых обращений';
    if (l.includes('romi')) return 'Рентабельность маркетинга';
    if (l.includes('cpl')) return 'Стоимость привлечённого лида';
    if (l.includes('cac')) return 'Стоимость привлечённого клиента';
    if (l.includes('aov') || l.includes('ср чек')) return 'Средний чек';
    return 'Ключевой показатель';
  };
  return (
    <div className="bg-white/70 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 border border-white/50 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-xs sm:text-sm text-foreground">Сравнение с прошлой неделей</h3>
          <p className="text-xs font-medium text-foreground/70  mt-0.5 leading-relaxed">Динамика ключевых показателей</p>
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
              className="relative bg-white/70 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 rounded-lg p-3 overflow-hidden border border-white/50 transition-all duration-200 hover:border-primary/30 hover:shadow-sm group"
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
                <p className="text-xs font-semibold text-foreground/80  truncate leading-relaxed">{stat.label}</p>
                
                <p className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                  {formatValue(stat.current, stat.format)}
                </p>
                
                <div className="flex items-center justify-between gap-1.5">
                  <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                    isPositive 
                      ? 'bg-blue-500/10 text-blue-500' 
                      : isNeutral 
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-red-500/10 text-red-500'
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
                  <div className="text-[9px] text-muted-foreground/50 truncate" title={getHint(stat.label)}>
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
