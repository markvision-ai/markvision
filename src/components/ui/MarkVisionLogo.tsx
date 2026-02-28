import React from 'react';
import { cn } from '@/lib/utils';
import logoImgSrc from '@/assets/markvision-logo.png';

interface MarkVisionLogoProps {
  className?: string;
  variant?: 'full' | 'icon'; 
  type?: 'default' | 'text';
  size?: number | string; 
  theme?: 'light' | 'dark' | 'auto'; 
}

export const MarkVisionLogo: React.FC<MarkVisionLogoProps> = ({
  className = "",
  variant = 'icon',
  size,
}) => {
  const iconSize = size || (variant === 'full' ? 40 : 60);

  const logoImg = (
    <img
      src={logoImgSrc}
      alt="MarkVision AI Logo"
      className={cn("transition-all duration-300 block object-contain", className)}
      style={{ height: iconSize, width: iconSize === '100%' ? '100%' : 'auto' }}
    />
  );

  if (variant === 'full') {
    return (
      <div className={cn("flex flex-col items-center justify-center", className)}>
        <div className="relative flex items-center justify-center mb-1">
          {logoImg}
        </div>
        <div className="flex flex-col items-center leading-none mt-1">
          <span className={cn(
            "text-2xl font-bold tracking-tight text-foreground",
            "font-sans"
          )}>
            MarkVision
          </span>
          <div className="flex items-center justify-center w-full gap-2 mt-1">
            <div className="h-[1px] w-8 bg-primary/20"></div>
            <span className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase">AI</span>
            <div className="h-[1px] w-8 bg-primary/20"></div>
          </div>
        </div>
      </div>
    );
  }

  return logoImg;
};
