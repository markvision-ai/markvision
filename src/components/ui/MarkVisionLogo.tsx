import React from 'react';
import { cn } from '@/lib/utils';

// Logo 2 - WebP + PNG
import logoNewSrcSet from '@/assets/markvision-logo-2.png?w=400;800&format=webp;png&as=srcset';
import logoNewWebp from '@/assets/markvision-logo-2.png?w=400&format=webp';
import logoNewPng from '@/assets/markvision-logo-2.png?w=400&format=png';

// Logo - WebP + PNG
import logoOldSrcSet from '@/assets/markvision-logo.png?w=400;800&format=webp;png&as=srcset';
import logoOldWebp from '@/assets/markvision-logo.png?w=400&format=webp';
import logoOldPng from '@/assets/markvision-logo.png?w=400&format=png';

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

  // Select appropriate logo set
  const logoPng = type === 'text' ? logoNewPng : logoOldPng;
  const logoSrcSet = type === 'text' ? logoNewSrcSet : logoOldSrcSet;

  const logoImg = (
    <picture>
      <source type="image/webp" srcSet={logoSrcSet} />
      <img
        src={logoPng}
        alt="MarkVision AI Logo"
        className={cn("transition-all duration-300 block object-contain", className)}
        style={{ height: iconSize, width: iconSize === '100%' ? '100%' : 'auto' }}
      />
    </picture>
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
