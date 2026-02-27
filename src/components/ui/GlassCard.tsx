import { cn } from "@/lib/utils";
import React from "react";

type Stripe = "none" | "blue" | "cyan" | "emerald" | "gold";
type Variant = "default" | "interstellar" | "interstellar-elevated"; // Kept for compatibility but mapped to clean styles

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  stripe?: Stripe;
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  stripe = "none",
  variant = "default",
  className,
  children,
  ...rest
}) => {
  // Map legacy stripes to Tailwind border colors
  const stripeClass =
    stripe === "blue"
      ? "border-l-4 border-l-blue-500"
      : stripe === "cyan"
        ? "border-l-4 border-l-cyan-500"
        : stripe === "emerald"
          ? "border-l-4 border-l-emerald-500"
          : stripe === "gold"
            ? "border-l-4 border-l-amber-500"
            : "";

  return (
    <div
      {...rest}
      className={cn(
        "rounded-xl bg-card border border-border shadow-sm", // Solid matte card
        stripeClass,
        className
      )}
    >
      {children}
    </div>
  );
};
