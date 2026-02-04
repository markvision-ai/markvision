"use client";

import React, { forwardRef, useRef } from "react";
import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { motion } from "framer-motion";
import { MarkVisionLogo } from "@/components/ui/MarkVisionLogo";
const Circle = forwardRef<HTMLDivElement, {
  className?: string;
  children?: React.ReactNode;
  label?: string;
}>(({
  className,
  children,
  label
}, ref) => {
  return <div className="flex flex-col items-center gap-2 sm:gap-3">
      <div ref={ref} className={cn("z-10 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-2xl sm:rounded-3xl border border-border bg-card shadow-lg shadow-blue-500/20 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-blue-500/40", className)}>
        {children}
      </div>
      {label && <span className="text-[10px] sm:text-xs font-medium text-muted-foreground text-center max-w-[70px] sm:max-w-[90px] leading-tight">
          {label}
        </span>}
    </div>;
});
Circle.displayName = "Circle";
export function BeamVisualization({
  className
}: {
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instagramRef = useRef<HTMLDivElement>(null);
  const tiktokRef = useRef<HTMLDivElement>(null);
  const googleRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const crmRef = useRef<HTMLDivElement>(null);
  const analyticsRef = useRef<HTMLDivElement>(null);
  const financeRef = useRef<HTMLDivElement>(null);
  return <div className={cn("relative flex h-[350px] sm:h-[400px] lg:h-[450px] w-full items-center justify-center overflow-hidden rounded-[28px] bg-gradient-to-b from-background to-background/80 border border-border p-6 sm:p-10 lg:p-14", className)} ref={containerRef}>
      <div className="flex size-full max-w-5xl flex-row items-stretch justify-between gap-4 sm:gap-8 lg:gap-16">
        {/* Left side - Input sources */}
        <div className="flex flex-col justify-center gap-4 sm:gap-6 lg:gap-8">
          <Circle ref={instagramRef} label="Instagram">
            <svg className="h-5 w-5 sm:h-7 sm:w-7" viewBox="0 0 24 24" fill="none">
              <linearGradient id="instagram" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#feda75" />
                <stop offset="25%" stopColor="#fa7e1e" />
                <stop offset="50%" stopColor="#d62976" />
                <stop offset="75%" stopColor="#962fbf" />
                <stop offset="100%" stopColor="#4f5bd5" />
              </linearGradient>
              <rect x="2" y="2" width="20" height="20" rx="5" stroke="url(#instagram)" strokeWidth="2" />
              <circle cx="12" cy="12" r="4" stroke="url(#instagram)" strokeWidth="2" />
              <circle cx="18" cy="6" r="1.5" fill="url(#instagram)" />
            </svg>
          </Circle>
          <Circle ref={tiktokRef} label="TikTok">
            <svg className="h-5 w-5 sm:h-7 sm:w-7" viewBox="0 0 24 24" fill="none">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.88 2.89 2.89 0 01-2.88-2.88 2.89 2.89 0 012.88-2.88c.28 0 .54.04.79.1V9.4a6.35 6.35 0 00-.79-.05A6.34 6.34 0 003.15 15.7a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.05a8.26 8.26 0 004.76 1.52V7.11a4.85 4.85 0 01-1-.42z" fill="#000" />
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.76 0 2.89 2.89 0 012.88-2.88c.28 0 .54.04.79.1V9.4a6.35 6.35 0 00-.79-.05A6.34 6.34 0 003.15 15.7a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.05a8.26 8.26 0 004.76 1.52V7.11a4.85 4.85 0 01-1-.42z" fill="url(#tiktok-gradient)" />
              <defs>
                <linearGradient id="tiktok-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#69C9D0" />
                  <stop offset="50%" stopColor="#EE1D52" />
                  <stop offset="100%" stopColor="#69C9D0" />
                </linearGradient>
              </defs>
            </svg>
          </Circle>
          <Circle ref={googleRef} label="Google Ads">
            <svg className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          </Circle>
        </div>

        {/* Center - MarkVision Logo */}
        <div className="flex flex-col justify-center items-center">
          <motion.div initial={{
          scale: 0.8,
          opacity: 0
        }} animate={{
          scale: 1,
          opacity: 1
        }} transition={{
          delay: 0.5,
          duration: 0.5,
          type: "spring"
        }} className="relative">
            {/* Glow effect removed as per request */}
            
            <div ref={centerRef} className="relative z-10 flex h-28 w-28 sm:h-40 sm:w-40 items-center justify-center p-0">
              <MarkVisionLogo size="100%" type="text" className="scale-125 mix-blend-multiply" />
            </div>
          </motion.div>
        </div>

        {/* Right side - Output destinations */}
        <div className="flex flex-col justify-center gap-4 sm:gap-6 lg:gap-8">
          <Circle ref={crmRef} label="CRM">
            <svg className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </Circle>
          <Circle ref={analyticsRef} label="Аналитика">
            <svg className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </Circle>
          <Circle ref={financeRef} label="Финансы">
            <svg className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          </Circle>
        </div>
      </div>

      {/* Animated beams - Left to Center */}
      <AnimatedBeam containerRef={containerRef} fromRef={instagramRef} toRef={centerRef} curvature={-50} gradientStartColor="#E4405F" gradientStopColor="#3b82f6" duration={2} className="z-20" />
      <AnimatedBeam containerRef={containerRef} fromRef={tiktokRef} toRef={centerRef} gradientStartColor="#69C9D0" gradientStopColor="#3b82f6" duration={2.2} className="z-20" />
      <AnimatedBeam containerRef={containerRef} fromRef={googleRef} toRef={centerRef} curvature={50} gradientStartColor="#EA4335" gradientStopColor="#3b82f6" duration={2.4} className="z-20" />
      
      {/* Center to Right */}
      <AnimatedBeam containerRef={containerRef} fromRef={centerRef} toRef={crmRef} curvature={-50} gradientStartColor="#3b82f6" gradientStopColor="#6366f1" duration={2.3} className="z-20" />
      <AnimatedBeam containerRef={containerRef} fromRef={centerRef} toRef={analyticsRef} gradientStartColor="#3b82f6" gradientStopColor="#8b5cf6" duration={2.5} className="z-20" />
      <AnimatedBeam containerRef={containerRef} fromRef={centerRef} toRef={financeRef} curvature={50} gradientStartColor="#3b82f6" gradientStopColor="#10b981" duration={2.7} className="z-20" />
    </div>;
}