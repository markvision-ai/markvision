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
            <Card className="bg-white/80 backdrop-blur-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white rounded-[32px] overflow-hidden relative">

                {/* Header */}
                <CardHeader className="relative z-10 bg-slate-50/50 border-b border-slate-100 p-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-100/50 shadow-sm">
                                <Swords className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-black tracking-tight text-foreground uppercase">
                                    {test.name}
                                </CardTitle>
                                <CardDescription className="text-sm font-medium text-muted-foreground mt-0.5 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-blue-400" />
                                    {test.description || 'Оптимизация конверсии'}
                                </CardDescription>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge variant="outline" className="border-purple-200 text-purple-600 bg-purple-50/50 gap-2 px-4 py-2 rounded-full font-bold text-xs">
                                <Zap className="w-3.5 h-3.5" />
                                Достоверность: {reliability.toFixed(1)}%
                            </Badge>

                            {reliability < targetReliability && (
                                <Badge variant="outline" className="border-cyan-200 text-cyan-600 bg-cyan-50/50 gap-2 px-4 py-2 rounded-full font-bold text-xs">
                                    <Clock className="w-3.5 h-3.5" />
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
                    <div className="mt-12 p-8 rounded-[24px] bg-slate-50/50 border border-slate-100 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group/insights">
                        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm relative z-10 text-blue-500">
                            <BrainCircuit className="w-10 h-10" />
                        </div>
                        <div className="flex-1 relative z-10 text-center md:text-left">
                            <h4 className="text-lg font-black text-foreground mb-1 flex items-center justify-center md:justify-start gap-2 uppercase tracking-tight">
                                AI Резюме
                                <Badge className="bg-blue-500 text-white border-none text-[10px] font-bold px-2 h-5">LIVE</Badge>
                            </h4>
                            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                                {reliability >= targetReliability
                                    ? `Эксперимент достиг значимости. Вариант "${leader === 'a' ? test.variant_a_name : test.variant_b_name}" лидирует с приростом ${Math.abs(stats.variantA.conversionRate - stats.variantB.conversionRate).toFixed(1)}%. Можно внедрять.`
                                    : `Слишком малая выборка для финала. Текущая достоверность ${reliability.toFixed(1)}%. Рекомендуем подождать еще ~${daysRemaining} дн. или получить +${leadsRemaining} лидов.`
                                }
                            </p>
                        </div>
                        <Button variant="outline" className="bg-white border-slate-200 hover:bg-slate-50 relative z-10 px-6 py-5 rounded-xl font-bold text-sm">
                            <Info className="w-4 h-4 mr-2" /> Детали отчета
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

const VariantCard = ({ name, type, isLeader, stats, total, opponentStats, color }: any) => {
    const isGreen = isLeader;
    const borderColor = isLeader ? 'border-blue-200' : 'border-slate-100';
    const bgColor = isLeader ? 'bg-blue-50/30' : 'bg-white';
    const shadow = isLeader ? 'shadow-[0_20px_40px_rgba(59,130,246,0.1)]' : 'shadow-sm';

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
                        className="bg-blue-600 text-white p-2.5 rounded-full shadow-lg shadow-blue-500/40"
                    >
                        <Trophy className="w-5 h-5" />
                    </motion.div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                <div>
                    <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-1.5", color === 'blue' ? 'text-blue-500' : 'text-purple-500')}>{type}</p>
                    <h3 className="text-xl font-black text-foreground tracking-tight uppercase">{name}</h3>
                </div>
                {isLeader && (
                    <Badge className="bg-blue-600 text-white border-none font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-tighter">
                        ЛИДЕР
                    </Badge>
                )}
            </div>

            {/* Stats Grid */}
            <div className="space-y-5">

                {/* Conversion Rate */}
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                    <div className="flex justify-between items-end mb-3">
                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Конверсия</span>
                        <div className="text-right">
                            <span className="text-3xl font-black tracking-tighter text-foreground">{cr.toFixed(2)}%</span>
                            {lift !== 0 && (
                                <div className={cn("text-[10px] font-black flex items-center justify-end gap-1 mt-0.5", lift > 0 ? "text-blue-500" : "text-red-500")}>
                                    {lift > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {Math.abs(lift).toFixed(1)}% ПРИРОСТ
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="h-2.5 w-full bg-slate-200/50 rounded-full overflow-hidden relative">
                        {/* Confidence Band Visual */}
                        <div className="absolute inset-0 bg-white/40 animate-pulse" style={{ left: '10%', right: '10%' }} title="Доверительный интервал" />

                        <motion.div
                            className={cn("h-full rounded-full relative overflow-hidden", isLeader ? "bg-blue-600" : (color === 'blue' ? "bg-blue-500" : "bg-purple-500"))}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(cr * 4, 100)}%` }} // Scaling for visual better visible
                            transition={{ duration: 1.2, ease: "circOut" }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
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
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm group-hover:bg-slate-50/50 transition-colors">
        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1.5 opacity-70">{label}</p>
        <p className="text-xl font-black tracking-tight text-foreground">{value} <span className="text-[10px] text-muted-foreground font-bold tracking-normal align-top ml-0.5">{suffix}</span></p>
    </div>
);
