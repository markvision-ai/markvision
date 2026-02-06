import React, { useMemo } from 'react';
import { useFactoryStore } from './store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Layers, FileText, Sparkles, Send } from 'lucide-react';

export const ProcessMap = () => {
  const { ideas, scripts, productionLines, postingQueue } = useFactoryStore();
  const linesArr = useMemo(() => Object.values(productionLines), [productionLines]);

  const progressAvg = Math.round(
    linesArr.reduce((acc, l) => acc + (l.progress || 0), 0) / Math.max(1, linesArr.length)
  );
  const generatingCount = linesArr.filter(l => l.status === 'generating').length;
  const readyCount = linesArr.filter(l => l.status === 'ready').length;

  const Stage = ({ icon, title, stat, sub }: { icon: React.ReactNode; title: string; stat: string; sub?: string }) => (
    <div className="p-4 rounded-xl border border-white/10 bg-white/5">
      <div className="flex items-center gap-2 text-white/80">
        {icon}
        <span className="text-sm font-bold">{title}</span>
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums text-white">{stat}</div>
      {sub && <div className="text-xs text-white/50 mt-1">{sub}</div>}
    </div>
  );

  return (
    <Card className="premium-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-white/80">Карта производственного процесса</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-3">
          <Stage icon={<Layers className="w-4 h-4 text-sky-400" />} title="Идеи" stat={String(ideas.length)} sub="входящий поток" />
          <ArrowRight className="w-6 h-6 text-white/30 hidden md:block" />
          <Stage icon={<FileText className="w-4 h-4 text-blue-400" />} title="Сценарии" stat={String(scripts.length)} sub="готово к генерации" />
          <ArrowRight className="w-6 h-6 text-white/30 hidden md:block" />
          <Stage icon={<Sparkles className="w-4 h-4 text-emerald-400" />} title="Генерация" stat={`${progressAvg}%`} sub={`${generatingCount} в работе, ${readyCount} готово`} />
          <ArrowRight className="w-6 h-6 text-white/30 hidden md:block" />
          <Stage icon={<Send className="w-4 h-4 text-indigo-400" />} title="Дистрибуция" stat={String(postingQueue.length)} sub="в очереди на публикацию" />
        </div>
      </CardContent>
    </Card>
  );
};
