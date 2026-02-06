 
import { useFactoryStore } from './store';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { IdeasHeader } from './IdeasHeader';
import { ScriptWorkshop } from './ScriptWorkshop';
import { CreationCenter } from './CreationCenter';
import { PostingDashboard } from './PostingDashboard';
import { OperationsPanel } from './OperationsPanel';
import { ProcessMap } from './ProcessMap';
import { ExportReportButton } from './ExportReportButton';
import { toast } from 'sonner';
import { useEffect, useRef } from 'react';
import { LeadTimePanel } from './LeadTimePanel';
import { AlertsPanel } from './AlertsPanel';
import { LeadTimeTrends } from './LeadTimeTrends';

export const ContentFactoryV4 = () => {
  const { productionLines } = useFactoryStore();
  const entries = Object.entries(productionLines);
  const generating = entries.filter(([, v]) => v.status === 'generating').map(([k]) => k);
  const ready = entries.filter(([, v]) => v.status === 'ready').map(([k]) => k);
  const prevRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const currentStatuses: Record<string, string> = {};
    entries.forEach(([k, v]) => currentStatuses[k] = v.status);
    Object.keys(currentStatuses).forEach((k) => {
      const prev = prevRef.current[k];
      const cur = currentStatuses[k];
      if (prev && prev !== cur) {
        if (cur === 'ready') toast.success(`Линия "${k}" завершена и готова к публикации`);
        if (cur === 'error') toast.error(`Ошибка на линии "${k}"`);
      }
    });
    prevRef.current = currentStatuses;
  }, [entries]);

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] bg-background overflow-hidden rounded-xl border border-border shadow-2xl dark:shadow-black/20 m-4">
      {/* Top: Ideas Feed */}
      <IdeasHeader />

      {/* Production Status */}
      <div className="px-4 py-2 border-y border-border bg-black/30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
            Производство
          </Badge>
          {generating.length > 0 ? (
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-xs text-white/70">Сейчас в работе:</span>
              {generating.map((name) => (
                <span key={name} className="text-xs px-2 py-1 rounded-md bg-white/5 border border-white/10 text-white/80 inline-flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                  {name.replace('_', ' ')}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-xs text-white/60">Очередь пуста — запустите генерацию в центре</span>
          )}
          {ready.length > 0 && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-white/70">Готово:</span>
              {ready.map((name) => (
                <span key={name} className="text-xs px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {name.replace('_', ' ')}
                </span>
              ))}
            </div>
          )}
          <div className="ml-auto">
            <ExportReportButton />
          </div>
        </div>
      </div>

      {/* Realtime Operations + Process Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
        <OperationsPanel />
        <ProcessMap />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-4">
        <LeadTimePanel />
        <AlertsPanel />
      </div>
      <div className="px-4 pb-4">
        <LeadTimeTrends />
      </div>

      {/* Main Workspace: 3 Columns */}
      <div className="flex-1 flex overflow-hidden divide-x divide-border bg-muted/5 dark:bg-background">
        {/* Left: Script Workshop */}
        <ScriptWorkshop />

        {/* Center: Creation Canvas */}
        <CreationCenter />

        {/* Right: Posting Dashboard */}
        <PostingDashboard />
      </div>
    </div>
  );
};
