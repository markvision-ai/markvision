import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatItem {
  label: string;
  current: number;
  previous: number;
  format: 'currency' | 'number' | 'percent';
}

const formatValue = (value: number, format: string): string => {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('ru-RU', {
        style: 'decimal',
        maximumFractionDigits: 0,
      }).format(value) + ' ₸';
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
      <h3 className="font-semibold mb-4">Сравнение с прошлым периодом</h3>
      
      <div className="space-y-4">
        {stats.map((stat) => {
          const change = stat.previous > 0 
            ? ((stat.current - stat.previous) / stat.previous) * 100 
            : 0;
          const isPositive = change >= 0;
          
          return (
            <div key={stat.label} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="font-semibold">{formatValue(stat.current, stat.format)}</p>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded ${
                isPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
              }`}>
                {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                <span className="text-sm font-medium">{Math.abs(change).toFixed(1)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
