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
    "rounded-xl border border-border bg-card p-3 transition-all duration-200",
    className
  )}>
    <div className="flex items-center justify-between gap-2 mb-1.5">
      <div className="text-xs font-medium text-muted-foreground leading-tight">
        {title}
      </div>
      <div className="h-6 w-6 rounded-lg bg-muted flex items-center justify-center text-primary flex-shrink-0">
        <Icon className="w-3 h-3" />
      </div>
    </div>
    <div className="text-xl font-semibold tracking-tight text-foreground mb-1 font-mono">
      {value}
    </div>
    <div className="text-[10px] text-muted-foreground leading-tight">
      {subtitle}
    </div>
  </div>
));
