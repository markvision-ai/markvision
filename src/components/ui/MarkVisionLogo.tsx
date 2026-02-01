import React from 'react';

interface MarkVisionLogoProps {
  className?: string;
  variant?: 'full' | 'icon'; // full = icon + text, icon = just symbol
  size?: number; // Size in px
}

export const MarkVisionLogo: React.FC<MarkVisionLogoProps> = ({ 
  className = "", 
  variant = 'icon',
  size
}) => {
  // Base SVG definitions for the Network M + Arrow
  const logoSvg = (
    <svg 
      viewBox="0 0 512 512" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      <defs>
        <linearGradient id="markvision-gradient" x1="0" y1="512" x2="512" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563eb" /> {/* Blue-600 */}
          <stop offset="50%" stopColor="#7c3aed" /> {/* Violet-600 */}
          <stop offset="100%" stopColor="#0891b2" /> {/* Cyan-600 */}
        </linearGradient>
        
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="15" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Network Structure 'M' */}
      <g stroke="url(#markvision-gradient)" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Left Vertical */}
        <line x1="128" y1="384" x2="128" y2="128" />
        
        {/* Middle V */}
        <polyline points="128,128 256,320 384,128" />
        
        {/* Right Vertical */}
        <line x1="384" y1="128" x2="384" y2="384" />
        
        {/* Cross Connections (Network effect) */}
        <line x1="128" y1="256" x2="256" y2="320" strokeOpacity="0.6" strokeWidth="8" />
        <line x1="384" y1="256" x2="256" y2="320" strokeOpacity="0.6" strokeWidth="8" />
        <line x1="128" y1="192" x2="192" y2="224" strokeOpacity="0.4" strokeWidth="4" />
        <line x1="384" y1="192" x2="320" y2="224" strokeOpacity="0.4" strokeWidth="4" />
      </g>

      {/* Nodes (Dots) */}
      <g className="fill-foreground" stroke="url(#markvision-gradient)" strokeWidth="4">
        <circle cx="128" cy="128" r="16" />
        <circle cx="128" cy="256" r="12" />
        <circle cx="128" cy="384" r="16" />
        
        <circle cx="384" cy="128" r="16" />
        <circle cx="384" cy="256" r="12" />
        <circle cx="384" cy="384" r="16" />
        
        <circle cx="256" cy="320" r="16" />
      </g>

      {/* Growth Arrow */}
      <path 
        d="M 128 350 L 256 384 L 448 96" 
        stroke="url(#markvision-gradient)" 
        strokeWidth="32" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        filter="url(#glow)"
      />
      <path 
        d="M 448 96 L 448 192 M 448 96 L 352 96" 
        stroke="url(#markvision-gradient)" 
        strokeWidth="32" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );

  if (variant === 'full') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="relative w-10 h-10">
            {logoSvg}
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
          MarkVision AI
        </span>
      </div>
    );
  }

  return logoSvg;
};
