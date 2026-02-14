
import { cn } from '@/lib/utils';
import { HeroMetricCard } from './HeroMetricCard';
import { DollarSign, Wallet, TrendingUp } from 'lucide-react';

interface PremiumHeroProps {
    userName: string | null;
    keyMetrics: {
        revenue: number;
        expenses: number;
        romi: number | null;
    };
    className?: string;
}

export const PremiumHero = ({
    userName,
    keyMetrics,
    className
}: PremiumHeroProps) => {
    const displayName = userName || 'Пользователь';

    return (
        <div className={cn("space-y-6", className)}>
            {/* Hero Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <HeroMetricCard
                    label="Выручка"
                    value={keyMetrics.revenue}
                    format="currency"
                    gradient="emerald-cyan"
                    icon={<DollarSign className="w-6 h-6" />}
                    subValue="За текущий период"
                />
                <HeroMetricCard
                    label="Расходы"
                    value={keyMetrics.expenses}
                    format="currency"
                    gradient="blue-purple"
                    icon={<Wallet className="w-6 h-6" />}
                    subValue="Затраты на рекламу"
                />
                <HeroMetricCard
                    label="ROMI"
                    value={keyMetrics.romi || -100}
                    format="percent"
                    gradient="red-orange"
                    icon={<TrendingUp className="w-6 h-6" />}
                    subValue="Окупаемость"
                />
            </div>
        </div>
    );
};

export default PremiumHero;
