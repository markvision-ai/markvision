import { cn } from "@/lib/utils";
import React from "react";

type Stripe = "none" | "blue" | "cyan" | "emerald" | "gold" | "marsala";
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
            : stripe === "marsala"
              ? "border-l-4 border-l-[#955251] shadow-[0_0_15px_rgba(149,82,81,0.2)]"
              : "";

  return (
    <div
      {...rest}
      className={cn(
        "rounded-[2rem] bg-[#020617]/40 backdrop-blur-3xl border border-white/5 shadow-interstellar transition-all duration-500 hover:bg-[#020617]/60 hover:border-white/10",
        stripeClass,
        className
      )}
    >
      {children}
    </div>
  );
};
