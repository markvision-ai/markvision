import { memo, useId } from 'react';
import { motion } from 'framer-motion';

interface MiniSparklineProps {
    data: number[];
    color?: string; // hex or specialized color class
    height?: number;
    width?: number;
}

export const MiniSparkline = memo(({
    data,
    color = '#10B981', // emerald-500 default
    height = 40,
    width = 120
}: MiniSparklineProps) => {
    // Generate a unique ID for the gradient to avoid conflicts between multiple instances
    const gradientId = useId();
    // Clean unique ID for DOM use (remove colons etc if needed, though useId is usually safe)
    const cleanGradientId = `gradient-${gradientId.replace(/:/g, '')}`;

    if (!data || data.length < 2) return null;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const stepX = width / (data.length - 1);

    // Generate path
    const points = data.map((val, i) => {
        const x = i * stepX;
        const normalizedY = (val - min) / range;
        // Invert Y because SVG coordinates start from top
        const y = height - (normalizedY * height);
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="relative" style={{ width, height }}>
            <svg width={width} height={height} className="overflow-visible">
                {/* Gradient Definition */}
                <defs>
                    <linearGradient id={cleanGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>

                {/* Fill Area */}
                <motion.path
                    d={`M 0,${height} ${points} L ${width},${height} Z`}
                    fill={`url(#${cleanGradientId})`}
                    stroke="none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                />

                {/* Line */}
                <motion.polyline
                    points={points}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                />

                {/* End Dot */}
                {data.length > 0 && (
                    <circle
                        cx={width}
                        cy={height - ((data[data.length - 1] - min) / range) * height}
                        r="3"
                        fill={color}
                    />
                )}
            </svg>
        </div>
    );
});

MiniSparkline.displayName = 'MiniSparkline';
