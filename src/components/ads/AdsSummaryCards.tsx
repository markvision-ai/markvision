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
    if (format === 'currency') return `${val.toLocaleString()} ₸`;
    if (format === 'percent') return `${val > 0 ? '+' : ''}${val}%`;
    return val.toLocaleString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="relative group overflow-hidden rounded-[2rem] p-6 bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-2xl transition-all duration-500"
    >
      {/* Dynamic Background Glow */}
      <div className={cn(
        "absolute -right-10 -top-10 w-32 h-32 blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity duration-700 rounded-full",
        gradient === 'red' && "bg-red-500",
        gradient === 'blue' && "bg-blue-500",
        gradient === 'purple' && "bg-purple-500",
        gradient === 'emerald' && "bg-emerald-500"
      )} />

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className={cn(
            "p-3 rounded-2xl border border-white/10 shadow-inner",
            gradient === 'red' && "bg-red-500/10 text-red-400",
            gradient === 'blue' && "bg-blue-500/10 text-blue-400",
            gradient === 'purple' && "bg-purple-500/10 text-purple-400",
            gradient === 'emerald' && "bg-emerald-500/10 text-emerald-400"
          )}>
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest">
              <ArrowUpRight className="w-3 h-3" />
              {trend}
            </div>
          )}
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">
            {label}
          </p>
          <h3 className="text-3xl font-black tracking-tight text-white group-hover:text-primary transition-colors duration-300">
            {formatValue(value)}
          </h3>
        </div>
      </div>

      {/* Bottom Border Accent */}
      <div className={cn(
        "absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-700 bg-gradient-to-r",
        gradient === 'red' && "from-red-500 to-orange-500",
        gradient === 'blue' && "from-blue-500 to-cyan-500",
        gradient === 'purple' && "from-purple-500 to-pink-500",
        gradient === 'emerald' && "from-emerald-500 to-teal-500"
      )} />
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
        label="Total Ad Spend"
        value={totalSpent}
        format="currency"
        gradient="red"
        icon={DollarSign}
        trend="+12%"
      />
      <GlassMetricCard
        label="Total Leads"
        value={totalLeads}
        format="number"
        gradient="blue"
        icon={Users}
        trend="+5.4k"
      />
      <GlassMetricCard
        label="Average CPL"
        value={avgCpl}
        format="currency"
        gradient="purple"
        icon={Target}
        trend="-8%"
      />
      <GlassMetricCard
        label="Overall ROMI"
        value={romi}
        format="percent"
        gradient="emerald"
        icon={TrendingUp}
        trend="+142%"
      />
    </div>
  );
};
