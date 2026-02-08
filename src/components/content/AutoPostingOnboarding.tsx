import React from 'react';
import { motion } from 'framer-motion';
import {
    Plus,
    Link as LinkIcon,
    Rocket,
    Instagram,
    Youtube,
    Globe,
    Send,
    Sparkles,
    ArrowRight,
    ShieldCheck,
    Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface OnboardingProps {
    onConnect?: () => void;
    onCreatePost?: () => void;
}

export const AutoPostingOnboarding = ({ onConnect, onCreatePost }: OnboardingProps) => {
    const platforms = [
        { name: 'Instagram', icon: <Instagram className="w-5 h-5 text-pink-500" />, color: 'from-pink-500/20 to-purple-500/20' },
        { name: 'TikTok', icon: <div className="text-white font-bold text-xs uppercase px-1">TT</div>, color: 'from-slate-500/20 to-slate-800/20' },
        { name: 'YouTube', icon: <Youtube className="w-5 h-5 text-red-500" />, color: 'from-red-500/20 to-orange-500/20' },
        { name: 'Threads', icon: <div className="text-white font-bold text-lg">@</div>, color: 'from-slate-700/20 to-black/20' },
        { name: 'Telegram', icon: <Send className="w-5 h-5 text-sky-500" />, color: 'from-sky-500/20 to-blue-600/20' },
        { name: 'Site Blog', icon: <Globe className="w-5 h-5 text-emerald-500" />, color: 'from-emerald-500/20 to-teal-600/20' },
    ];

    const steps = [
        {
            id: 1,
            title: "Подключите аккаунты",
            description: "Все ваши соцсети в одном защищенном месте. Публикуйте везде одним кликом.",
            icon: <LinkIcon className="w-6 h-6 text-cyan-400" />,
            action: {
                label: "Подключить аккаунты",
                onClick: onConnect,
                icon: <Plus className="w-4 h-4 mr-2" />
            },
            visual: (
                <div className="flex flex-wrap gap-2 mt-4">
                    {platforms.map((p) => (
                        <div key={p.name} className={cn("p-2 rounded-lg bg-gradient-to-br border border-white/5", p.color)}>
                            {p.icon}
                        </div>
                    ))}
                </div>
            )
        },
        {
            id: 2,
            title: "Создайте первый пост",
            description: "Загрузите медиа, добавьте текст и выберите время. AI-ассистент поможет с хэштегами.",
            icon: <Rocket className="w-6 h-6 text-purple-400" />,
            action: {
                label: "Создать пост",
                onClick: onCreatePost,
                icon: <Plus className="w-4 h-4 mr-2" />
            },
            visual: (
                <div className="relative mt-4 h-24 w-full bg-white/5 rounded-xl border border-white/10 overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-transparent animate-pulse" />
                    <Sparkles className="w-8 h-8 text-white/20 animate-bounce" />
                </div>
            )
        }
    ];

    return (
        <div className="flex flex-col items-center justify-center space-y-12 max-w-5xl mx-auto py-12 px-6 relative">
            {/* Background radial glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Header */}
            <div className="text-center space-y-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-medium uppercase tracking-widest"
                >
                    <Zap className="w-3 h-3" />
                    Автопостинг
                </motion.div>
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl md:text-5xl font-black tracking-tight text-white"
                >
                    Управление <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500">Контентом</span>
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg text-white/50 max-w-xl mx-auto font-light"
                >
                    Планируйте, публикуйте и анализируйте результаты во всех соцсетях из одного окна.
                </motion.p>
            </div>

            {/* Steps Cards */}
            <div className="grid md:grid-cols-2 gap-8 w-full relative z-10">
                {steps.map((step, idx) => (
                    <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: idx === 0 ? -40 : 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + idx * 0.1, duration: 0.6, type: "spring" }}
                    >
                        <Card className="group relative h-full bg-black/40 border border-white/10 backdrop-blur-xl overflow-hidden hover:border-cyan-500/30 transition-all duration-500 shadow-2xl">
                            {/* Corner Glow */}
                            <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all duration-500" />

                            <CardContent className="p-8 flex flex-col h-full space-y-6">
                                <div className="flex items-start justify-between">
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                                        {step.icon}
                                    </div>
                                    <span className="text-5xl font-black text-white/5 select-none">{step.id}</span>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight">
                                        {step.title}
                                    </h3>
                                    <p className="text-white/50 leading-relaxed font-light">
                                        {step.description}
                                    </p>
                                </div>

                                <div className="flex-1">
                                    {step.visual}
                                </div>

                                <Button
                                    onClick={step.action.onClick}
                                    className="w-full h-14 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl group/btn overflow-hidden relative shadow-lg"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/btn:animate-shimmer" />
                                    <span className="relative z-10 flex items-center font-bold uppercase tracking-wider">
                                        {step.action.icon}
                                        {step.action.label}
                                        <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                                    </span>
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Trust Line */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex items-center gap-6 pt-6 opacity-30 group grayscale hover:grayscale-0 transition-all"
            >
                <div className="h-px w-20 bg-gradient-to-r from-transparent to-white" />
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] font-mono text-white whitespace-nowrap">
                    <ShieldCheck className="w-3 h-3 text-cyan-400" />
                    Безопасное соединение активно
                </div>
                <div className="h-px w-20 bg-gradient-to-l from-transparent to-white" />
            </motion.div>
        </div>
    );
};
