import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Swords, Trophy, TrendingUp, TrendingDown, Target, Zap, Clock, Info, BrainCircuit } from 'lucide-react';
import { ABTest, TestStats } from './types';
import { cn } from '@/lib/utils';
import { BackgroundGradient } from '@/components/ui/background-gradient';

interface ABBattleViewProps {
    test: ABTest;
    stats: TestStats;
}

export const ABBattleView: React.FC<ABBattleViewProps> = ({ test, stats }) => {
    const valA = stats.variantA.conversionRate;
    const valB = stats.variantB.conversionRate;
    const leader = valA > valB ? 'a' : valB > valA ? 'b' : null;

    // --- Statistical Logic ---
    const calculateReliability = (vA: any, vB: any) => {
        if (vA.leads < 10 || vB.leads < 10) return 30; // Min sample base
        const p1 = vA.conversionRate / 100;
        const p2 = vB.conversionRate / 100;
        const n1 = vA.leads;
        const n2 = vB.leads;

        const pooledP = (vA.conversions + vB.conversions) / (n1 + n2);
        if (pooledP === 0 || pooledP === 1) return 50;

        const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / n1 + 1 / n2));
        const z = Math.abs(p1 - p2) / se;

        // Approx confidence
        if (z > 2.58) return 99;
        if (z > 1.96) return 95;
        if (z > 1.64) return 90;
        if (z > 1.28) return 80;
        return Math.min(75, 50 + z * 20);
    };

    const reliability = calculateReliability(stats.variantA, stats.variantB);

    // Estimated time to significance (simplified)
    const targetReliability = test.auto_winner_threshold || 95;
    const leadsRemaining = reliability < targetReliability
        ? Math.ceil((targetReliability - reliability) * 15) // Rough heuristic for needed leads
        : 0;

    // Assume average speed 10 leads/day if not detectable
    const daysRemaining = Math.max(1, Math.ceil(leadsRemaining / 10));

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'running':
                return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 animate-pulse">АКТИВНЫЙ ТЕСТ</Badge>;
            case 'paused':
                return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">НА ПАУЗЕ</Badge>;
            case 'completed':
                return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">ЗАВЕРШЕН</Badge>;
            default:
                return <Badge variant="secondary">ЧЕРНОВИК</Badge>;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
        >
            <BackgroundGradient className="rounded-3xl p-[1px]">
                <Card className="border-0 bg-card shadow-2xl shadow-blue-900/5 rounded-3xl overflow-hidden relative">

                    {/* Header */}
                    <CardHeader className="relative z-10 border-b border-white/50 pb-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-2xl flex items-center gap-3 text-foreground">
                                    <Swords className="w-6 h-6 text-primary" />
                                    <span className="text-foreground font-bold">
                                        {test.name}
                                    </span>
                                </CardTitle>
                                <CardDescription className="text-muted-foreground mt-1 flex items-center gap-2">
                                    <Target className="w-4 h-4" />
                                    {test.description || 'Оптимизация конверсии'}
                                </CardDescription>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                {/* AI Score Badge */}
                                <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/10 gap-1.5 px-3 py-1">
                                    <Zap className="w-4 h-4" />
                                    Достоверность: {reliability.toFixed(1)}%
                                </Badge>

                                {reliability < targetReliability && (
                                    <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10 gap-1.5 px-3 py-1">
                                        <Clock className="w-4 h-4" />
                                        ~{daysRemaining} дн. до финала
                                    </Badge>
                                )}

                                {getStatusBadge(test.status)}
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-6 md:p-8 relative">
                        {/* Background VS Logo */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block pointer-events-none z-0 opacity-20">
                            <motion.div
                                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className="text-[120px] font-black text-muted/20"
                            >
                                VS
                            </motion.div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 relative z-10">

                            {/* VARIANT A */}
                            <VariantCard
                                name={test.variant_a_name}
                                type="Контроль"
                                isLeader={leader === 'a'}
                                stats={stats.variantA}
                                total={stats.totalLeads}
                                opponentStats={stats.variantB}
                                color="blue"
                            />

                            {/* VS Divider Mobile */}
                            <div className="md:hidden flex items-center justify-center py-2">
                                <span className="text-xl font-bold text-muted-foreground/50">ПРОТИВ</span>
                            </div>

                            {/* VARIANT B */}
                            <VariantCard
                                name={test.variant_b_name}
                                type="Вариант"
                                isLeader={leader === 'b'}
                                stats={stats.variantB}
                                total={stats.totalLeads}
                                opponentStats={stats.variantA}
                                color="purple"
                            />

                        </div>

                        {/* AI INSIGHTS FOOTER */}
                        <div className="mt-12 p-6 rounded-2xl bg-muted/30 border border-white/50 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden group/insights">
                            <div className="absolute inset-0 bg-background/50 translate-x-full group-hover/insights:translate-x-0 transition-transform duration-1000" />
                            <div className="p-4 rounded-full bg-background border border-white/50 relative z-10">
                                <BrainCircuit className="w-8 h-8 text-primary" />
                            </div>
                            <div className="flex-1 relative z-10 text-center md:text-left">
                                <h4 className="text-foreground font-bold mb-1 flex items-center justify-center md:justify-start gap-2">
                                    AI Recommendation
                                    <Badge className="bg-primary/20 text-primary border-primary/20 text-[10px] py-0">LIVE FEED</Badge>
                                </h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {reliability >= targetReliability
                                        ? `Эксперимент достиг значимости. Вариант "${leader === 'a' ? test.variant_a_name : test.variant_b_name}" лидирует с приростом ${Math.abs(stats.variantA.conversionRate - stats.variantB.conversionRate).toFixed(1)}%. Можно внедрять.`
                                        : `Слишком малая выборка для финала. Текущая достоверность ${reliability.toFixed(1)}%. Рекомендуем подождать еще ~${daysRemaining} дн. или получить +${leadsRemaining} лидов.`
                                    }
                                </p>
                            </div>
                            <Button variant="outline" className="border-white/50 hover:bg-accent relative z-10">
                                <Info className="w-4 h-4 mr-2" /> Детали отчета
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </BackgroundGradient>
        </motion.div>
    );
};

