import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BeamProps {
  className?: string;
}

export const AnimatedBeam = ({ className }: BeamProps) => {
  return (
    <div className={cn("relative w-full h-[400px] rounded-3xl overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100", className)}>
      {/* Central Hub */}
      <motion.div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl flex items-center justify-center z-10"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
      >
        <span className="text-white font-bold text-xs text-center">MarkVision<br/>AI</span>
      </motion.div>

      {/* Source Nodes */}
      <SourceNode 
        icon="📱" 
        label="Instagram" 
        position={{ left: '10%', top: '30%' }}
        delay={0.1}
        beamDirection="right"
      />
      <SourceNode 
        icon="🔍" 
        label="Google Ads" 
        position={{ left: '10%', top: '60%' }}
        delay={0.2}
        beamDirection="right"
      />
      <SourceNode 
        icon="📘" 
        label="Facebook" 
        position={{ left: '15%', top: '45%' }}
        delay={0.15}
        beamDirection="right"
      />

      {/* Output Nodes */}
      <OutputNode 
        icon="📊" 
        label="Аналитика" 
        position={{ right: '10%', top: '25%' }}
        delay={0.3}
      />
      <OutputNode 
        icon="💰" 
        label="Продажи" 
        position={{ right: '10%', top: '50%' }}
        delay={0.4}
      />
      <OutputNode 
        icon="🤖" 
        label="Автоматизация" 
        position={{ right: '10%', top: '75%' }}
        delay={0.5}
      />

      {/* Animated Beams */}
      <Beam from={{ x: '20%', y: '30%' }} to={{ x: '50%', y: '50%' }} delay={0.6} />
      <Beam from={{ x: '20%', y: '60%' }} to={{ x: '50%', y: '50%' }} delay={0.7} />
      <Beam from={{ x: '25%', y: '45%' }} to={{ x: '50%', y: '50%' }} delay={0.65} />
      <Beam from={{ x: '50%', y: '50%' }} to={{ x: '80%', y: '25%' }} delay={0.9} color="from-purple-500 to-pink-500" />
      <Beam from={{ x: '50%', y: '50%' }} to={{ x: '80%', y: '50%' }} delay={1.0} color="from-purple-500 to-green-500" />
      <Beam from={{ x: '50%', y: '50%' }} to={{ x: '80%', y: '75%' }} delay={1.1} color="from-purple-500 to-blue-500" />
    </div>
  );
};

interface SourceNodeProps {
  icon: string;
  label: string;
  position: { left?: string; right?: string; top: string };
  delay: number;
  beamDirection: 'left' | 'right';
}

const SourceNode = ({ icon, label, position, delay }: SourceNodeProps) => (
  <motion.div 
    className="absolute flex flex-col items-center gap-1"
    style={position}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
  >
    <div className="w-12 h-12 rounded-xl bg-white shadow-lg flex items-center justify-center text-2xl">
      {icon}
    </div>
    <span className="text-xs font-medium text-slate-600">{label}</span>
  </motion.div>
);

interface OutputNodeProps {
  icon: string;
  label: string;
  position: { left?: string; right?: string; top: string };
  delay: number;
}

const OutputNode = ({ icon, label, position, delay }: OutputNodeProps) => (
  <motion.div 
    className="absolute flex flex-col items-center gap-1"
    style={position}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
  >
    <div className="w-12 h-12 rounded-xl bg-white shadow-lg flex items-center justify-center text-2xl">
      {icon}
    </div>
    <span className="text-xs font-medium text-slate-600">{label}</span>
  </motion.div>
);

interface BeamLineProps {
  from: { x: string; y: string };
  to: { x: string; y: string };
  delay: number;
  color?: string;
}

const Beam = ({ from, to, delay, color = "from-blue-500 to-purple-500" }: BeamLineProps) => {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
      <motion.line
        x1={from.x}
        y1={from.y}
        x2={from.x}
        y2={from.y}
        stroke="url(#beam-gradient)"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ x2: from.x, y2: from.y }}
        animate={{ x2: to.x, y2: to.y }}
        transition={{ delay, duration: 0.5, ease: "easeOut" }}
      />
      <defs>
        <linearGradient id="beam-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      {/* Moving dot */}
      <motion.circle
        r="4"
        fill="#8b5cf6"
        initial={{ cx: from.x, cy: from.y, opacity: 0 }}
        animate={{ 
          cx: [from.x, to.x, from.x],
          cy: [from.y, to.y, from.y],
          opacity: [0, 1, 0]
        }}
        transition={{ 
          delay: delay + 0.5,
          duration: 2,
          repeat: Infinity,
          repeatDelay: 1
        }}
      />
    </svg>
  );
};

export default AnimatedBeam;
