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
      whileHover={{ y: -5, scale: 1.01 }}
      className="relative group overflow-hidden rounded-[2.5rem] p-6 bg-card/40 backdrop-blur-xl border border-white/10 shadow-interstellar transition-all duration-500"
    >
      <div className={cn(
        "absolute -right-10 -top-10 w-48 h-48 blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity duration-700 rounded-full",
        gradient === 'red' && "bg-[#f97316]",
        gradient === 'blue' && "bg-[#3b82f6]",
        gradient === 'purple' && "bg-[#8b5cf6]",
        gradient === 'emerald' && "bg-[#10b981]"
      )} />

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className={cn(
            "p-3.5 rounded-2xl border shadow-sm backdrop-blur-md transition-all duration-500",
            gradient === 'red' && "bg-[#f97316]/10 border-[#f97316]/20 text-[#f97316]",
            gradient === 'blue' && "bg-[#3b82f6]/10 border-[#3b82f6]/20 text-[#3b82f6]",
            gradient === 'purple' && "bg-[#8b5cf6]/10 border-[#8b5cf6]/20 text-[#8b5cf6]",
            gradient === 'emerald' && "bg-[#10b981]/10 border-[#10b981]/20 text-[#10b981]"
          )}>
            <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </div>
          {trend && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-white/70 border border-white/10 text-[10px] font-black uppercase tracking-widest group-hover:bg-white/10 transition-colors">
              <ArrowUpRight className="w-3 h-3 text-secondary" />
              {trend}
            </div>
          )}
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-2 flex items-center gap-2">
            {label}
          </p>
          <h3 className="text-3xl font-black tracking-tighter text-white/90 group-hover:text-white transition-colors duration-300">
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
