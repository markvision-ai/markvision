import { DollarSign, Users, Target, TrendingUp } from 'lucide-react';
import { HeroMetricCard } from '@/components/dashboard/HeroMetricCard';

interface AdsSummaryCardsProps {
  totalSpent: number;
  totalLeads: number;
  avgCpl: number;
  romi: number;
}

export const AdsSummaryCards = ({
  totalSpent,
  totalLeads,
  avgCpl,
  romi
}: AdsSummaryCardsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <HeroMetricCard
        label="Общий расход"
        value={totalSpent}
        format="currency"
        gradient="red-orange"
        icon={<DollarSign className="w-5 h-5" />}
      />
      <HeroMetricCard
        label="Лиды все"
        value={totalLeads}
        format="number"
        gradient="blue-purple"
        icon={<Users className="w-5 h-5" />}
      />
      <HeroMetricCard
        label="Стоимость лида"
        value={avgCpl}
        format="currency"
        gradient="purple-pink"
        icon={<Target className="w-5 h-5" />}
      />
      <HeroMetricCard
        label="ROMI общий"
        value={romi}
        format="percent"
        gradient="emerald-cyan"
        icon={<TrendingUp className="w-5 h-5" />}
      />
    </div>
  );
};
