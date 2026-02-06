import { useEffect, useMemo, useRef, useState } from 'react';
import { useFactoryStore } from './store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const LeadTimeTrends = () => {
  const { productionLines } = useFactoryStore();
  const [data, setData] = useState<{ t: string; avg: number }[]>([]);
  const idx = useRef(0);

  useEffect(() => {
    const sample = () => {
      const lines = Object.values(productionLines);
      const avg = Math.round(
        lines.reduce((a, l) => a + (l.startedAt ? (Date.now() - l.startedAt) : 0), 0) / Math.max(1, lines.length)
      );
      const point = { t: `${idx.current}`, avg: Math.round(avg / 1000) };
      idx.current += 1;
      setData((prev) => [...prev.slice(-29), point]);
    };
    sample();
    const id = setInterval(sample, 30000);
    return () => clearInterval(id);
  }, [productionLines]);

  const safeData = useMemo(() => data.length ? data : [{ t: '0', avg: 0 }], [data]);

  return (
    <Card className="premium-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-white/80">Тренд Lead Time (минуты)</CardTitle>
      </CardHeader>
      <CardContent style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={safeData}>
            <defs>
              <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="t" hide />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="avg" stroke="#10B981" fillOpacity={1} fill="url(#colorAvg)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
