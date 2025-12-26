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
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + ' ₸';
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`relative overflow-hidden rounded-xl border ${card.borderColor} ${card.bgColor} p-4 md:p-5 transition-all hover:scale-[1.02]`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs md:text-sm text-muted-foreground mb-1">{card.title}</p>
              <p className={`text-xl md:text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
          </div>
          {/* Decorative glow effect */}
          <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full ${card.bgColor} blur-2xl opacity-50`} />
        </div>
      ))}
    </div>
  );
};
