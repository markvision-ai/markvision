import { motion } from 'framer-motion';
import { Eye, MousePointer, Users, Target, ShoppingCart, Wallet, ArrowRight, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CustomerJourneyFlowProps {
    metrics: {
        impressions: number;
        clicks: number;
        leads: number;
        visits: number;
        sales: number;
        revenue: number;
        profit: number;
    };
}

export const CustomerJourneyFlow = ({ metrics }: CustomerJourneyFlowProps) => {
    const steps = [
        { id: 'impressions', label: 'Показы', value: metrics.impressions, icon: Eye, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
        { id: 'clicks', label: 'Клики', value: metrics.clicks, icon: MousePointer, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
        { id: 'leads', label: 'Лиды', value: metrics.leads, icon: Users, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
        { id: 'visits', label: 'Диагностика', value: metrics.visits, icon: Target, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/20' },
        { id: 'sales', label: 'Продажи', value: metrics.sales, icon: ShoppingCart, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
        { id: 'profit', label: 'Прибыль', value: metrics.profit, isCurrency: true, icon: Wallet, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    ];

    const formatValue = (step: any) => {
        if (step.isCurrency) {
            return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(step.value);
        }
        return new Intl.NumberFormat('ru-RU').format(Math.round(step.value));
    };

    return (
        <Card className="interstellar-glass overflow-hidden border-white/5 shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            <CardHeader className="pb-8">
                <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                    Путь клиента: Impression → Profit
                </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4 relative">
                    <div className="absolute top-[50%] left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent hidden lg:block -z-10 translate-y-[-50%]" />
                    {steps.map((step, index) => {
                        const nextStep = steps[index + 1];
                        const conversion = nextStep && step.value > 0 ? (nextStep.value / step.value) * 100 : null;
                        return (
                            <div key={step.id} className="flex flex-col lg:flex-row items-center relative group">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-4 rounded-2xl border backdrop-blur-md transition-all duration-300 w-32 h-32 hover:scale-105 hover:shadow-lg hover:shadow-primary/5",
                                        step.border, step.bg
                                    )}
                                >
                                    <div className={cn("mb-2 p-2 rounded-lg bg-white/5", step.color)}>
                                        <step.icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">{step.label}</span>
                                    <span className={cn("font-bold tracking-tight", step.isCurrency ? "text-sm" : "text-xl")}>{formatValue(step)}</span>
                                </motion.div>
                                {index < steps.length - 1 && (
                                    <div className="flex flex-col items-center justify-center py-2 lg:py-0 lg:px-4 text-muted-foreground/50 z-10">
                                        {conversion !== null && (
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] font-mono text-muted-foreground mb-1">{conversion < 100 ? `${conversion.toFixed(1)}%` : ''}</span>
                                                <ArrowRight className="w-4 h-4 rotate-90 lg:rotate-0 text-white/20 group-hover:text-white/50 transition-colors" />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};
