import { cn } from "@/lib/utils";
import React from "react";

type Stripe = "none" | "blue" | "cyan" | "emerald" | "gold";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  stripe?: Stripe;
  className?: string;
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({ stripe = "none", className, children, ...rest }) => {
  const stripeClass =
    stripe === "blue"
      ? "stripe stripe-blue"
      : stripe === "cyan"
      ? "stripe stripe-cyan"
      : stripe === "emerald"
      ? "stripe stripe-emerald"
      : stripe === "gold"
      ? "stripe stripe-gold"
      : "";

  return (
    <div {...rest} className={cn("glass-card border border-border rounded-xl p-4", stripeClass, className)}>
      {children}
    </div>
  );
}
