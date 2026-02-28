import { cn } from '@/lib/utils';

interface DotPatternBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

export const DotPatternBackground = ({ className, children }: DotPatternBackgroundProps) => {
  return (
    <div className={cn("relative w-full min-h-screen overflow-hidden", className)}>
      {/* Background - Deep Dark */}
      <div className="absolute inset-0 bg-[#020617]" />

      {/* Dot Pattern - адаптивный */}
      <div
        className="absolute inset-0 opacity-[0.15] "
        style={{
          backgroundImage: `radial-gradient(circle, hsl(var(--muted-foreground) / 0.3) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Glow Spots - адаптивные для темы */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Blue Glow - Top Left */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-20 "
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.5) 0%, transparent 70%)',
            top: '-200px',
            left: '-200px'
          }}
        />

        {/* Purple/Secondary Glow - Bottom Right */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-20 "
          style={{
            background: 'radial-gradient(circle, hsl(var(--secondary) / 0.5) 0%, transparent 70%)',
            bottom: '-200px',
            right: '-200px'
          }}
        />

        {/* Accent Glow - Center */}
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-3xl opacity-10 "
          style={{
            background: 'radial-gradient(circle, hsl(var(--accent) / 0.5) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
