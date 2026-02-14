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

  return (
    <GlassCard className={cn(
      "relative group overflow-hidden p-4 transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer",
      className
    )}>
      {/* Dynamic Glow - Subtle for light mode */}
      <div className={cn(
        "absolute -right-4 -top-4 w-12 h-12 rounded-full blur-xl opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none",
        "bg-primary"
      )} />

      <div className="flex items-start justify-between gap-2 mb-3 relative z-10">
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider leading-tight">
          {title}
        </div>
        <div className={cn(
          "h-7 w-7 rounded-lg bg-primary/5 flex items-center justify-center transition-all duration-300 shadow-sm border border-primary/10 group-hover:scale-110",
          "text-primary"
        )}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>

      <div className="space-y-1 relative z-10">
        <div className="text-xl md:text-2xl font-bold tracking-tight text-foreground font-mono">
          {value}
        </div>
        <div className="text-[10px] font-medium text-muted-foreground leading-tight">
          {subtitle}
        </div>
      </div>
    </GlassCard>
  );
});

SummaryCard.displayName = "SummaryCard";
