import React from 'react';
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  title: string;
  icon: React.ElementType;
  value: React.ReactNode;
  subtitle: string;
  className?: string;
}

export const SummaryCard = React.memo(({ 
  title, 
  icon: Icon, 
  value, 
  subtitle,
  className
}: SummaryCardProps) => (
  <div className={cn(
    "rounded-xl border border-[#1F2937] bg-[#111827] p-3 transition-all duration-200",
    className
  )}>
    <div className="flex items-center justify-between gap-2 mb-1.5">
      <div className="text-xs font-medium text-slate-400 leading-tight">
        {title}
      </div>
      <div className="h-6 w-6 rounded-lg bg-[#161B22] backdrop-blur-sm flex items-center justify-center text-[#00D1FF] flex-shrink-0">
        <Icon className="w-3 h-3" />
      </div>
    </div>
    <div className="text-xl font-semibold tracking-tight text-foreground mb-1 font-mono">
      {value}
    </div>
    <div className="text-[10px] text-slate-500 leading-tight">
      {subtitle}
    </div>
  </div>
));
