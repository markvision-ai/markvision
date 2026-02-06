import React from 'react';
import { useFactoryStore } from './store';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { IdeasHeader } from './IdeasHeader';
import { ScriptWorkshop } from './ScriptWorkshop';
import { CreationCenter } from './CreationCenter';
import { PostingDashboard } from './PostingDashboard';

export const ContentFactoryV4 = () => {
  const { productionLines } = useFactoryStore();
  const entries = Object.entries(productionLines);
  const generating = entries.filter(([, v]) => v.status === 'generating').map(([k]) => k);
  const ready = entries.filter(([, v]) => v.status === 'ready').map(([k]) => k);

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
        </div>
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
