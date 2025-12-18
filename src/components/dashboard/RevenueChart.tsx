import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

interface DailyData {
  date: string;
  spend: number;
  impressions: number;
  leads: number;
  diagnostics: number;
  sales: number;
  revenue: number;
  clicks?: number;
}

interface RevenueChartProps {
  data: Record<string, DailyData>;
  daysInMonth: Date[];
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M ₸`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K ₸`;
  return `${value} ₸`;
};

export const RevenueChart = ({ data, daysInMonth }: RevenueChartProps) => {
  const chartData = useMemo(() => {
    return daysInMonth.map(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const dayData = data[dateKey];
      return {
        date: dateKey,
        displayDate: format(day, 'd MMM', { locale: ru }),
        revenue: dayData?.revenue || 0,
        spend: dayData?.spend || 0,
      };
    }).filter(d => d.revenue > 0 || d.spend > 0);
  }, [data, daysInMonth]);

  if (chartData.length === 0) {
    return (
      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Динамика показателей</h3>
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          Нет данных для отображения
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-xl p-6">
      <h3 className="font-semibold mb-4">Динамика показателей</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="displayDate" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              tickFormatter={formatCurrency}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name === 'revenue' ? 'Выручка' : 'Расходы'
              ]}
            />
            <Legend 
              formatter={(value) => value === 'revenue' ? 'Выручка' : 'Расходы'}
            />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="hsl(var(--success))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--success))', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="spend" 
              stroke="hsl(var(--destructive))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