const VariantCard = ({ name, type, isLeader, stats, total, opponentStats, color }: any) => {
    const isGreen = isLeader;
    const borderColor = isLeader ? 'border-blue-500/50' : 'border-white/50';
    const bgColor = isLeader ? 'bg-blue-500/5' : 'bg-card';
    const shadow = isLeader ? 'shadow-[0_0_30px_-5px_rgba(16,185,129,0.2)]' : '';

    // Lift calculation
    const cr = stats.conversionRate;
    const oppCr = opponentStats.conversionRate;
    const lift = oppCr > 0 ? ((cr - oppCr) / oppCr) * 100 : 0;

    return (
        <motion.div
            className={cn(
                "relative p-6 rounded-2xl border transition-all duration-500 flex flex-col gap-6 group",
                borderColor, bgColor, shadow
            )}
            whileHover={{ scale: 1.01 }}
        >
            {isLeader && (
                <div className="absolute -top-3 -right-3 z-20">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-blue-500 text-white p-2 rounded-full shadow-2xl shadow-blue-900/5 shadow-blue-500/40"
                    >
                        <Trophy className="w-5 h-5" />
                    </motion.div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/50 pb-4">
                <div>
                    <p className={cn("text-xs font-bold uppercase tracking-widest mb-1", color === 'blue' ? 'text-blue-500' : 'text-purple-500')}>{type}</p>
                    <h3 className="text-xl font-bold text-foreground tracking-tight">{name}</h3>
                </div>
                {isLeader && (
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        ЛИДИРУЕТ
                    </Badge>
                )}
            </div>

            {/* Stats Grid */}
            <div className="space-y-5">

                {/* Conversion Rate */}
                <div>
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-sm text-muted-foreground font-medium">Конверсия</span>
                        <div className="text-right">
                            <span className="text-2xl font-bold font-mono text-foreground">{cr.toFixed(2)}%</span>
                            {lift !== 0 && (
                                <div className={cn("text-xs font-bold flex items-center justify-end gap-1", lift > 0 ? "text-blue-400" : "text-red-400")}>
                                    {lift > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {Math.abs(lift).toFixed(1)}% Прирост
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden relative">
                        {/* Confidence Band Visual */}
                        <div className="absolute inset-0 bg-background/50 animate-pulse" style={{ left: '10%', right: '10%' }} title="Доверительный интервал" />

                        <motion.div
                            className={cn("h-full rounded-full relative overflow-hidden", isLeader ? "bg-blue-500" : (color === 'blue' ? "bg-blue-500" : "bg-purple-500"))}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(cr * 4, 100)}%` }} // Scaling for visual better visible
                            transition={{ duration: 1, delay: 0.2 }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                        </motion.div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <StatBox label="Лиды" value={stats.leads} />
                    <StatBox label="Выручка" value={new Intl.NumberFormat('ru-RU', { notation: "compact" }).format(stats.revenue)} suffix="₽" />
                </div>

            </div>

        </motion.div>
    );
};

const StatBox = ({ label, value, suffix }: any) => (
    <div className="bg-muted/30 rounded-xl p-3 border border-white/50">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
        <p className="text-lg font-bold font-mono text-foreground">{value} <span className="text-sm text-muted-foreground font-normal">{suffix}</span></p>
    </div>
);
