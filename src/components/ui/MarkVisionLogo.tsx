import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

// Standard Imports (Bypassing vite-imagetools due to build error)
import logoNew from '@/assets/markvision-logo-2.png';
import logoOld from '@/assets/markvision-logo.png';

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

  const [imgSrc, setImgSrc] = useState(logoSrc);

  useEffect(() => {
    setImgSrc(logoSrc);
  }, [logoSrc]);

  const logoImg = (
    <img
      src={imgSrc}
      alt="MarkVision AI Logo"
      className={cn("transition-all duration-300 block object-contain", className)}
      style={{ height: iconSize, width: iconSize === '100%' ? '100%' : 'auto' }}
      onError={() => {
        if (imgSrc !== logoNew) setImgSrc(logoNew);
        else if (imgSrc !== logoOld) setImgSrc(logoOld);
      }}
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
