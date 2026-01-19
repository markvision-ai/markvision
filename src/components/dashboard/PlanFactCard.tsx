import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PlanFactCardProps {
  label: string;
  value: string | number;
  plan?: number;
  fact?: number;
  icon?: ReactNode;
  format?: 'number' | 'currency' | 'percent';
  className?: string;
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
  format = 'number',
  className
}: PlanFactCardProps) => {
  const percentage = plan && fact ? (fact / plan) * 100 : 0;
  const isOnTrack = percentage >= 100;

  return (
    <div className={cn(
      "relative overflow-hidden rounded-[20px] p-4 md:p-6 transition-all duration-400",
      "bg-card hover:shadow-card-hover hover:-translate-y-0.5",
      "group min-w-0",
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

      <div className="flex items-center justify-between mb-3 gap-2">
        <span className="text-xs md:text-sm text-muted-foreground font-medium truncate">{label}</span>
        {icon && (
          <div className="flex-shrink-0 p-2 md:p-2.5 rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
      
      {/* Large value - prominent typography */}
      <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground tracking-tight mb-3 truncate">{value}</div>
      
      {plan !== undefined && fact !== undefined && (
        <>
          {/* Progress bar - subtle */}
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-2">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-700",
                isOnTrack ? "bg-success" : "bg-primary"
              )}
              style={{ 
                width: `${Math.min(percentage, 100)}%`,
                boxShadow: isOnTrack ? '0 0 8px hsl(var(--success) / 0.5)' : '0 0 8px hsl(var(--primary) / 0.5)'
              }}
            />
          </div>
          
          {/* Plan text - muted and smaller */}
          <p className="text-[10px] md:text-xs text-muted-foreground/50 truncate">
            План: {formatValue(plan, format)} • {percentage.toFixed(0)}%
          </p>
        </>
      )}
    </div>
  );
};
