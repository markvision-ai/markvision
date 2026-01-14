"use client";

import { motion } from "framer-motion";
import React from "react";
import { cn } from "@/lib/utils";

interface AuroraTextProps {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
}

export function AuroraText({ 
  children, 
  className,
  colors = ["#3b82f6", "#06b6d4", "#6366f1", "#3b82f6"]
}: AuroraTextProps) {
  return (
    <motion.span
      className={cn("relative inline-block", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <span className="sr-only">{children}</span>
      <motion.span
        className="relative"
        style={{
          backgroundImage: `linear-gradient(90deg, ${colors.join(", ")})`,
          backgroundSize: "300% 100%",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          duration: 4,
          ease: "easeInOut",
          repeat: Infinity,
        }}
        aria-hidden="true"
      >
        {children}
      </motion.span>
      {/* Glow effect */}
      <motion.span
        className="absolute inset-0 blur-lg opacity-50 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(90deg, ${colors.join(", ")})`,
          backgroundSize: "300% 100%",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          duration: 4,
          ease: "easeInOut",
          repeat: Infinity,
        }}
        aria-hidden="true"
      >
        {children}
      </motion.span>
    </motion.span>
  );
}
