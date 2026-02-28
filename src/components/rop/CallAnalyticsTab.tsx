import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Phone,
    PhoneIncoming,
    PhoneOutgoing,
    PhoneMissed,
    Clock,
    TrendingUp,
    TrendingDown,
    Play,
    RefreshCw,
    Filter,
    Download,
    BarChart3,
    MessageSquare,
    Star,
    AlertCircle,
    CheckCircle2,
    Zap,
    XCircle,
    ArrowUpRight,
} from 'lucide-react';
import { useCallAnalytics, CallAnalytic } from '@/hooks/useCallAnalytics';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface CallAnalyticsTabProps {
    projectId: string | null;
}

const CallTypeIcon = ({ type }: { type: 'incoming' | 'outgoing' | 'missed' }) => {
    const icons = {
        incoming: <PhoneIncoming className="w-4 h-4" />,
        outgoing: <PhoneOutgoing className="w-4 h-4" />,
        missed: <PhoneMissed className="w-4 h-4" />,
    };

    const colors = {
        incoming: 'text-cyan-500',
        outgoing: 'text-blue-500',
        missed: 'text-red-500',
    };

    return <span className={colors[type]}>{icons[type]}</span>;
};

const ScoreBadge = ({ score }: { score: number }) => {
    const getColor = () => {
        if (score >= 80) return 'bg-emerald-50 text-emerald-600 border-emerald-100/50';
        if (score >= 60) return 'bg-amber-50 text-amber-600 border-amber-100/50';
        return 'bg-rose-50 text-rose-600 border-rose-100/50';
    };

    return (
        <Badge variant="outline" className={cn('gap-1.5 font-black uppercase tracking-widest text-[10px] px-2.5 py-1 rounded-full shadow-sm', getColor())}>
            <Star className="w-3 h-3 fill-current" />
            {score}
        </Badge>
    );
};

