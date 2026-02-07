import { cn } from "@/lib/utils";
import React from "react";

type Stripe = "none" | "blue" | "cyan" | "emerald" | "gold";
type Variant = "default" | "interstellar" | "interstellar-elevated";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  stripe?: Stripe;
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}

const variantStyles: Record<Variant, string> = {
  default: "interstellar-card",
  interstellar: "interstellar-card",
  "interstellar-elevated": "interstellar-card-elevated",
};

export const GlassCard: React.FC<GlassCardProps> = ({
  stripe = "none",
  variant = "default",
  className,
  children,
  ...rest
}) => {
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
    <div
      {...rest}
      className={cn(
        "rounded-xl p-4",
        variantStyles[variant],
        stripeClass,
        className
      )}
    >
      {children}
    </div>
  );
};
