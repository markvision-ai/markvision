import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <div className="bg-[#020617]/40 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-6 shadow-interstellar">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-primary rounded-full" />
          <div>
            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Сравнение Фаз</h3>
            <p className="text-xs font-medium text-white/30 uppercase tracking-[0.1em] mt-0.5">Динамика ключевых векторов</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => {
          const change = stat.previous > 0
            ? ((stat.current - stat.previous) / stat.previous) * 100
            : 0;
          const isPositive = change > 0;
          const isNeutral = Math.abs(change) < 0.5;

          return (
            <div
              key={stat.label}
              className="relative bg-white/5 backdrop-blur-xl border border-white/5 rounded-[1.5rem] p-5 overflow-hidden transition-all duration-500 hover:bg-white/10 hover:border-white/10 group"
            >
              {/* Trend Glow */}
              <div className={cn(
                "absolute -right-4 -top-4 w-12 h-12 rounded-full blur-2xl opacity-20 transition-opacity group-hover:opacity-40",
                isPositive ? "bg-primary" : isNeutral ? "bg-white" : "bg-red-500"
              )} />

              <div className="relative z-10 space-y-3">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{stat.label}</p>

                <p className="text-xl font-black text-white tracking-tight">
                  {formatValue(stat.current, stat.format)}
                </p>

                <div className="flex items-center justify-between pt-1">
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest",
                    isPositive
                      ? "bg-primary/20 text-primary shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                      : isNeutral
                        ? "bg-white/10 text-white/40"
                        : "bg-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                  )}>
                    {isPositive ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : isNeutral ? (
                      <Minus className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {Math.abs(Math.round(change))}%
                  </div>

                  <div className="text-[10px] font-bold text-white/10 group-hover:text-white/20 transition-colors" title={getHint(stat.label)}>
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
