import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PlanFactCardProps {
  label: string;
  value: string | number;
  plan?: number;
  fact?: number;
  icon?: ReactNode;
  format?: 'number' | 'currency' | 'percent';
}

const formatValue = (value: number, format: 'number' | 'currency' | 'percent'): string => {
  if (format === 'currency') {
    return new Intl.NumberFormat('ru-RU').format(value) + ' ₸';
  }
  if (format === 'percent') {
    return value.toFixed(1) + '%';
  }
  return new Intl.NumberFormat('ru-RU').format(value);
};

export const PlanFactCard = ({ 
  label, 
  value, 
  plan, 
  fact, 
  icon,
  format = 'number' 
}: PlanFactCardProps) => {
  const percentage = plan && fact ? (fact / plan) * 100 : 0;
  const isOnTrack = percentage >= 100;
  const progressColor = percentage >= 100 
    ? 'bg-success' 
    : percentage >= 75 
      ? 'bg-warning' 
      : 'bg-destructive';

  return (
    <div className="bg-card border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        {icon}
      </div>
      
      <div className="text-2xl font-bold mb-2">{value}</div>
      
      {plan !== undefined && fact !== undefined && (
        <>
          <div className="h-2 bg-secondary rounded-full overflow-hidden mb-2">
            <div 
              className={`h-full ${progressColor} transition-all duration-500`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              План: {formatValue(plan, format)}
            </span>
            <div className={`flex items-center gap-1 ${isOnTrack ? 'text-success' : 'text-destructive'}`}>
              {isOnTrack ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{percentage.toFixed(0)}%</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
