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
            <Card className="bg-white/70 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60">
                <CardContent className="py-12 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <FlaskConical className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-1">Нет тестов</h3>
                    <p className="text-muted-foreground">Создайте свой первый A/B тест, чтобы начать оптимизацию.</p>
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
                        className={cn("cursor-pointer transition-all duration-300", isSelected ? "scale-[1.01]" : "hover:scale-[1.005]")}
                    >
                        <BackgroundGradient containerClassName={isSelected ? "p-[1px]" : "p-0"} className="rounded-xl">
                            <Card className={cn(
                                "bg-white/70 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 transition-colors",
                                isSelected ? "bg-accent/5 ring-1 ring-primary" : "hover:bg-accent/5"
                            )}>
                                <div className="p-5 flex flex-col md:flex-row gap-4 md:items-center justify-between">

                                    {/* Left: Info */}
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className={cn("p-2.5 rounded-lg border", getStatusColor(test.status))}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-foreground text-base mb-1">{test.name}</h4>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge variant="outline" className={cn("text-xs font-normal border-white/50")}>
                                                    {test.test_category}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">{test.description || 'Без описания'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Middle: Stats Preview */}
                                    <div className="flex items-center gap-8 md:px-8 border-l border-white/50 border-r md:border-r-0 md:border-l-0 pl-4 md:pl-0">
                                        <div className="text-center">
                                            <p className="text-[10px] uppercase text-muted-foreground mb-1">Вар. А</p>
                                            <p className="font-mono font-bold text-foreground">{crA.toFixed(1)}%</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] uppercase text-muted-foreground mb-1">Вар. Б</p>
                                            <p className="font-mono font-bold text-foreground">{crB.toFixed(1)}%</p>
                                        </div>
                                        <div className="text-center min-w-[80px]">
                                            <p className="text-[10px] uppercase text-muted-foreground mb-1">Прирост</p>
                                            <Badge variant="outline" className={cn("font-mono border-0", improvement > 0 ? "bg-blue-500/10 text-blue-400" : "bg-red-500/10 text-red-400")}>
                                                {improvement > 0 ? "+" : ""}{improvement.toFixed(1)}%
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                        {test.status === 'running' ? (
                                            <Button size="sm" variant="outline" className="border-white/50 hover:bg-accent" onClick={() => onPause(test.id)}>
                                                <Pause className="w-4 h-4 mr-2" /> Пауза
                                            </Button>
                                        ) : test.status !== 'completed' ? (
                                            <Button size="sm" variant="default" onClick={() => onStart(test.id)}>
                                                <Play className="w-4 h-4 mr-2" /> Запуск
                                            </Button>
                                        ) : (
                                            <Badge variant="outline" className="opacity-50">Завершен</Badge>
                                        )}
                                    </div>

                                </div>
                            </Card>
                        </BackgroundGradient>
                    </div>
                );
            })}
        </div>
    );
};
