"use client";

import React, { forwardRef, useRef } from "react";
import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { motion } from "framer-motion";

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode; label?: string }
>(({ className, children, label }, ref) => {
  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3">
      <div
        ref={ref}
        className={cn(
          "z-10 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-lg shadow-slate-100/50 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-blue-100/50",
          className
        )}
      >
        {children}
      </div>
      {label && (
        <span className="text-[10px] sm:text-xs font-medium text-slate-500 text-center max-w-[70px] sm:max-w-[90px] leading-tight">
          {label}
        </span>
      )}
    </div>
  );
});

Circle.displayName = "Circle";

export function BeamVisualization({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instagramRef = useRef<HTMLDivElement>(null);
  const whatsappRef = useRef<HTMLDivElement>(null);
  const googleRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const crmRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const moneyRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={cn(
        "relative flex h-[350px] sm:h-[400px] lg:h-[450px] w-full items-center justify-center overflow-hidden rounded-[28px] bg-gradient-to-b from-slate-50/50 to-white p-6 sm:p-10 lg:p-14",
        className
      )}
      ref={containerRef}
    >
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
          <Circle ref={whatsappRef} label="WhatsApp">
            <svg className="h-5 w-5 sm:h-7 sm:w-7" viewBox="0 0 24 24" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
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
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
            className="relative"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-3xl sm:rounded-[28px] bg-gradient-to-br from-blue-400 to-indigo-500 blur-2xl opacity-40 scale-150" />
            
            <div
              ref={centerRef}
              className="relative z-10 flex h-20 w-20 sm:h-28 sm:w-28 items-center justify-center rounded-3xl sm:rounded-[28px] bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 shadow-2xl shadow-blue-500/40"
            >
              <div className="flex flex-col items-center text-white">
                <span className="text-3xl sm:text-4xl font-bold">M</span>
                <span className="text-[8px] sm:text-[10px] font-medium opacity-80 tracking-wider">VISION AI</span>
              </div>
            </div>
          </motion.div>
          <span className="mt-4 text-sm sm:text-base font-semibold text-slate-800 tracking-tight">
            MarkVision AI
          </span>
        </div>

        {/* Right side - Output destinations */}
        <div className="flex flex-col justify-center gap-4 sm:gap-6 lg:gap-8">
          <Circle ref={crmRef} label="CRM">
            <svg className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </Circle>
          <Circle ref={dashboardRef} label="Дашборд">
            <svg className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </Circle>
          <Circle ref={moneyRef} label="Деньги">
            <svg className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </Circle>
        </div>
      </div>

      {/* Animated beams - Left to Center */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={instagramRef}
        toRef={centerRef}
        curvature={-50}
        gradientStartColor="#E4405F"
        gradientStopColor="#3b82f6"
        duration={2}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={whatsappRef}
        toRef={centerRef}
        gradientStartColor="#25D366"
        gradientStopColor="#3b82f6"
        duration={2.2}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={googleRef}
        toRef={centerRef}
        curvature={50}
        gradientStartColor="#EA4335"
        gradientStopColor="#3b82f6"
        duration={2.4}
      />
      
      {/* Center to Right */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={centerRef}
        toRef={crmRef}
        curvature={-50}
        gradientStartColor="#3b82f6"
        gradientStopColor="#6366f1"
        duration={2.3}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={centerRef}
        toRef={dashboardRef}
        gradientStartColor="#3b82f6"
        gradientStopColor="#8b5cf6"
        duration={2.5}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={centerRef}
        toRef={moneyRef}
        curvature={50}
        gradientStartColor="#3b82f6"
        gradientStopColor="#10b981"
        duration={2.7}
      />
    </div>
  );
}