import React from 'react';
import { useFactoryStore, Script } from './store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ScriptWorkshop = () => {
  const { scripts, activeScriptId, setActiveScript, startAllProductions } = useFactoryStore();

  const handleScriptClick = (script: Script) => {
    if (script.status !== 'ready') return;
    
    setActiveScript(script.id);
    startAllProductions();
  };

  return (
    <div className="w-80 flex flex-col h-full bg-muted/5 border-r border-border">
      <div className="p-5 border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
          <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          Цех Сценариев
        </h3>
        <p className="text-xs text-muted-foreground mt-1 ml-9">
          Управление сценариями и подготовка к производству
        </p>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {scripts.map((script) => (
              <motion.div
                key={script.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                layout
              >
                <ScriptCard 
                  script={script} 
                  isActive={activeScriptId === script.id}
                  onClick={() => handleScriptClick(script)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          {scripts.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center py-12 px-4 border-2 border-dashed border-muted-foreground/20 rounded-xl bg-muted/5 mx-2">
              <FileText className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-foreground">Нет сценариев</p>
              <p className="text-xs text-muted-foreground mt-1">
                Перетащите идеи из потока сверху,<br />чтобы создать новый сценарий
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

const ScriptCard = ({ script, isActive, onClick }: { script: Script; isActive: boolean; onClick: () => void }) => {
  return (
    <div 
      className={`
        relative group cursor-pointer transition-all duration-300 rounded-xl border overflow-hidden
        ${isActive 
          ? 'bg-background shadow-lg shadow-blue-500/10 border-blue-500/50 ring-1 ring-blue-500/20' 
          : 'bg-card hover:bg-background border-transparent hover:border-border/80 hover:shadow-md'}
        ${script.status !== 'ready' ? 'opacity-80' : ''}
      `}
      onClick={onClick}
    >
      {isActive && (
        <div className="absolute inset-y-0 left-0 w-1 bg-blue-500" />
      )}
      
      <div className="p-4 pl-5">
        <div className="flex justify-between items-start mb-3 gap-2">
          <h4 className={`text-sm font-bold line-clamp-2 leading-tight transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-foreground group-hover:text-primary'}`}>
            {script.title}
          </h4>
        </div>
        
        <div className="flex items-center justify-between">
          {script.status === 'writing' && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 gap-1.5 text-[10px] h-6 pl-1.5 pr-2.5 font-medium border-amber-200 dark:border-amber-800/30">
              <Loader2 className="w-3 h-3 animate-spin" />
              Пишем...
            </Badge>
          )}
          
          {script.status === 'ready' && (
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1.5 text-[10px] h-6 pl-1.5 pr-2.5 font-medium border-green-200 dark:border-green-800/30">
              <CheckCircle2 className="w-3 h-3" />
              Готово
            </Badge>
          )}

          {script.status === 'pending' && (
            <Badge variant="outline" className="text-muted-foreground text-[10px] h-6 border-dashed gap-1.5 pl-1.5 pr-2.5 bg-muted/30">
              <Clock className="w-3 h-3" />
              Очередь
            </Badge>
          )}

          {isActive && (
             <motion.div layoutId="active-indicator" className="text-[10px] font-medium text-blue-500 flex items-center gap-1">
               В работе
             </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
