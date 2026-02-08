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
        outgoing: 'text-emerald-500',
        missed: 'text-red-500',
    };

    return <span className={colors[type]}>{icons[type]}</span>;
};

const ScoreBadge = ({ score }: { score: number }) => {
    const getColor = () => {
        if (score >= 80) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
        if (score >= 60) return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
        return 'bg-red-500/10 text-red-500 border-red-500/20';
    };

    return (
        <Badge variant="outline" className={cn('gap-1 font-bold', getColor())}>
            <Star className="w-3 h-3" />
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
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <CallTypeIcon type={call.call_type} />
                        Звонок с {call.manager_name}
                    </DialogTitle>
                    <DialogDescription>
                        {format(new Date(call.call_date), 'd MMMM yyyy, HH:mm', { locale: ru })}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Overall Score */}
                    <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Общая оценка ИИ</p>
                                    <p className="text-4xl font-bold">{call.ai_score}</p>
                                </div>
                                <div className="relative w-32 h-32">
                                    <svg className="w-32 h-32 transform -rotate-90">
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="56"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="none"
                                            className="text-muted/20"
                                        />
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="56"
                                            stroke={call.ai_score >= 80 ? 'hsl(var(--success))' : call.ai_score >= 60 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))'}
                                            strokeWidth="8"
                                            fill="none"
                                            strokeDasharray={2 * Math.PI * 56}
                                            strokeDashoffset={2 * Math.PI * 56 * (1 - call.ai_score / 100)}
                                            strokeLinecap="round"
                                            className="transition-all duration-500"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Detailed Scores */}
                    {call.scores && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Детальная оценка</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {Object.entries(call.scores).map(([key, value]) => {
                                    const labels: Record<string, string> = {
                                        greeting: 'Приветствие',
                                        knowledge: 'Знание продукта',
                                        objections: 'Работа с возражениями',
                                        closing: 'Закрытие сделки',
                                        professionalism: 'Профессионализм',
                                    };

                                    return (
                                        <div key={key}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-muted-foreground">{labels[key]}</span>
                                                <span className="font-medium">{value}%</span>
                                            </div>
                                            <Progress value={value} className="h-2" />
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    )}

                    {/* Sentiment Analysis */}
                    {call.sentiment_data && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Анализ тональности</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-3 rounded-lg bg-emerald-500/10">
                                        <p className="text-2xl font-bold text-emerald-500">{call.sentiment_data.positive}%</p>
                                        <p className="text-xs text-muted-foreground mt-1">Позитив</p>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-slate-500/10">
                                        <p className="text-2xl font-bold text-slate-500">{call.sentiment_data.neutral}%</p>
                                        <p className="text-xs text-muted-foreground mt-1">Нейтрально</p>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-red-500/10">
                                        <p className="text-2xl font-bold text-red-500">{call.sentiment_data.negative}%</p>
                                        <p className="text-xs text-muted-foreground mt-1">Негатив</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Recommendations */}
                    {call.recommendations && call.recommendations.length > 0 && (
                        <Card className="border-l-4 border-l-primary">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-primary" />
                                    Рекомендации ИИ
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {call.recommendations.map((rec, idx) => (
                                        <li key={idx} className="flex gap-2 text-sm">
                                            <span className="text-primary mt-1">•</span>
                                            <span>{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}
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
                <Card className={cn(
                    "relative overflow-hidden border-2 transition-all duration-500",
                    "bg-gradient-to-br from-card/50 to-card backdrop-blur-xl border-white/5",
                    "border-cyan-500/50 shadow-lg shadow-cyan-500/20"
                )}>
                    <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-cyan-500 to-emerald-500" />

                    <CardHeader className="relative">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30">
                                    <Phone className="w-6 h-6 text-cyan-500" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl">Аналитика звонков</CardTitle>
                                    <CardDescription>Мониторинг телефонных разговоров с ИИ-анализом</CardDescription>
                                </div>
                            </div>
                            <Button onClick={refresh} variant="outline" size="sm" className="gap-2">
                                <RefreshCw className="w-4 h-4" />
                                Обновить
                            </Button>
                        </div>
                    </CardHeader>
                </Card>
            </motion.div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                >
                    <Card className="bg-gradient-to-br from-card/50 to-card backdrop-blur-xl border-white/5 hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Всего звонков</p>
                                    <p className="text-3xl font-bold">{stats.totalCalls}</p>
                                    <div className="flex gap-2 mt-2 text-xs">
                                        <span className="text-cyan-500">↓ {stats.incomingCalls}</span>
                                        <span className="text-emerald-500">↑ {stats.outgoingCalls}</span>
                                        <span className="text-red-500">✕ {stats.missedCalls}</span>
                                    </div>
                                </div>
                                <Phone className="w-10 h-10 text-primary/30" />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                >
                    <Card className="bg-gradient-to-br from-card/50 to-card backdrop-blur-xl border-white/5 hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Средняя длительность</p>
                                    <p className="text-3xl font-bold">{formatDuration(Math.round(stats.avgDuration))}</p>
                                    <p className="text-xs text-muted-foreground mt-2">минут</p>
                                </div>
                                <Clock className="w-10 h-10 text-cyan-500/30" />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                >
                    <Card className="bg-gradient-to-br from-card/50 to-card backdrop-blur-xl border-white/5 hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Средняя оценка</p>
                                    <p className="text-3xl font-bold">{Math.round(stats.avgScore)}</p>
                                    <div className="flex items-center gap-1 mt-2">
                                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                        <span className="text-xs text-muted-foreground">из 100</span>
                                    </div>
                                </div>
                                <BarChart3 className="w-10 h-10 text-emerald-500/30" />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                >
                    <Card className="bg-gradient-to-br from-card/50 to-card backdrop-blur-xl border-white/5 hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Конверсия</p>
                                    <p className="text-3xl font-bold">{stats.conversionRate}%</p>
                                    <div className="flex items-center gap-1 mt-2 text-emerald-500">
                                        <TrendingUp className="w-3 h-3" />
                                        <span className="text-xs">+5% за неделю</span>
                                    </div>
                                </div>
                                <TrendingUp className="w-10 h-10 text-emerald-500/30" />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Calls Table */}
            <Card className="bg-gradient-to-br from-card/50 to-card backdrop-blur-xl border-white/5">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>История звонков</CardTitle>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="gap-2">
                                <Filter className="w-4 h-4" />
                                Фильтры
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Download className="w-4 h-4" />
                                Экспорт
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <AnimatePresence>
                            {calls.map((call, index) => (
                                <motion.div
                                    key={call.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                >
                                    <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer bg-gradient-to-r from-card/50 to-transparent border-l-4 border-l-transparent hover:border-l-primary"
                                        onClick={() => handleViewCall(call)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <CallTypeIcon type={call.call_type} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium truncate">{call.manager_name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {format(new Date(call.call_date), 'd MMM, HH:mm', { locale: ru })}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    {call.duration > 0 && (
                                                        <div className="text-center">
                                                            <p className="text-sm font-medium">{formatDuration(call.duration)}</p>
                                                            <p className="text-xs text-muted-foreground">длительность</p>
                                                        </div>
                                                    )}

                                                    {call.ai_score > 0 ? (
                                                        <ScoreBadge score={call.ai_score} />
                                                    ) : (
                                                        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                                                            Пропущен
                                                        </Badge>
                                                    )}

                                                    <Button variant="ghost" size="sm" className="gap-2">
                                                        <MessageSquare className="w-4 h-4" />
                                                        Детали
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
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
