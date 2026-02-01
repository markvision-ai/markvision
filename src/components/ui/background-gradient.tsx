"use client";
import { cn } from "@/lib/utils";
import React from "react";
import { motion } from "framer-motion";

export const BackgroundGradient = ({
  children,
  className,
  containerClassName,
  animate = true,
}: {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  animate?: boolean;
}) => {
  const variants = {
    initial: {
      backgroundPosition: "0 50%",
    },
    animate: {
      backgroundPosition: ["0, 50%", "100% 50%", "0 50%"],
    },
  };
  return (
    <div className={cn("relative p-[4px] group", containerClassName)}>
      <motion.div
        variants={animate ? variants : undefined}
        initial={animate ? "initial" : undefined}
        animate={animate ? "animate" : undefined}
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                repeatType: "reverse",
              }
            : undefined
        }
        style={{
          backgroundSize: animate ? "400% 400%" : undefined,
        }}
        className={cn(
          "absolute inset-0 rounded-3xl z-[1] opacity-60 group-hover:opacity-100 blur-xl transition duration-500 will-change-transform",
          "bg-[radial-gradient(circle_farthest-side_at_0_100%,#00d4ff,transparent),radial-gradient(circle_farthest-side_at_100%_0,#7c3aed,transparent),radial-gradient(circle_farthest-side_at_100%_100%,#06b6d4,transparent),radial-gradient(circle_farthest-side_at_0_0,#3b82f6,#141316)]"
        )}
      />
      <motion.div
        variants={animate ? variants : undefined}
        initial={animate ? "initial" : undefined}
        animate={animate ? "animate" : undefined}
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                repeatType: "reverse",
              }
            : undefined
        }
        style={{
          backgroundSize: animate ? "400% 400%" : undefined,
        }}
        className={cn(
          "absolute inset-0 rounded-3xl z-[1] will-change-transform",
          "bg-[radial-gradient(circle_farthest-side_at_0_100%,#00d4ff,transparent),radial-gradient(circle_farthest-side_at_100%_0,#7c3aed,transparent),radial-gradient(circle_farthest-side_at_100%_100%,#06b6d4,transparent),radial-gradient(circle_farthest-side_at_0_0,#3b82f6,#141316)]"
        )}
      />

      <div className={cn("relative z-10", className)}>{children}</div>
    </div>
  );
};

export const BackgroundGradientLight = ({
  children,
  className,
  containerClassName,
}: {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
}) => {
  return (
    <div className={cn("relative p-[2px] group", containerClassName)}>
      <div
        className={cn(
          "absolute inset-0 rounded-3xl z-[1] opacity-40 group-hover:opacity-70 blur-xl transition duration-500",
          "bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600"
        )}
      />
      <div
        className={cn(
          "absolute inset-0 rounded-3xl z-[1]",
          "bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600"
        )}
      />
      <div className={cn("relative z-10 bg-zinc-900 rounded-[22px]", className)}>
        {children}
      </div>
    </div>
  );
};
