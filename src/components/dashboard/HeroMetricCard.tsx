import { memo } from 'react';

import { cn } from '@/lib/utils';

interface HeroMetricCardProps {
    label: string;
    value: number;
    format?: 'currency' | 'number' | 'percent';
    gradient: 'emerald-cyan' | 'blue-purple' | 'red-orange' | 'purple-pink';
    icon: React.ReactNode;
    subValue?: string;
    className?: string;
}

export const HeroMetricCard = memo(({
    label,
    value,
    format = 'number',
    icon,
    subValue,
    className
}: HeroMetricCardProps) => {
    const formatValue = () => {
        if (format === 'currency') {
            if (value >= 1000000) {
                return (value / 1000000).toFixed(1).replace('.0', '') + ' млн ₸';
            }
            return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
        } else if (format === 'percent') {
            return `${value >= 0 ? '+' : ''}${value.toFixed(0)}%`;
        } else {
            return new Intl.NumberFormat('ru-RU').format(Math.round(value));
        }
    };

    return (
        <div className={cn("relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md", className)}>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        {label}
                    </span>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        {icon}
                    </div>
                </div>

                <div className="space-y-1">
                    <div className="text-3xl font-bold text-foreground tracking-tight">
                        {formatValue()}
                    </div>
                    {subValue && (
                        <p className="text-sm text-muted-foreground">
                            {subValue}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
});

HeroMetricCard.displayName = 'HeroMetricCard';
