import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HeroMetricCardProps {
    label: string;
    value: number;
    format?: 'currency' | 'number' | 'percent';
    gradient: 'emerald-cyan' | 'blue-purple' | 'red-orange' | 'purple-pink';
    icon: React.ReactNode;
    subValue?: string;
    className?: string;
}

const gradientStyles = {
    'emerald-cyan': {
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
        border: 'rgba(16, 185, 129, 0.3)',
        glow: '0 0 60px rgba(16, 185, 129, 0.25)',
        hoverGlow: '0 0 80px rgba(16, 185, 129, 0.4)',
        iconColor: 'text-emerald-400',
    },
    'blue-purple': {
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 51, 234, 0.15) 100%)',
        border: 'rgba(59, 130, 246, 0.3)',
        glow: '0 0 60px rgba(59, 130, 246, 0.25)',
        hoverGlow: '0 0 80px rgba(59, 130, 246, 0.4)',
        iconColor: 'text-blue-400',
    },
    'red-orange': {
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(249, 115, 22, 0.15) 100%)',
        border: 'rgba(239, 68, 68, 0.3)',
        glow: '0 0 60px rgba(239, 68, 68, 0.25)',
        hoverGlow: '0 0 80px rgba(239, 68, 68, 0.4)',
        iconColor: 'text-red-400',
    },
    'purple-pink': {
        background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)',
        border: 'rgba(147, 51, 234, 0.3)',
        glow: '0 0 60px rgba(147, 51, 234, 0.25)',
        hoverGlow: '0 0 80px rgba(147, 51, 234, 0.4)',
        iconColor: 'text-purple-400',
    },
};

export const HeroMetricCard = memo(({
    label,
    value,
    format = 'number',
    gradient,
    icon,
    subValue,
    className
}: HeroMetricCardProps) => {
    const style = gradientStyles[gradient];

    const formatValue = () => {
        if (format === 'currency') {
            if (value >= 1000000) {
                return (value / 1000000).toFixed(1).replace('.0', '') + ' млн ₸';
            }
            return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
        } else if (format === 'percent') {
            return `${value >= 0 ? '+' : ''}${value.toFixed(0)}%`;
        } else {
            return new Intl.NumberFormat('ru-RU').format(Math.round(value));
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{
                scale: 1.02,
                boxShadow: style.hoverGlow,
                borderColor: 'rgba(255,255,255,0.2)', // Brighter border on hover
            }}
            transition={{ duration: 0.2 }}
            className={cn("relative overflow-hidden rounded-2xl p-6 cursor-pointer", className)}
            style={{
                background: style.background,
                border: `1px solid ${style.border}`,
                boxShadow: style.glow,
            }}
        >
            {/* Animated gradient overlay on hover */}
            <motion.div
                className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                    backgroundSize: '200% 100%',
                }}
                animate={{
                    backgroundPosition: ['0% 0%', '200% 0%'],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear',
                }}
            />

            {/* Content */}
            <div className="relative z-10 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white/70 uppercase tracking-wider">
                        {label}
                    </span>
                    <motion.div
                        className={cn("w-10 h-10 rounded-xl flex items-center justify-center", style.iconColor)}
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(10px)',
                        }}
                        animate={{
                            scale: [1, 1.1, 1],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    >
                        {icon}
                    </motion.div>
                </div>

                {/* Value */}
                <div className="space-y-1">
                    <motion.div
                        className="text-4xl md:text-5xl font-bold text-white tracking-tight font-mono"
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        {formatValue()}
                    </motion.div>
                    {subValue && (
                        <p className="text-sm text-white/60 font-medium">
                            {subValue}
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    );
});

HeroMetricCard.displayName = 'HeroMetricCard';
