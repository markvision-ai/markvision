import { useMemo, memo } from 'react';
import { cn } from '@/lib/utils';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export const Sparkline = memo(({ 
  data, 
  width = 60, 
  height = 20,
  color = 'rgb(59, 130, 246)', // primary blue
  className 
}: SparklineProps) => {
  const points = useMemo(() => {
    if (!data || data.length === 0) return '';

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    return data
      .map((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${x},${y}`;
      })
      .join(' ');
  }, [data, width, height]);

  if (!data || data.length === 0) return null;

  return (
    <svg 
      width={width} 
      height={height} 
      className={cn("inline-block", className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});
