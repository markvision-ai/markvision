import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "interstellar-button",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-white/80 text-foreground border border-primary/30 hover:border-primary/50 hover:bg-card/70 shadow-[0_0_12px_hsl(var(--primary)/0.25)]",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        premium: "bg-gradient-to-r from-primary via-blue-500 to-lime-500 text-white shadow-[0_0_18px_hsl(var(--primary)/0.45)] hover:shadow-[0_0_28px_hsl(var(--primary)/0.65)] hover:scale-[1.02] border-0 transition-all duration-300",
        glow: "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.6)] transition-shadow duration-300",
        glass: "bg-white/70 backdrop-blur-sm border border-white/50 text-foreground hover:bg-card/70 hover:border-primary/30",
        // Light Apple Glass variants
        interstellar: "relative overflow-hidden bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold border-0 shadow-[0_4px_16px_rgba(59,130,246,0.3),inset_0_1px_0_rgba(255,255,255,0.4)] hover:shadow-[0_8px_24px_rgba(59,130,246,0.4),0_0_40px_rgba(59,130,246,0.2)] hover:-translate-y-0.5 transition-all duration-300",
        "interstellar-ghost": "bg-transparent text-slate-600 border border-slate-200 hover:bg-white/50 hover:border-blue-300 hover:text-blue-600 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all duration-300",
        "interstellar-secondary": "bg-white/60 backdrop-blur-md text-slate-800 border border-white/60 hover:bg-white/80 hover:border-blue-300 shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04),0_0_20px_rgba(59,130,246,0.1)] transition-all duration-300",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
