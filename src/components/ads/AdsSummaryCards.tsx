import { DollarSign, Users, Target, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

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
      title: 'Расходы',
      subtitle: 'За выбранный период',
      value: formatCurrency(totalSpent),
      icon: DollarSign,
      gradient: 'from-rose-500/20 via-rose-500/10 to-transparent',
      iconBg: 'bg-rose-500/15',
      iconColor: 'text-rose-500',
      valueColor: 'text-rose-500',
    },
    {
      title: 'Лиды',
      subtitle: 'Всего заявок',
      value: totalLeads.toString(),
      icon: Users,
      gradient: 'from-blue-500/20 via-blue-500/10 to-transparent',
      iconBg: 'bg-blue-500/15',
      iconColor: 'text-blue-500',
      valueColor: 'text-blue-500',
    },
    {
      title: 'CPL',
      subtitle: 'Стоимость лида',
      value: formatCurrency(avgCPA),
      icon: Target,
      gradient: 'from-amber-500/20 via-amber-500/10 to-transparent',
      iconBg: 'bg-amber-500/15',
      iconColor: 'text-amber-500',
      valueColor: 'text-amber-500',
    },
    {
      title: 'ROAS',
      subtitle: 'Окупаемость',
      value: overallROAS.toFixed(2) + 'x',
      icon: TrendingUp,
      gradient: 'from-emerald-500/20 via-emerald-500/10 to-transparent',
      iconBg: 'bg-emerald-500/15',
      iconColor: 'text-emerald-500',
      valueColor: 'text-emerald-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className="group relative overflow-hidden rounded-xl bg-card/50 backdrop-blur-sm border border-border/40 hover:border-border/60 transition-all duration-200"
        >
          {/* Gradient overlay */}
          <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-50 group-hover:opacity-70 transition-opacity`} />

          <div className="relative p-3 sm:p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-[10px] sm:text-xs font-medium text-foreground/80">{card.title}</p>
                <p className={`text-lg sm:text-2xl font-bold ${card.valueColor} tracking-tight`}>
                  {card.value}
                </p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground/70 truncate">
                  {card.subtitle}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${card.iconBg} flex-shrink-0`}>
                <card.icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
            </div>
          </div>

          {/* Hover glow effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent ${card.valueColor.replace('text-', 'via-')}/50 to-transparent`} />
          </div>
        </motion.div>
      ))}
    </div>
  );
};
