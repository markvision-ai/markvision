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
        { id: 'impressions', label: 'Показы', value: metrics.impressions, icon: Eye, color: 'text-blue-500', border: 'border-blue-100' },
        { id: 'clicks', label: 'Клики', value: metrics.clicks, icon: MousePointer, color: 'text-cyan-500', border: 'border-cyan-100' },
        { id: 'leads', label: 'Лиды', value: metrics.leads, icon: Users, color: 'text-violet-500', border: 'border-violet-100' },
        { id: 'visits', label: 'Диагностика', value: metrics.visits, icon: Target, color: 'text-fuchsia-500', border: 'border-fuchsia-100' },
        { id: 'sales', label: 'Продажи', value: metrics.sales, icon: ShoppingCart, color: 'text-indigo-500', border: 'border-indigo-100' },
        { id: 'profit', label: 'Прибыль', value: metrics.profit, isCurrency: true, icon: Wallet, color: 'text-emerald-500', border: 'border-emerald-100' },
    ];

    const formatValue = (step: any) => {
        if (step.isCurrency) {
            return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(step.value);
        }
        return new Intl.NumberFormat('ru-RU').format(Math.round(step.value));
    };

    return (
        <Card className="bg-white/80 backdrop-blur-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white rounded-[32px] overflow-hidden relative">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                <CardTitle className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                        <TrendingDown className="w-5 h-5 -scale-y-100" />
                    </div>
                    Путь клиента: Показы → Прибыль
                </CardTitle>
            </CardHeader>
            <CardContent className="relative p-8 overflow-x-auto min-h-[300px] flex items-center justify-center">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4 relative min-w-max w-full">
                    {/* Animated Flow Line */}
                    <div className="absolute top-[50%] left-16 right-16 h-1.5 bg-slate-100 hidden lg:block -z-10 translate-y-[-50%] rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-transparent via-primary/40 to-transparent w-1/3"
                            animate={{ x: ['-200%', '300%'] }}
                            transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                        />
                    </div>
                    {steps.map((step, index) => {
                        const nextStep = steps[index + 1];
                        const conversion = nextStep && step.value > 0 ? (nextStep.value / step.value) * 100 : null;
                        return (
                            <div key={step.id} className="flex flex-col lg:flex-row items-center relative group">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileHover={{ y: -5, scale: 1.05 }}
                                    transition={{ delay: index * 0.1, duration: 0.3 }}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-5 rounded-[24px] border bg-white shadow-sm transition-all w-32 h-32 sm:w-36 sm:h-36 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] relative overflow-hidden group border-white/80"
                                    )}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent pointer-events-none" />
                                    <div className={cn("mb-3 p-3 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border bg-white relative z-10 group-hover:scale-110 transition-transform duration-300", step.color, step.border)}>
                                        <step.icon className="w-6 h-6" />
                                    </div>
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1 relative z-10">{step.label}</span>
                                    <span className={cn("font-black tracking-tighter text-foreground relative z-10", step.isCurrency ? "text-base" : "text-xl")}>{formatValue(step)}</span>
                                </motion.div>
                                {index < steps.length - 1 && (
                                    <div className="flex flex-col items-center justify-center py-2 lg:py-0 lg:px-3 z-10">
                                        {conversion !== null && (
                                            <div className="flex flex-col items-center bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
                                                <span className="text-[10px] font-black tracking-wider text-primary">{conversion < 100 ? `${conversion.toFixed(1)}%` : ''}</span>
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
