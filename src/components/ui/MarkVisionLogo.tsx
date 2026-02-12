import React from 'react';
import { cn } from '@/lib/utils';

// Standard Imports (Bypassing vite-imagetools due to build error)
import logoNew from '@/assets/markvision-logo-2.png';
const logoOld = '/markvision-logo.png';

interface MarkVisionLogoProps {
  className?: string;
  variant?: 'full' | 'icon'; // full = icon + text, icon = just symbol
  type?: 'default' | 'text'; // default = old logo (icon only), text = new logo (with text)
  size?: number | string; // Size in px
  theme?: 'light' | 'dark' | 'auto'; // Force a theme or use auto
}

export const MarkVisionLogo: React.FC<MarkVisionLogoProps> = ({
  className = "",
  variant = 'icon',
  type = 'default',
  size,
  theme = 'auto'
}) => {
  const iconSize = size || (variant === 'full' ? 40 : 60);

  // Select appropriate logo
  const logoSrc = type === 'text' ? logoNew : logoOld;

  const logoImg = (
    <img
      src={logoSrc}
      alt="MarkVision AI Logo"
      className={cn("transition-all duration-300 block object-contain", className)}
      style={{ height: iconSize, width: iconSize === '100%' ? '100%' : 'auto' }}
    />
  );

  if (variant === 'full') {
    return (
      <div className={cn("flex flex-col items-center justify-center", className)}>
        {/* Icon Container */}
        <div className="relative flex items-center justify-center mb-1">
          {logoImg}
        </div>

        {/* Text Container */}
        <div className="flex flex-col items-center leading-none mt-1">
          <span className={cn(
            "text-2xl font-bold tracking-tight bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent filter drop-shadow-sm",
            "font-sans"
          )}>
            MarkVision
          </span>
          <div className="flex items-center justify-center w-full gap-2">
            <div className="h-[1px] w-8 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
            <span className="text-[10px] font-bold tracking-[0.2em] text-cyan-400/80 uppercase">AI</span>
            <div className="h-[1px] w-8 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
          </div>
        </div>
      </div>
    );
  }

  return logoImg;
};
