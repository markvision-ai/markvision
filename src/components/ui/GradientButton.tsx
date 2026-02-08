import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface GradientButtonProps {
    icon: React.ReactNode;
    children: React.ReactNode;
    onClick?: () => void;
    gradient?: 'blue' | 'purple' | 'emerald' | 'orange';
    className?: string;
}

const gradientStyles = {
    blue: 'from-blue-500 to-cyan-500',
    purple: 'from-purple-500 to-pink-500',
    emerald: 'from-emerald-500 to-teal-500',
    orange: 'from-orange-500 to-red-500',
};

export const GradientButton = memo(({
    icon,
    children,
    onClick,
    gradient = 'blue',
    className
}: GradientButtonProps) => {
    return (
        <motion.button
            onClick={onClick}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{
                scale: 1.05,
                boxShadow: '0 0 40px rgba(59, 130, 246, 0.4)',
            }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "relative overflow-hidden rounded-xl p-4",
                "bg-gradient-to-r",
                gradientStyles[gradient],
                "text-white font-semibold",
                "shadow-[0_4px_20px_rgba(59,130,246,0.3)]",
                "transition-all duration-300",
                "group",
                className
            )}
        >
            {/* Shimmer effect */}
            <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100"
                style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                    backgroundSize: '200% 100%',
                }}
                animate={{
                    backgroundPosition: ['0% 0%', '200% 0%'],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                }}
            />

            {/* Content */}
            <div className="relative z-10 flex items-center justify-center gap-3">
                <motion.div
                    className="w-6 h-6"
                    animate={{
                        rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                >
                    {icon}
                </motion.div>
                <span className="text-base font-bold tracking-wide">
                    {children}
                </span>
            </div>
        </motion.button>
    );
});

GradientButton.displayName = 'GradientButton';
