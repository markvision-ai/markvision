import { DollarSign, Users, Target, TrendingUp, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AdsSummaryCardsProps {
  totalSpent: number;
  totalLeads: number;
  avgCpl: number;
  romi: number;
}

const GlassMetricCard = ({
  label,
  value,
  format = 'number',
  icon: Icon,
  trend,
  gradient
}: {
  label: string;
  value: number;
  format?: 'number' | 'currency' | 'percent';
  icon: any;
  trend?: string;
  gradient: string;
}) => {
  const formatValue = (val: number) => {
    if (format === 'currency') return `${Math.round(val).toLocaleString('ru-RU')} ₸`;
    if (format === 'percent') return `${val > 0 ? '+' : ''}${val.toFixed(1)}%`;
    return val.toLocaleString('ru-RU');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="relative group overflow-hidden rounded-[2rem] p-6 bg-white/70 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 transition-all duration-300"
    >
      <div className={cn(
        "absolute -right-10 -top-10 w-40 h-40 blur-[50px] opacity-10 group-hover:opacity-30 transition-opacity duration-500 rounded-full",
        gradient === 'red' && "bg-red-500",
        gradient === 'blue' && "bg-blue-500",
        gradient === 'purple' && "bg-purple-500",
        gradient === 'emerald' && "bg-emerald-500"
      )} />

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className={cn(
            "p-3.5 rounded-2xl border shadow-sm backdrop-blur-md",
            gradient === 'red' && "bg-red-50/50 border-red-100 text-red-500",
            gradient === 'blue' && "bg-blue-50/50 border-blue-100 text-blue-500",
            gradient === 'purple' && "bg-purple-50/50 border-purple-100 text-purple-600",
            gradient === 'emerald' && "bg-emerald-50/50 border-emerald-100 text-emerald-500"
          )}>
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-black uppercase tracking-widest">
              <ArrowUpRight className="w-3 h-3" />
              {trend}
            </div>
          )}
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-2">
            {label}
          </p>
          <h3 className="text-3xl font-black tracking-tighter text-slate-800 transition-colors duration-300">
            {formatValue(value)}
          </h3>
        </div>
      </div>
    </motion.div>
  );
};

export const AdsSummaryCards = ({
  totalSpent,
  totalLeads,
  avgCpl,
  romi
}: AdsSummaryCardsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <GlassMetricCard
        label="Общие расходы"
        value={totalSpent}
        format="currency"
        gradient="red"
        icon={DollarSign}
        trend="+12%"
      />
      <GlassMetricCard
        label="Всего лидов"
        value={totalLeads}
        format="number"
        gradient="blue"
        icon={Users}
        trend="+5.4k"
      />
      <GlassMetricCard
        label="Средний CPL"
        value={avgCpl}
        format="currency"
        gradient="purple"
        icon={Target}
        trend="-8%"
      />
      <GlassMetricCard
        label="Общий ROMI"
        value={romi}
        format="percent"
        gradient="emerald"
        icon={TrendingUp}
        trend="+142%"
      />
    </div>
  );
};
