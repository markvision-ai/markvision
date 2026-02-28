import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface PlanFactCardProps {
  label: string;
  value: number;
  plan?: number;
  fact?: number;
  icon?: ReactNode;
  format?: 'number' | 'currency' | 'percent';
  className?: string;
}

const formatValue = (value: number, format: 'number' | 'currency' | 'percent'): string => {
  if (format === 'currency') {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1).replace('.0', '') + ' млн ₸';
    }
    return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
  }
  if (format === 'percent') {
    return Math.round(value) + '%';
  }
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1).replace('.0', '') + ' млн';
  }
  return new Intl.NumberFormat('ru-RU').format(Math.round(value));
};

const formatPlanValue = (value: number, format: 'number' | 'currency' | 'percent'): string => {
  if (format === 'currency') {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1).replace('.0', '') + ' млн';
    }
    return new Intl.NumberFormat('ru-RU').format(Math.round(value));
  }
  return formatValue(value, format);
};

export const PlanFactCard = ({
  label,
  value,
  plan,
  fact,
  icon,
  format = 'number',
  className
}: PlanFactCardProps) => {
  const percentage = plan && plan > 0 && fact !== undefined ? (fact / plan) * 100 : 0;
  const isOnTrack = percentage >= 100;

  const accentColor =
    label.toLowerCase().includes('показ') ? 'blue' :
      label.toLowerCase().includes('лид') ? 'cyan' :
        label.toLowerCase().includes('визит') || label.toLowerCase().includes('диагност') ? 'emerald' :
          label.toLowerCase().includes('продаж') ? 'gold' :
            'primary';

  const colorMap = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20 glow-blue',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20 glow-cyan',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 glow-emerald',
    gold: 'text-amber-400 bg-amber-500/10 border-amber-500/20 glow-amber',
    primary: 'text-primary bg-primary/10 border-primary/20 glow-primary'
  };

  const barColorMap = {
    blue: 'bg-blue-500',
    cyan: 'bg-cyan-500',
    emerald: 'bg-emerald-500',
    gold: 'bg-amber-500',
    primary: 'bg-primary'
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[2rem] bg-[#020617]/40 backdrop-blur-3xl border border-white/5 p-6 shadow-interstellar transition-all duration-500 hover:bg-[#020617]/60 hover:border-white/10",
        className
      )}
    >
      {/* Decorative Glow */}
      <div className={cn(
        "absolute -right-8 -top-8 w-24 h-24 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-30",
        barColorMap[accentColor as keyof typeof barColorMap]
      )} />

      <div className="relative z-10 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
              colorMap[accentColor as keyof typeof colorMap]
            )}>
              {icon}
            </div>
            <div>
              <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] block">
                {label}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={cn("w-1 h-3 rounded-full animate-pulse", barColorMap[accentColor as keyof typeof barColorMap])} />
                <span className="text-white text-[10px] font-black uppercase tracking-widest opacity-40">System Live</span>
              </div>
            </div>
          </div>

          {plan !== undefined && (
            <div className={cn(
              "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-white/5 transition-all",
              isOnTrack ? "bg-primary/20 text-primary shadow-[0_0_15px_rgba(249,115,22,0.1)]" : "bg-white/5 text-white/20"
            )}>
              {percentage.toFixed(0)}%
            </div>
          )}
        </div>

        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter transition-transform duration-500 origin-left group-hover:scale-[1.02]">
            {formatValue(value, format)}
          </h2>
          {plan !== undefined && plan > 0 && (
            <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em] mt-1">
              Target: {formatPlanValue(plan, format)}
            </p>
          )}
        </div>

        {plan !== undefined && plan > 0 && fact !== undefined && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[9px] font-black tracking-widest uppercase">
              <span className="text-white/10 group-hover:text-white/30 transition-colors">Phase Progress</span>
              <span className="text-white/40">{percentage.toFixed(1)}% Complete</span>
            </div>
            <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(percentage, 100)}%` }}
                transition={{ duration: 1.5, ease: "circOut" }}
                className={cn(
                  "h-full rounded-full relative overflow-hidden",
                  barColorMap[accentColor as keyof typeof barColorMap]
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
