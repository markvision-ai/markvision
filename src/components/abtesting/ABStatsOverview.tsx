import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { FlaskConical, Play, Users, DollarSign } from 'lucide-react';
import { TestStats, ABTest } from './types';
import { cn } from '@/lib/utils'; // Assuming cn utility exists

interface ABStatsOverviewProps {
    tests: ABTest[];
    stats: TestStats | null;
    loading?: boolean;
}

export const ABStatsOverview: React.FC<ABStatsOverviewProps> = ({ tests, stats, loading }) => {
    const runningTests = tests.filter(t => t.status === 'running').length;

    const statCards = [
        {
            label: "Всего тестов",
            value: tests.length,
            icon: FlaskConical,
            color: "text-primary",
            bg: "bg-primary/10",
            border: "border-primary/20"
        },
        {
            label: "Активных",
            value: runningTests,
            icon: Play,
            color: "text-green-500",
            bg: "bg-green-500/10",
            border: "border-green-500/20"
        },
        {
            label: "Всего лидов",
            value: stats?.totalLeads || 0,
            icon: Users,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20"
        },
        {
            label: "Выручка",
            value: stats?.revenue ? new Intl.NumberFormat('ru-RU').format(stats.revenue) + ' ₽' : '0 ₽',
            icon: DollarSign,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            border: "border-purple-500/20"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {statCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <Card key={index} className="bg-[#020617]/40 backdrop-blur-2xl shadow-interstellar border border-white/10 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">

                        <CardContent className="pt-6 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className={cn("p-3 rounded-xl border transition-all duration-300 group-hover:scale-110", stat.bg, stat.border)}>
                                    <Icon className={cn("w-6 h-6", stat.color)} />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
                                    <p className="text-2xl font-bold font-mono tracking-tight text-foreground">
                                        {loading ? "..." : stat.value}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};
