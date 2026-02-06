import { useEffect, useMemo, useState } from 'react';
import { useFactoryStore } from './store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Timer, AlertTriangle } from 'lucide-react';

const SLA: Record<string, number> = {
  tg_post: 2500,
  threads: 3000,
  seo_blog: 4000,
  carousel: 5000,
  viral_video: 6000,
  avatar_video: 7000
};

export const LeadTimePanel = () => {
  const { productionLines } = useFactoryStore();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const lines = useMemo(() => Object.values(productionLines), [productionLines, tick]);

  const items = lines.map(l => {
    const elapsed = l.startedAt ? Date.now() - l.startedAt : 0;
    const lead = l.status === 'ready' ? (l.durationMs || elapsed) : elapsed;
    const sla = SLA[l.type] || 5000;
    const over = lead > sla;
    return { label: l.type, lead, sla, over, progress: Math.min(100, Math.round((lead / sla) * 100)) };
  });

  const avgLead = Math.round(items.reduce((a,b)=>a+b.lead,0) / Math.max(1, items.length));

  return (
    <Card className="premium-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-white/80 flex items-center gap-2">
          <Timer className="w-4 h-4 text-white/70" />
          Lead Time по линиям
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          {items.map(it => (
            <div key={it.label} className="p-3 rounded-xl border border-white/10 bg-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white/80">{it.label}</span>
                {it.over && <span className="text-[10px] text-amber-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> SLA</span>}
              </div>
              <div className="h-2 w-full bg-black/30 rounded-full overflow-hidden border border-white/10">
                <div className={`h-full ${it.over ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${it.progress}%` }} />
              </div>
              <div className="text-[10px] text-white/50 mt-1">
                {Math.round(it.lead/1000)}s / SLA {Math.round(it.sla/1000)}s
              </div>
            </div>
          ))}
        </div>
        <div className="welcome-hero-kpi">
          <div className="kpi-label">Средний Lead Time</div>
          <div className="kpi-value">{Math.round(avgLead/1000)}s</div>
        </div>
      </CardContent>
    </Card>
  );
};
