import { useEffect, useMemo, useState } from 'react';
import { useFactoryStore } from './store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Activity, CheckCircle2, CirclePause, Search } from 'lucide-react';

export const OperationsPanel = () => {
  const { scripts, productionLines, postingQueue } = useFactoryStore();
  const [tick, setTick] = useState(0);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'idle' | 'generating' | 'review' | 'ready'>('all');

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const linesArr = useMemo(() => Object.values(productionLines), [productionLines, tick]);
  const generating = linesArr.filter(l => l.status === 'generating');
  const ready = linesArr.filter(l => l.status === 'ready');
  const idle = linesArr.filter(l => l.status === 'idle');

  const filteredLines = linesArr.filter((l) => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (query && !l.type.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const totalProgress = Math.round(
    linesArr.reduce((acc, l) => acc + (l.progress || 0), 0) / Math.max(1, linesArr.length)
  );

  return (
    <Card className="premium-card">
      <CardHeader className="pb-2 flex items-center justify-between">
        <CardTitle className="text-sm text-white/80 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          Реальное время: операции центра
        </CardTitle>
        <Badge className="bg-primary/10 text-primary border-primary/20 flex items-center gap-1">
          <RefreshCw className="w-3 h-3" />
          Обновление каждые 30s
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div className="welcome-hero-kpi">
            <div className="kpi-label">В работе</div>
            <div className="kpi-value">{generating.length}</div>
          </div>
          <div className="welcome-hero-kpi">
            <div className="kpi-label">Готово</div>
            <div className="kpi-value">{ready.length}</div>
          </div>
          <div className="welcome-hero-kpi">
            <div className="kpi-label">Ожидание</div>
            <div className="kpi-value">{idle.length}</div>
          </div>
          <div className="welcome-hero-kpi">
            <div className="kpi-label">Средний прогресс</div>
            <div className="kpi-value">{totalProgress}%</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по линиям: avatar, viral, seo..."
              className="pl-9 bg-background/60 border-white/10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="bg-background/60 border-white/10">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все</SelectItem>
              <SelectItem value="idle">Ожидание</SelectItem>
              <SelectItem value="generating">В работе</SelectItem>
              <SelectItem value="review">Проверка</SelectItem>
              <SelectItem value="ready">Готово</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 text-xs text-white/60">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Публикаций в очереди: {postingQueue.length}
            <CirclePause className="w-4 h-4 text-white/40 ml-2" />
            Сценариев: {scripts.length}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredLines.map((l) => (
            <div key={l.type} className="p-3 rounded-xl border border-white/10 bg-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white/80">{l.type}</span>
                <Badge variant="outline" className="text-[10px]">
                  {l.status}
                </Badge>
              </div>
              <div className="h-2 w-full bg-black/30 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-emerald-500 transition-[width] duration-300"
                  style={{ width: `${l.progress || 0}%` }}
                />
              </div>
              <div className="text-[10px] text-white/50 mt-1">
                ETA ~{Math.ceil((l.durationMs || 0) / 1000)}s
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
