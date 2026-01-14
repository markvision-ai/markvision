import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip 
} from 'recharts';
import { supabase } from '@/lib/externalSupabase';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

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

const PLATFORM_COLORS = {
  facebook: '#1877F2',
  google: '#EA4335',
  tiktok: '#000000',
  other: '#6B7280'
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
};

export const PlatformSpendChart = ({ projectId }: PlatformSpendChartProps) => {
  const [data, setData] = useState<DailyDataWithPlatforms[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: dailyData, error } = await supabase
          .from('daily_data')
          .select('date, spend, spend_fb, spend_google, spend_tiktok')
          .eq('project_id', projectId)
          .order('date', { ascending: false })
          .limit(90);

        if (error) throw error;
        setData(dailyData || []);
      } catch (error) {
        console.error('Error fetching platform spend:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  const platformTotals = useMemo(() => {
    const totals = data.reduce(
      (acc, day) => ({
        facebook: acc.facebook + (day.spend_fb || 0),
        google: acc.google + (day.spend_google || 0),
        tiktok: acc.tiktok + (day.spend_tiktok || 0),
        total: acc.total + (day.spend || 0)
      }),
      { facebook: 0, google: 0, tiktok: 0, total: 0 }
    );

    const knownSpend = totals.facebook + totals.google + totals.tiktok;
    const other = Math.max(0, totals.total - knownSpend);

    return [
      { name: 'Facebook', value: Math.round(totals.facebook), color: PLATFORM_COLORS.facebook, icon: '📘' },
      { name: 'Google', value: Math.round(totals.google), color: PLATFORM_COLORS.google, icon: '🔍' },
      { name: 'TikTok', value: Math.round(totals.tiktok), color: PLATFORM_COLORS.tiktok, icon: '🎵' },
      { name: 'Прочие', value: Math.round(other), color: PLATFORM_COLORS.other, icon: '📊' },
    ].filter(p => p.value > 0);
  }, [data]);

  const totalSpend = platformTotals.reduce((sum, p) => sum + p.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const percent = totalSpend > 0 ? ((item.value / totalSpend) * 100).toFixed(1) : '0';
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium flex items-center gap-2">
            <span>{item.icon}</span>
            {item.name}
          </p>
          <p className="text-lg font-bold mt-1">{formatCurrency(item.value)}</p>
          <p className="text-sm text-muted-foreground">{percent}% от общего</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't render labels for very small slices
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central"
        className="font-bold text-sm"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Доля рекламных площадок</CardTitle>
          <CardDescription>Распределение расходов по платформам</CardDescription>
        </CardHeader>
        <CardContent>
          {platformTotals.length > 0 ? (
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={platformTotals}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={130}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {platformTotals.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        stroke="hsl(var(--background))"
                        strokeWidth={3}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    formatter={(value: string) => {
                      const item = platformTotals.find(p => p.name === value);
                      return <span className="text-foreground">{item?.icon} {value}</span>;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p>Нет данных о расходах по платформам</p>
                <p className="text-sm mt-2">Синхронизируйте данные с QuantumAds</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { name: 'Facebook', key: 'facebook', icon: '📘', color: 'from-blue-500 to-blue-600' },
          { name: 'Google', key: 'google', icon: '🔍', color: 'from-red-500 to-orange-500' },
          { name: 'TikTok', key: 'tiktok', icon: '🎵', color: 'from-gray-800 to-gray-900' },
          { name: 'Всего', key: 'total', icon: '💰', color: 'from-primary to-accent' },
        ].map((platform, index) => {
          const value = platform.key === 'total' 
            ? totalSpend 
            : platformTotals.find(p => p.name === platform.name)?.value || 0;
          const percent = platform.key !== 'total' && totalSpend > 0 
            ? ((value / totalSpend) * 100).toFixed(1) 
            : null;

          return (
            <motion.div
              key={platform.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="text-lg">{platform.icon}</span>
                        {platform.name}
                      </p>
                      <p className="text-2xl font-bold mt-1">
                        {formatCurrency(value)}
                      </p>
                      {percent && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {percent}% от общего
                        </p>
                      )}
                    </div>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center text-white text-xl`}>
                      {platform.icon}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
