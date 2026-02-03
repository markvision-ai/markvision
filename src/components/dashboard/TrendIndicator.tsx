import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendIndicatorProps {
  currentValue: number;
  previousValue: number;
  format?: 'number' | 'currency' | 'percent';
  className?: string;
}

export const TrendIndicator = ({ 
  currentValue, 
  previousValue,
  format = 'number',
  className 
}: TrendIndicatorProps) => {
  if (!previousValue || previousValue === 0) return null;

  const change = currentValue - previousValue;
  const percentChange = (change / previousValue) * 100;
  const isPositive = change >= 0;

  if (Math.abs(percentChange) < 0.1) return null; // Не показываем очень маленькие изменения

  return (
    <div className={cn(
      "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium",
      isPositive 
        ? "bg-success/10 text-success " 
        : "bg-destructive/10 text-destructive ",
      className
    )}>
      {isPositive ? (
        <ArrowUp className="w-3 h-3" />
      ) : (
        <ArrowDown className="w-3 h-3" />
      )}
      <span className="whitespace-nowrap">
        {Math.abs(percentChange).toFixed(0)}%
      </span>
    </div>
  );
};
