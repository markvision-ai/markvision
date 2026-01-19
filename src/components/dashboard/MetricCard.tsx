import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: { value: number; isPositive: boolean };
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'primary';
  className?: string;
}

export const MetricCard = ({ 
  label, 
  value, 
  subValue,
  trend,
  icon,
  variant = 'default',
  className
}: MetricCardProps) => {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-[20px] p-4 md:p-6 transition-all duration-400",
      "bg-card hover:shadow-card-hover hover:-translate-y-0.5",
      "group",
      className
    )}>
      {/* Glow border on hover */}
      <div className="absolute inset-0 rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary) / 0.2) 0%, transparent 50%, hsl(var(--primary) / 0.2) 100%)',
          padding: '1px',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
        }}
      />
      
      <div className="flex items-start justify-between mb-3 md:mb-4 gap-2">
        <p className="text-xs md:text-sm text-muted-foreground font-medium truncate">{label}</p>
        {icon && (
          <div className="flex-shrink-0 p-2 md:p-2.5 rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
      
      {/* Large value - prominent typography */}
      <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground tracking-tight truncate">{value}</p>
      
      <div className="flex items-center justify-between mt-2 md:mt-3 gap-2">
        {subValue && (
          <p className="text-[10px] md:text-xs text-muted-foreground/60 truncate flex-1">{subValue}</p>
        )}
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium flex-shrink-0 px-2 py-0.5 rounded-full",
            trend.isPositive ? 'text-success bg-success/10' : 'text-destructive bg-destructive/10'
          )}>
            {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
          </div>
        )}
      </div>
    </div>
  );
};
