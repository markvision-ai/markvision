import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { subDays, format } from 'date-fns';
import { KZT_RATE } from '@/constants/ads';

interface PlatformSpendChartProps {
  projectId: string;
}

interface DailyDataWithPlatforms {
  date: string;
  spend_fb: number;
  spend_google: number;
  spend_tiktok: number;
  spend: number;
}

const PLATFORM_CONFIG = {
  facebook: { color: '#3b82f6', label: 'Meta Ads', icon: '📘', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  google: { color: '#ef4444', label: 'Google Ads', icon: '🔍', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  tiktok: { color: '#000000', label: 'TikTok Ads', icon: '🎵', bg: 'bg-gray-500/10', border: 'border-gray-500/20' },
  other: { color: '#8b5cf6', label: 'Прочие', icon: '⚡', bg: 'bg-violet-500/10', border: 'border-violet-500/20' }
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
};

export const PlatformSpendChart = ({ projectId }: PlatformSpendChartProps) => {
  const [data, setData] = useState<DailyDataWithPlatforms[]>([]);
  const [metaSpendFromLogs, setMetaSpendFromLogs] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) return;
      try {
        const dateFrom = format(subDays(new Date(), 90), 'yyyy-MM-dd');

        const [dailyResult, logsResult] = await Promise.all([
          supabase
            .from('daily_data')
            .select('date, spend, spend_fb, spend_google, spend_tiktok')
            .eq('project_id', projectId)
            .gte('date', dateFrom)
            .order('date', { ascending: false }),

          supabase
            .from('ad_performance_logs')
            .select('date_start, entity_id, spend')
            .eq('project_id', projectId)
            .gte('date_start', dateFrom)
        ]);

        if (dailyResult.error) throw dailyResult.error;
        setData(dailyResult.data || []);

        if (!logsResult.error && logsResult.data?.length) {
          const uniqueByEntityDate: Record<string, number> = {};
          logsResult.data.forEach((row: { date_start: string; entity_id: string; spend: number | null }) => {
            const key = `${row.entity_id}_${row.date_start}`;
            const spend = Number(row.spend) || 0;
            if (!uniqueByEntityDate[key] || spend > uniqueByEntityDate[key]) {
              uniqueByEntityDate[key] = spend;
            }
          });
          const totalMetaUsd = Object.values(uniqueByEntityDate).reduce((s, v) => s + v, 0);
          setMetaSpendFromLogs(Math.round(totalMetaUsd * KZT_RATE));
        } else {
          setMetaSpendFromLogs(0);
        }
      } catch (error) {
        console.error('Error fetching platform spend:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  const platformTotals = useMemo(() => {
    const fromDaily = data.reduce(
      (acc, day) => ({
        google: acc.google + (day.spend_google || 0),
        tiktok: acc.tiktok + (day.spend_tiktok || 0),
        total: acc.total + (day.spend || 0)
      }),
      { google: 0, tiktok: 0, total: 0 }
    );

    const facebook = metaSpendFromLogs > 0 ? metaSpendFromLogs : data.reduce((s, day) => s + (day.spend_fb || 0), 0);
    const knownSpend = facebook + fromDaily.google + fromDaily.tiktok;
    const other = Math.max(0, fromDaily.total - knownSpend);

    return [
      { name: 'Meta Ads', key: 'facebook', value: Math.round(facebook), ...PLATFORM_CONFIG.facebook },
      { name: 'Google', key: 'google', value: Math.round(fromDaily.google), ...PLATFORM_CONFIG.google },
      { name: 'TikTok', key: 'tiktok', value: Math.round(fromDaily.tiktok), ...PLATFORM_CONFIG.tiktok },
      { name: 'Прочие', key: 'other', value: Math.round(other), ...PLATFORM_CONFIG.other },
    ].filter(p => p.value > 0).sort((a, b) => b.value - a.value);
  }, [data, metaSpendFromLogs]);

  const totalSpend = platformTotals.reduce((sum, p) => sum + p.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const percent = totalSpend > 0 ? ((item.value / totalSpend) * 100).toFixed(1) : '0';
      return (
        <div className="bg-card border border-white/50 rounded-xl p-4 shadow-2xl shadow-blue-900/5">
          <p className="font-medium flex items-center gap-2 mb-2 text-foreground">
            <span className="text-xl">{item.icon}</span>
            <span className="text-lg">{item.label}</span>
          </p>
          <div className="space-y-1">
            <p className="text-2xl font-bold tracking-tight text-foreground">{formatCurrency(item.value)}</p>
            <p className="text-sm text-muted-foreground">{percent}% от общего бюджета</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null;

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="currentColor"
        textAnchor="middle"
        dominantBaseline="central"
        className="font-bold text-xs drop-shadow-md pointer-events-none fill-foreground"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Pie Chart */}
      <Card className="bg-card border border-white/50 shadow-sm lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <span className="w-2 h-6 bg-primary rounded-full" />
            Доля рекламных площадок
          </CardTitle>
          <CardDescription>
            Распределение бюджета за последние 90 дней. Meta Ads — данные из кабинета Meta (ad_performance_logs).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {platformTotals.length > 0 ? (
            <div className="h-[400px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={platformTotals}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={160}
                    innerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={1000}
                    stroke="none"
                  >
                    {platformTotals.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        className="hover:opacity-90 transition-opacity cursor-pointer"
                        stroke="rgba(0,0,0,0.1)"
                        strokeWidth={1}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-muted-foreground text-sm font-medium">Всего</span>
                <span className="text-2xl font-bold text-foreground">{formatCurrency(totalSpend)}</span>
              </div>
            </div>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground rounded-2xl border border-dashed border-white/50 bg-muted/20">
              <div className="text-center">
                <p>Нет данных о расходах</p>
                <p className="text-xs mt-1">Подключите рекламные кабинеты в Интеграциях</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform Breakdown Cards */}
      <div className="space-y-4">
        {platformTotals.map((platform, index) => {
          const percent = totalSpend > 0 ? ((platform.value / totalSpend) * 100).toFixed(1) : 0;

          return (
            <motion.div
              key={platform.key}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={cn("bg-card border border-white/50 transition-all hover:shadow-md cursor-default border-l-4", platform.border)} style={{ borderLeftColor: platform.color }}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xl", platform.bg)}>
                        {platform.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-base text-foreground">{platform.label}</p>
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-white/50 text-muted-foreground">
                          {platform.key === 'facebook' ? 'из кабинета Meta' : 'Ad Spend'}
                        </Badge>
                      </div>
                    </div>
                    <span className="font-bold text-lg font-mono text-foreground">{percent}%</span>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">Расход</span>
                      <span className="text-xl font-bold text-foreground">
                        {formatCurrency(platform.value)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${percent}%`, backgroundColor: platform.color }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {platformTotals.length === 0 && (
          <div className="p-6 text-center text-muted-foreground text-sm border border-white/50 rounded-xl bg-muted/20">
            Нет данных. Подключите Meta в Интеграциях и синхронизируйте расходы.
          </div>
        )}
      </div>
    </div>
  );
};
