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
        { name: 'Instagram', icon: <Instagram className="w-5 h-5 text-pink-500" />, color: 'from-pink-500/10 to-purple-500/10' },
        { name: 'TikTok', icon: <div className="text-foreground font-bold text-xs uppercase px-1">TT</div>, color: 'from-slate-500/10 to-slate-800/10' },
        { name: 'YouTube', icon: <Youtube className="w-5 h-5 text-red-500" />, color: 'from-red-500/10 to-orange-500/10' },
        { name: 'Threads', icon: <div className="text-foreground font-bold text-lg">@</div>, color: 'from-slate-700/10 to-black/10' },
        { name: 'Telegram', icon: <Send className="w-5 h-5 text-sky-500" />, color: 'from-sky-500/10 to-blue-600/10' },
        { name: 'Site Blog', icon: <Globe className="w-5 h-5 text-blue-500" />, color: 'from-blue-500/10 to-cyan-500/10' },
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
                        <div key={p.name} className={cn("p-2 rounded-lg bg-gradient-to-br border border-white/60 shadow-sm", p.color)}>
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
                <div className="relative mt-4 h-24 w-full bg-white/50 rounded-xl border border-white/60 overflow-hidden flex items-center justify-center shadow-inner">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent animate-pulse" />
                    <Sparkles className="w-8 h-8 text-primary/40 animate-bounce" />
                </div>
            )
        }
    ];

    return (
        <div className="flex flex-col items-center justify-center space-y-12 max-w-5xl mx-auto py-12 px-6 relative">
            {/* Background radial glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Header */}
            <div className="text-center space-y-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-widest"
                >
                    <Zap className="w-3 h-3" />
                    Автопостинг
                </motion.div>
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl md:text-5xl font-black tracking-tight text-foreground"
                >
                    Управление <span className="text-primary">Контентом</span>
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg text-muted-foreground max-w-xl mx-auto font-light"
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
                        <Card className="group relative h-full bg-white/70 backdrop-blur-2xl border border-white/60 overflow-hidden hover:border-primary/30 transition-all duration-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg">
                            {/* Corner Glow */}
                            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-500" />

                            <CardContent className="p-8 flex flex-col h-full space-y-6">
                                <div className="flex items-start justify-between">
                                    <div className="w-16 h-16 rounded-2xl bg-white/50 border border-white/60 shadow-sm flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                                        {step.icon}
                                    </div>
                                    <span className="text-5xl font-black text-muted-foreground/10 select-none">{step.id}</span>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors uppercase tracking-tight">
                                        {step.title}
                                    </h3>
                                    <p className="text-muted-foreground leading-relaxed font-light">
                                        {step.description}
                                    </p>
                                </div>

                                <div className="flex-1">
                                    {step.visual}
                                </div>

                                <Button
                                    onClick={step.action.onClick}
                                    className="w-full h-14 bg-white/80 hover:bg-white text-foreground border border-white/60 rounded-xl group/btn overflow-hidden relative shadow-sm hover:shadow-md transition-all"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover/btn:animate-shimmer" />
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
                className="flex items-center gap-6 pt-6 opacity-60 group grayscale hover:grayscale-0 transition-all"
            >
                <div className="h-px w-20 bg-gradient-to-r from-transparent to-muted-foreground/30" />
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] font-mono text-muted-foreground whitespace-nowrap">
                    <ShieldCheck className="w-3 h-3 text-primary" />
                    Безопасное соединение активно
                </div>
                <div className="h-px w-20 bg-gradient-to-l from-transparent to-muted-foreground/30" />
            </motion.div>
        </div>
    );
};
