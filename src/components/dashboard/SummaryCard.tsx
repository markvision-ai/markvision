import React from 'react';
import { cn } from "@/lib/utils";
import { GlassCard } from '@/components/ui/GlassCard';

interface SummaryCardProps {
  title: string;
  icon: React.ElementType;
  value: React.ReactNode;
  subtitle: string;
  className?: string;
  variant?: 'blue' | 'purple' | 'emerald' | 'orange' | 'pink' | 'cyan';
}

export const SummaryCard = React.memo(({
  title,
  icon: Icon,
  value,
  subtitle,
  className,
  variant = 'blue'
}: SummaryCardProps) => {

  const iconColors = {
    blue: 'text-blue-400 group-hover:text-blue-300',
    purple: 'text-purple-400 group-hover:text-purple-300',
    emerald: 'text-emerald-400 group-hover:text-emerald-300',
    orange: 'text-orange-400 group-hover:text-orange-300',
    pink: 'text-pink-400 group-hover:text-pink-300',
    cyan: 'text-cyan-400 group-hover:text-cyan-300',
  };

  const glowColors = {
    blue: 'bg-blue-500/20',
    purple: 'bg-purple-500/20',
    emerald: 'bg-emerald-500/20',
    orange: 'bg-orange-500/20',
    pink: 'bg-pink-500/20',
    cyan: 'bg-cyan-500/20',
  };

  return (
    <div className={cn(
      "relative group overflow-hidden rounded-xl bg-gradient-to-br from-white/[0.08] to-transparent border border-white/10 p-4 transition-all duration-300 hover:bg-white/[0.12] hover:border-white/30 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:-translate-y-1 cursor-pointer",
      className
    )}>
      {/* Dynamic Glow */}
      <div className={cn(
        "absolute -right-4 -top-4 w-12 h-12 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
        glowColors[variant]
      )} />

      <div className="flex items-start justify-between gap-2 mb-3 relative z-10">
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider leading-tight">
          {title}
        </div>
        <div className={cn(
          "h-7 w-7 rounded-lg bg-white/5 flex items-center justify-center transition-all duration-300 shadow-sm border border-white/5 group-hover:scale-110",
          iconColors[variant]
        )}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>

      <div className="space-y-1 relative z-10">
        <div className="text-xl md:text-2xl font-bold tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/80 font-mono">
          {value}
        </div>
        <div className="text-[10px] font-medium text-white/40 leading-tight">
          {subtitle}
        </div>
      </div>
    </div>
  );
});

SummaryCard.displayName = "SummaryCard";
