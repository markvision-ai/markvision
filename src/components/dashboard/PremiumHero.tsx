import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { HeroMetricCard } from './HeroMetricCard';
import { DollarSign, Users, TrendingUp } from 'lucide-react';

interface PremiumHeroProps {
    userName: string | null;
    keyMetrics: {
        revenue: number;
        leads: number;
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
            {/* Welcome Text */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-1"
            >
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                    MarkVision Online
                </h2>
                <p className="text-white/60 text-base md:text-lg">
                    Добро пожаловать, {displayName}
                </p>
            </motion.div>

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
                    label="Лиды"
                    value={keyMetrics.leads}
                    format="number"
                    gradient="blue-purple"
                    icon={<Users className="w-6 h-6" />}
                    subValue="Новые заявки"
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
