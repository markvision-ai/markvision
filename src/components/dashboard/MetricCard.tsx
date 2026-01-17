import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: { value: number; isPositive: boolean };
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'primary';
}

export const MetricCard = ({ 
  label, 
  value, 
  subValue,
  trend,
  icon,
  variant = 'default' 
}: MetricCardProps) => {
  const variantStyles = {
    default: 'border-border',
    success: 'border-success/30 bg-success/5',
    warning: 'border-warning/30 bg-warning/5',
    danger: 'border-destructive/30 bg-destructive/5',
    primary: 'border-primary/30 bg-primary/5',
  };

  const valueStyles = {
    default: 'text-foreground',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-destructive',
    primary: 'text-primary',
  };

  return (
    <div className={`bg-card border rounded-xl p-3 md:p-5 transition-all hover:shadow-md min-w-0 ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between mb-2 md:mb-3 gap-2">
        <p className="text-xs md:text-sm text-muted-foreground truncate">{label}</p>
        {icon && (
          <div className={`flex-shrink-0 p-1.5 md:p-2 rounded-lg ${variant === 'default' ? 'bg-secondary' : variantStyles[variant]}`}>
            {icon}
          </div>
        )}
      </div>
      
      <p className={`text-lg md:text-2xl font-bold truncate ${valueStyles[variant]}`}>{value}</p>
      
      <div className="flex items-center justify-between mt-1 md:mt-2 gap-2">
        {subValue && <p className="text-[10px] md:text-xs text-muted-foreground truncate flex-1">{subValue}</p>}
        {trend && (
          <div className={`flex items-center gap-1 text-xs flex-shrink-0 ${trend.isPositive ? 'text-success' : 'text-destructive'}`}>
            {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
          </div>
        )}
      </div>
    </div>
  );
};
