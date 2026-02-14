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
        <Card className="bg-card border border-border overflow-hidden shadow-sm relative">
            <CardHeader className="pb-6">
                <CardTitle className="text-lg font-bold text-foreground">
                    Путь клиента: Показы → Прибыль
                </CardTitle>
            </CardHeader>
            <CardContent className="relative">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4 relative">
                    <div className="absolute top-[50%] left-0 right-0 h-px bg-border hidden lg:block -z-10 translate-y-[-50%]" />
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
                                        "flex flex-col items-center justify-center p-4 rounded-xl border border-border transition-all w-28 h-28 sm:w-32 sm:h-32 hover:shadow-md",
                                        step.bg
                                    )}
                                >
                                    <div className={cn("mb-2 p-2 rounded-lg bg-background/80", step.color)}>
                                        <step.icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">{step.label}</span>
                                    <span className={cn("font-bold tracking-tight text-foreground", step.isCurrency ? "text-sm" : "text-lg")}>{formatValue(step)}</span>
                                </motion.div>
                                {index < steps.length - 1 && (
                                    <div className="flex flex-col items-center justify-center py-2 lg:py-0 lg:px-3 z-10">
                                        {conversion !== null && (
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] font-mono text-muted-foreground mb-1">{conversion < 100 ? `${conversion.toFixed(1)}%` : ''}</span>
                                                <ArrowRight className="w-4 h-4 rotate-90 lg:rotate-0 text-muted-foreground" />
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
