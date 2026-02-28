import React from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, TrendingUp, TrendingDown, Globe, Video, Type, Users, FlaskConical } from 'lucide-react';
import { ABTest } from './types';
import { cn } from '@/lib/utils';
import { BackgroundGradient } from '@/components/ui/background-gradient';

interface ABTestListProps {
    tests: ABTest[];
    onStart: (id: string) => void;
    onPause: (id: string) => void;
    onSelect: (id: string) => void;
    selectedTestId: string | null;
}

export const ABTestList: React.FC<ABTestListProps> = ({ tests, onStart, onPause, onSelect, selectedTestId }) => {
    const getIcon = (category: string) => {
        switch (category) {
            case 'creative': return Video;
            case 'copy': return Type;
            case 'audience': return Users;
            default: return Globe;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'running': return "text-green-500 bg-green-500/10 border-green-500/20";
            case 'paused': return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
            case 'completed': return "text-blue-500 bg-blue-500/10 border-blue-500/20";
            default: return "text-muted-foreground bg-muted/20 border-white/50";
        }
    };

    if (tests.length === 0) {
        return (
            <Card className="bg-white/80 backdrop-blur-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white rounded-[32px]">
                <CardContent className="py-16 text-center flex flex-col items-center justify-center">
                    <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 shadow-sm">
                        <FlaskConical className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-black text-foreground mb-2 uppercase tracking-tight">Нет активных тестов</h3>
                    <p className="text-muted-foreground font-medium max-w-sm">
                        Создайте свой первый A/B тест, чтобы начать высокотехнологичную оптимизацию конверсии.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {tests.map((test) => {
                const Icon = getIcon(test.test_category);
                const isSelected = test.id === selectedTestId;

                // Simple CR calc for list view
                const visitorsA = test.variant_a_visitors || 0;
                const convA = test.variant_a_conversions || 0;
                const crA = visitorsA > 0 ? (convA / visitorsA) * 100 : 0;

                const visitorsB = test.variant_b_visitors || 0;
                const convB = test.variant_b_conversions || 0;
                const crB = visitorsB > 0 ? (convB / visitorsB) * 100 : 0;

                const improvement = crB - crA;

                return (
                    <div
                        key={test.id}
                        onClick={() => onSelect(test.id)}
                        className={cn("cursor-pointer transition-all duration-500", isSelected ? "scale-[1.02]" : "hover:scale-[1.01]")}
                    >
                        <Card className={cn(
                            "bg-white/80 backdrop-blur-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white rounded-[24px] transition-all duration-500 overflow-hidden relative",
                            isSelected ? "ring-2 ring-blue-500/50 shadow-[0_20px_40px_rgba(59,130,246,0.15)]" : "hover:shadow-[0_15px_35px_rgba(0,0,0,0.08)]"
                        )}>
                            {isSelected && (
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/5 to-transparent pointer-events-none" />
                            )}
                            <div className="p-5 flex flex-col md:flex-row gap-4 md:items-center justify-between">

                                {/* Left: Info */}
                                <div className="flex items-center gap-5 flex-1">
                                    <div className={cn("p-3.5 rounded-2xl border transition-colors duration-500", getStatusColor(test.status))}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-foreground text-lg mb-1 uppercase tracking-tight">{test.name}</h4>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <Badge variant="outline" className="text-[10px] font-black border-slate-200 text-muted-foreground uppercase tracking-widest px-2 py-0.5 rounded-md">
                                                {test.test_category}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground font-medium">{test.description || 'Оптимизация трафика'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Middle: Stats Preview */}
                                <div className="flex items-center gap-10 px-8 py-2 md:border-x border-slate-100">
                                    <div className="text-center group-hover:scale-105 transition-transform">
                                        <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1.5 opacity-60">A</p>
                                        <p className="font-black text-xl tracking-tighter text-foreground">{crA.toFixed(1)}%</p>
                                    </div>
                                    <div className="text-center group-hover:scale-105 transition-transform">
                                        <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1.5 opacity-60">B</p>
                                        <p className="font-black text-xl tracking-tighter text-foreground">{crB.toFixed(1)}%</p>
                                    </div>
                                    <div className="text-center min-w-[100px] h-full flex flex-col justify-center">
                                        <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-2 opacity-60">Lift</p>
                                        <Badge variant="outline" className={cn("font-black border-none text-xs rounded-full px-3 py-1", improvement > 0 ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "bg-red-500 text-white shadow-lg shadow-red-500/30")}>
                                            {improvement > 0 ? "+" : ""}{improvement.toFixed(1)}%
                                        </Badge>
                                    </div>
                                </div>

                                {/* Right: Actions */}
                                <div className="flex items-center gap-3 pl-4" onClick={(e) => e.stopPropagation()}>
                                    {test.status === 'running' ? (
                                        <Button size="sm" variant="outline" className="border-slate-200 hover:bg-slate-50 font-bold px-4 py-5 rounded-xl h-auto" onClick={() => onPause(test.id)}>
                                            <Pause className="w-4 h-4 mr-2" /> Стоп
                                        </Button>
                                    ) : test.status !== 'completed' ? (
                                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-5 rounded-xl h-auto shadow-md" onClick={() => onStart(test.id)}>
                                            <Play className="w-4 h-4 mr-2" /> Старт
                                        </Button>
                                    ) : (
                                        <Badge variant="outline" className="font-black text-[10px] uppercase tracking-widest opacity-40 bg-slate-50 border-slate-200 px-3 py-1.5 rounded-lg">
                                            АРХИВ
                                        </Badge>
                                    )}
                                </div>

                            </div>
                        </Card>
                    </div>
                );
            })}
        </div>
    );
};
