"use client";
import React from "react";
import { cn } from "@/lib/utils";

export const BackgroundBeams = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "absolute inset-0 w-full h-full bg-neutral-950 overflow-hidden pointer-events-none",
        className
      )}
    >
      <div className="absolute inset-0 bg-neutral-950 [mask-image:radial-gradient(transparent,white)] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-full opacity-20">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 800 800"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <radialGradient
              id="grad1"
              cx="50%"
              cy="50%"
              r="50%"
              fx="50%"
              fy="50%"
            >
              <stop
                offset="0%"
                style={{ stopColor: "rgb(120, 119, 198)", stopOpacity: 1 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "rgb(0, 0, 0)", stopOpacity: 0 }}
              />
            </radialGradient>
          </defs>
          <g>
             <circle cx="400" cy="400" r="600" fill="url(#grad1)" className="animate-pulse opacity-20" />
             <path d="M0 0L800 800M800 0L0 800" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          </g>
        </svg>
      </div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
    </div>
  );
};
