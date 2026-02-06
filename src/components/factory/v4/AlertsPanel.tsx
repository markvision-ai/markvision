import { useEffect, useMemo, useState } from 'react';
import { useFactoryStore } from './store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export const AlertsPanel = () => {
  const { productionLines } = useFactoryStore();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const lines = useMemo(() => Object.values(productionLines), [productionLines, tick]);

  const alerts = lines.flatMap(l => {
    const arr: { type: 'warning'|'error'|'success'; message: string }[] = [];
    const elapsed = l.startedAt ? Date.now() - l.startedAt : 0;
    const sla = (l.durationMs || 3000) * 1.5;
    if (l.status === 'generating' && elapsed > sla) {
      arr.push({ type: 'warning', message: `Линия ${l.type} превышает SLA (${Math.round(elapsed/1000)}s)` });
    }
    if (l.status === 'error') {
      arr.push({ type: 'error', message: `Ошибка на линии ${l.type}` });
    }
    if (l.status === 'ready') {
      arr.push({ type: 'success', message: `Готово: ${l.type}` });
    }
    return arr;
  });

  useEffect(() => {
    alerts.forEach(a => {
      if (a.type === 'warning') toast.warning(a.message);
      if (a.type === 'error') toast.error(a.message);
    });
  }, [tick]);

  return (
    <Card className="premium-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-white/80">Уведомления и статусы</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {alerts.length === 0 && (
            <div className="text-xs text-white/60">Нет значимых событий</div>
          )}
          {alerts.map((a, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs p-2 rounded-lg border border-white/10 bg-white/5">
              {a.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
              {a.type === 'error' && <XCircle className="w-4 h-4 text-red-400" />}
              {a.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              <span className="text-white/80">{a.message}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