const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const CallDetailsModal = ({ call, open, onClose }: { call: CallAnalytic; open: boolean; onClose: () => void }) => {
    if (!call) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-white/80 bg-white/10 backdrop-blur-3xl shadow-2xl rounded-[40px] p-0 overflow-hidden">
                <div className="p-8 border-b border-slate-50 bg-white/5/30">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-4 text-2xl font-black uppercase tracking-tight">
                            <div className="p-3 rounded-2xl bg-white shadow-sm border border-slate-100">
                                <CallTypeIcon type={call.call_type} />
                            </div>
                            Звонок с {call.manager_name}
                        </DialogTitle>
                        <DialogDescription className="text-xs font-black uppercase tracking-widest opacity-40 mt-1">
                            {format(new Date(call.call_date), 'd MMMM yyyy, HH:mm', { locale: ru })}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-8 space-y-8">
                    {/* Overall Score */}
                    <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 border-0 rounded-[32px] overflow-hidden shadow-xl relative group">
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent" />
                        <CardContent className="pt-10 pb-10 px-8 relative z-10">
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Общая оценка ИИ</p>
                                    <p className="text-7xl font-black text-white tracking-tighter">{call.ai_score}</p>
                                    <div className="flex gap-2 items-center bg-white/10 w-fit px-3 py-1 rounded-full border border-white/10 backdrop-blur-md mt-4">
                                        <Zap className="w-3 h-3 text-yellow-300" />
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Анализ завершен</span>
                                    </div>
                                </div>
                                <div className="relative w-40 h-40 group-hover:scale-110 transition-transform duration-700">
                                    <svg className="w-40 h-40 transform -rotate-90">
                                        <circle
                                            cx="80"
                                            cy="80"
                                            r="70"
                                            stroke="rgba(255,255,255,0.1)"
                                            strokeWidth="12"
                                            fill="none"
                                        />
                                        <circle
                                            cx="80"
                                            cy="80"
                                            r="70"
                                            stroke="white"
                                            strokeWidth="12"
                                            fill="none"
                                            strokeDasharray={2 * Math.PI * 70}
                                            strokeDashoffset={2 * Math.PI * 70 * (1 - call.ai_score / 100)}
                                            strokeLinecap="round"
                                            className="transition-all duration-1000"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Star className="w-10 h-10 text-white fill-white opacity-20" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Detailed Scores */}
                        {call.scores && (
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 px-1">Метрики качества</h4>
                                <Card className="bg-white/5/50 border-slate-100 rounded-[32px] p-6 space-y-5">
                                    {Object.entries(call.scores).map(([key, value]) => {
                                        const labels: Record<string, string> = {
                                            greeting: 'Приветствие',
                                            knowledge: 'Знание продукта',
                                            objections: 'Работа с возражениями',
                                            closing: 'Закрытие сделки',
                                            professionalism: 'Профессионализм',
                                        };

                                        return (
                                            <div key={key} className="space-y-2">
                                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                                    <span className="text-muted-foreground">{labels[key]}</span>
                                                    <span className="text-foreground">{value}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-white/20/50 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${value}%` }}
                                                        transition={{ duration: 1, ease: "easeOut" }}
                                                        className="h-full bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </Card>
                            </div>
                        )}

                        {/* Sentiment Analysis */}
                        {call.sentiment_data && (
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 px-1">Тональность диалога</h4>
                                <Card className="bg-white/5/50 border-slate-100 rounded-[32px] p-6">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center p-5 rounded-2xl bg-white border border-emerald-50 shadow-sm relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <p className="text-2xl font-black text-emerald-600 tracking-tighter">{call.sentiment_data.positive}%</p>
                                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-1">Позитив</p>
                                        </div>
                                        <div className="text-center p-5 rounded-2xl bg-white border border-slate-50 shadow-sm relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-white/50/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <p className="text-2xl font-black text-slate-500 tracking-tighter">{call.sentiment_data.neutral}%</p>
                                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-1">Нейтрал</p>
                                        </div>
                                        <div className="text-center p-5 rounded-2xl bg-white border border-rose-50 shadow-sm relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <p className="text-2xl font-black text-rose-600 tracking-tighter">{call.sentiment_data.negative}%</p>
                                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-1">Негатив</p>
                                        </div>
                                    </div>

                                    {/* Recommendations */}
                                    {call.recommendations && call.recommendations.length > 0 && (
                                        <div className="mt-8 space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                                                <Zap className="w-3 h-3 text-blue-600" /> Рекомендации
                                            </h4>
                                            <ul className="space-y-3">
                                                {call.recommendations.map((rec, idx) => (
                                                    <li key={idx} className="flex gap-3 text-xs font-black uppercase tracking-tighter text-foreground p-3 bg-white rounded-xl border border-slate-50 leading-tight">
                                                        <span className="text-blue-600 mt-0.5">•</span>
                                                        <span>{rec}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </Card>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export const CallAnalyticsTab: React.FC<CallAnalyticsTabProps> = ({ projectId }) => {
    const { calls, stats, loading, refresh } = useCallAnalytics(projectId);
    const [selectedCall, setSelectedCall] = useState<CallAnalytic | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    const handleViewCall = (call: CallAnalytic) => {
        setSelectedCall(call);
        setDetailsOpen(true);
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-6">
                                <div className="h-16 bg-muted rounded" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-[20px] bg-white border border-slate-100 shadow-sm relative group overflow-hidden">
                            <div className="absolute inset-0 bg-blue-500/10 rounded-[20px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Phone className="w-8 h-8 text-blue-600 relative z-10 group-hover:scale-110 transition-transform" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Аналитика звонков</h2>
                            <p className="text-xs font-medium uppercase tracking-widest opacity-40 mt-1">Мониторинг телефонных разговоров с глубоким ИИ-анализом</p>
                        </div>
                    </div>
                    <Button onClick={refresh} variant="outline" size="lg" className="rounded-2xl border-slate-200 bg-white/50 shadow-sm gap-2 font-black uppercase tracking-widest text-[10px] px-6 py-6 h-auto hover:bg-white transition-all">
                        <RefreshCw className="w-4 h-4 text-blue-600" />
                        Обновить базу
                    </Button>
                </div>
            </motion.div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                >
                    <Card className="bg-white/10 backdrop-blur-3xl shadow-sm border border-white rounded-[28px] overflow-hidden group hover:shadow-xl transition-all duration-500">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Всего звонков</p>
                                    <p className="text-3xl font-black text-foreground tracking-tighter">{stats.totalCalls}</p>
                                    <div className="flex gap-3 mt-2 text-[8px] font-black uppercase tracking-widest">
                                        <span className="text-emerald-500 flex items-center gap-1"><PhoneIncoming className="w-2.5 h-2.5" /> {stats.incomingCalls}</span>
                                        <span className="text-blue-500 flex items-center gap-1"><PhoneOutgoing className="w-2.5 h-2.5" /> {stats.outgoingCalls}</span>
                                        <span className="text-rose-500 flex items-center gap-1"><XCircle className="w-2.5 h-2.5" /> {stats.missedCalls}</span>
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-slate-100 group-hover:rotate-6 transition-transform">
                                    <Phone className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                >
                    <Card className="bg-white/10 backdrop-blur-3xl shadow-sm border border-white rounded-[28px] overflow-hidden group hover:shadow-xl transition-all duration-500">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Среднее время</p>
                                    <p className="text-3xl font-black text-foreground tracking-tighter">{formatDuration(Math.round(stats.avgDuration))}</p>
                                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-2 flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> Минуты диалога</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-slate-100 group-hover:rotate-6 transition-transform text-indigo-600">
                                    <Clock className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                >
                    <Card className="bg-white/10 backdrop-blur-3xl shadow-sm border border-white rounded-[28px] overflow-hidden group hover:shadow-xl transition-all duration-500">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Средний балл</p>
                                    <p className="text-3xl font-black text-foreground tracking-tighter">{Math.round(stats.avgScore)}</p>
                                    <div className="flex items-center gap-1 mt-2">
                                        <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Макс 100 по ИИ</span>
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 group-hover:rotate-6 transition-transform text-amber-600">
                                    <BarChart3 className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                >
                    <Card className="bg-white/10 backdrop-blur-3xl shadow-sm border border-white rounded-[28px] overflow-hidden group hover:shadow-xl transition-all duration-500">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Конверсия</p>
                                    <p className="text-3xl font-black text-foreground tracking-tighter">{stats.conversionRate}%</p>
                                    <div className="flex items-center gap-1 mt-2 text-emerald-600">
                                        <TrendingUp className="w-3 h-3" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">+5% На этой неделе</span>
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 group-hover:rotate-6 transition-transform text-emerald-600">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Calls Table */}
            <Card className="bg-white/10 backdrop-blur-3xl shadow-sm border border-white rounded-[32px] overflow-hidden">
                <div className="p-6 border-b border-slate-50 bg-white/5/30">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <h3 className="text-lg font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                            <span className="opacity-40">📜</span> История звонков
                        </h3>
                        <div className="flex gap-3">
                            <Button variant="outline" size="lg" className="h-10 rounded-xl gap-2 font-black uppercase tracking-widest text-[8px] px-4 border-slate-200">
                                <Filter className="w-3 h-3" />
                                Фильтрация
                            </Button>
                            <Button variant="outline" size="lg" className="h-10 rounded-xl gap-2 font-black uppercase tracking-widest text-[8px] px-4 border-slate-200">
                                <Download className="w-3 h-3" />
                                Выгрузить CSV
                            </Button>
                        </div>
                    </div>
                </div>
                <CardContent className="p-6">
                    <div className="space-y-3">
                        <AnimatePresence>
                            {calls.map((call, index) => (
                                <motion.div
                                    key={call.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                >
                                    <div
                                        className="group p-5 rounded-[24px] border border-slate-100 hover:border-blue-200 hover:bg-white/5/50 transition-all duration-300 cursor-pointer flex items-center justify-between gap-6"
                                        onClick={() => handleViewCall(call)}
                                    >
                                        <div className="flex items-center gap-5 flex-1 min-w-0">
                                            <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-sm group-hover:scale-110 transition-transform">
                                                <CallTypeIcon type={call.call_type} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-sm text-foreground uppercase tracking-tighter">{call.manager_name}</p>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 opacity-60">
                                                    {format(new Date(call.call_date), 'd MMMM, HH:mm', { locale: ru })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8">
                                            {call.duration > 0 && (
                                                <div className="text-right hidden sm:block">
                                                    <p className="text-xs font-black text-foreground uppercase tracking-widest">{formatDuration(call.duration)}</p>
                                                    <p className="text-[8px] font-black text-muted-foreground uppercase mt-0.5 opacity-40">Длительность</p>
                                                </div>
                                            )}

                                            <div className="min-w-[100px] flex justify-end">
                                                {call.ai_score > 0 ? (
                                                    <ScoreBadge score={call.ai_score} />
                                                ) : (
                                                    <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-100/50 text-[8px] font-black uppercase tracking-widest rounded-full py-1">
                                                        Пропущен
                                                    </Badge>
                                                )}
                                            </div>

                                            <Button variant="ghost" size="icon" className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-100 shadow-sm">
                                                <ArrowUpRight className="w-4 h-4 text-blue-600" />
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </CardContent>
            </Card>

            {/* Call Details Modal */}
            {selectedCall && (
                <CallDetailsModal
                    call={selectedCall}
                    open={detailsOpen}
                    onClose={() => setDetailsOpen(false)}
                />
            )}
        </div>
    );
};

export default CallAnalyticsTab;
