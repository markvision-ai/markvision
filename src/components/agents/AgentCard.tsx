import * as React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Phone, Star, MessageCircle, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AgentTypeDefinition, getAgentColorClasses } from '@/lib/agents/agentTypes';

interface AgentCardProps {
    agentType: AgentTypeDefinition;
    isActive: boolean;
    isConfigured: boolean;
    onConfigure: () => void;
}

const iconMap: Record<string, LucideIcon> = {
    MessageSquare,
    Phone,
    Star,
    MessageCircle,
};

export const AgentCard: React.FC<AgentCardProps> = ({
    agentType,
    isActive,
    isConfigured,
    onConfigure,
}) => {
    const colors = getAgentColorClasses(agentType.color);
    const IconComponent = iconMap[agentType.icon] || MessageSquare;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, y: -4 }}
            transition={{ duration: 0.3 }}
            className={cn(
                'relative group cursor-pointer',
                'rounded-2xl border-2 p-6',
                'bg-white/[0.02] backdrop-blur-xl',
                'transition-all duration-300',
                'aspect-[3/4] flex flex-col',
                isActive
                    ? `${colors.border} ${colors.glow}`
                    : 'border-white/5 hover:border-white/20'
            )}
            onClick={onConfigure}
        >
            {/* Animated background gradient */}
            <div
                className={cn(
                    'absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                    'bg-gradient-to-br',
                    agentType.color === 'cyan' && 'from-cyan-500/5 to-blue-500/5',
                    agentType.color === 'purple' && 'from-purple-500/5 to-fuchsia-500/5',
                    agentType.color === 'emerald' && 'from-emerald-500/5 to-green-500/5',
                    agentType.color === 'orange' && 'from-orange-500/5 to-amber-500/5'
                )}
            />

            {/* Content */}
            <div className="relative z-10 space-y-4 flex flex-col flex-grow">
                {/* Icon */}
                <div
                    className={cn(
                        'w-16 h-16 rounded-2xl flex items-center justify-center',
                        'transition-all duration-300',
                        isActive ? colors.bg : 'bg-white/5 group-hover:bg-white/10'
                    )}
                >
                    <IconComponent
                        className={cn(
                            'w-8 h-8 transition-colors duration-300',
                            isActive ? colors.text : 'text-white/30 group-hover:text-white/50'
                        )}
                    />
                </div>

                {/* Title and Description */}
                <div className="space-y-2">
                    <h3 className="text-xl font-black text-white tracking-tight">
                        {agentType.name}
                    </h3>
                    <p className="text-sm text-white/40 leading-relaxed">
                        {agentType.description}
                    </p>
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-between pt-2 mt-auto">
                    {isConfigured ? (
                        <Badge
                            variant="outline"
                            className={cn(
                                'font-bold text-[10px] uppercase tracking-widest',
                                isActive
                                    ? `${colors.bg} ${colors.text} ${colors.border}`
                                    : 'bg-white/5 text-white/40 border-white/10'
                            )}
                        >
                            {isActive ? (
                                <>
                                    <div className={cn('w-1.5 h-1.5 rounded-full mr-2', colors.bg, 'animate-pulse')} />
                                    Активно
                                </>
                            ) : (
                                'Настроен'
                            )}
                        </Badge>
                    ) : (
                        <Badge
                            variant="outline"
                            className="bg-white/5 text-white/30 border-white/10 font-bold text-[10px] uppercase tracking-widest"
                        >
                            Не настроен
                        </Badge>
                    )}
                </div>

                {/* Action Button */}
                <Button
                    className={cn(
                        'w-full font-bold text-sm rounded-xl transition-all duration-300',
                        isConfigured
                            ? 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                            : `bg-gradient-to-r ${colors.text} text-white ${colors.glow} ${colors.hoverGlow}`,
                        agentType.color === 'cyan' && !isConfigured && 'from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500',
                        agentType.color === 'purple' && !isConfigured && 'from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500',
                        agentType.color === 'emerald' && !isConfigured && 'from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500',
                        agentType.color === 'orange' && !isConfigured && 'from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500'
                    )}
                >
                    {isConfigured ? 'Настроить' : 'Подключить'}
                </Button>
            </div>

            {/* Comet animation on active */}
            {isActive && (
                <motion.div
                    className={cn(
                        'absolute inset-0 rounded-2xl pointer-events-none',
                        'border-2',
                        colors.border
                    )}
                    initial={{ opacity: 0 }}
                    animate={{
                        opacity: [0, 1, 0],
                        scale: [0.95, 1.05, 0.95],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            )}
        </motion.div>
    );
};
