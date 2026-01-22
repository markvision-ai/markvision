import { DollarSign, Users, Target, TrendingUp } from 'lucide-react';

interface AdsSummaryCardsProps {
  totalSpent: number;
  totalLeads: number;
  avgCPA: number;
  overallROAS: number;
}

export const AdsSummaryCards = ({ 
  totalSpent, 
  totalLeads, 
  avgCPA, 
  overallROAS 
}: AdsSummaryCardsProps) => {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)} млн ₸`;
    return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
  };

  const cards = [
    {
      title: 'Total Spent',
      value: formatCurrency(totalSpent),
      icon: DollarSign,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/20',
    },
    {
      title: 'Total Leads',
      value: totalLeads.toString(),
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
    {
      title: 'Avg. CPA',
      value: formatCurrency(avgCPA),
      icon: Target,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
    },
    {
      title: 'Overall ROAS',
      value: overallROAS.toFixed(2) + 'x',
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="relative overflow-hidden rounded-xl bg-card border border-border p-3 sm:p-4 shadow-sm hover:shadow-md hover:border-primary/20 transition-all"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">{card.title}</p>
              <p className={`text-base sm:text-xl font-bold ${card.color} truncate`}>{card.value}</p>
            </div>
            <div className={`p-1.5 sm:p-2 rounded-lg ${card.bgColor} flex-shrink-0`}>
              <card.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${card.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
