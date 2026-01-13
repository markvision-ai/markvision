import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { cn } from '@/lib/utils';

interface AnimatedMetricCardProps {
  label: string;
  value: number;
  previousValue: number;
  format: 'currency' | 'number' | 'percent';
  icon: React.ReactNode;
  color: string;
  isConnected?: boolean;
  isPulsing?: boolean;
  index?: number;
}

export const AnimatedMetricCard = ({
  label,
  value,
  previousValue,
  format,
  icon,
  color,
  isConnected = false,
  isPulsing = false,
  index = 0,
}: AnimatedMetricCardProps) => {
  const animatedValue = useAnimatedCounter(value, { duration: 1500, easing: 'easeOut' });
  const change = value - previousValue;
  const isPositive = change >= 0;

  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('ru-RU').format(Math.round(val)) + ' ₸';
      case 'percent':
        return val.toFixed(1) + '%';
      default:
        return new Intl.NumberFormat('ru-RU').format(Math.round(val));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className={cn(
        "relative overflow-hidden transition-all duration-300",
        isPulsing && 'ring-2 ring-primary'
      )}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className={color}>{icon}</div>
            {change !== 0 && previousValue !== 0 && (
              <Badge variant={isPositive ? 'default' : 'destructive'} className="text-xs">
                {isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                {Math.abs(change).toFixed(0)}
              </Badge>
            )}
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold tabular-nums">
              {formatValue(animatedValue)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{label}</p>
          </div>
          {isConnected && (
            <div className="absolute top-2 right-2">
              <Zap className="h-3 w-3 text-yellow-500" />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
