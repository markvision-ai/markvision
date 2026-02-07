import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  variant?: "default" | "interstellar";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "default", ...props }, ref) => {
    const variantStyles = {
      default:
        "interstellar-input border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
      interstellar:
        "bg-white/[0.03] backdrop-blur-xl border-white/[0.08] text-white placeholder:text-white/40 focus-visible:bg-white/[0.05] focus-visible:border-primary/50 focus-visible:ring-primary/20 focus-visible:shadow-[0_0_20px_hsl(192_100%_50%/0.1)]",
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border px-3 py-2 text-base ring-offset-background transition-all duration-300",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "md:text-sm",
          variantStyles[variant],
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
