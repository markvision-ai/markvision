import React from 'react';
import { useFactoryStore, Script } from './store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ScriptWorkshop = () => {
  const { scripts, activeScriptId, setActiveScript, startAllProductions } = useFactoryStore();

  const handleScriptClick = (script: Script) => {
    if (script.status !== 'ready') return;
    
    setActiveScript(script.id);
    // Automatically start generation for all channels when script is selected
    startAllProductions();
  };

  return (
    <div className="w-80 border-r border-slate-200 bg-slate-50/50 flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 bg-white/50 backdrop-blur-sm">
        <h3 className="font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Цех Сценариев
        </h3>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          <AnimatePresence>
            {scripts.map((script) => (
              <motion.div
                key={script.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
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
            <div className="text-center text-slate-400 py-10 text-sm">
              Перетащите идеи сюда
              <br />
              для создания сценария
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

const ScriptCard = ({ script, isActive, onClick }: { script: Script; isActive: boolean; onClick: () => void }) => {
  return (
    <Card 
      className={`
        cursor-pointer transition-all hover:shadow-md border-l-4
        ${isActive ? 'border-l-blue-500 bg-blue-50/50 ring-1 ring-blue-200' : 'border-l-transparent hover:border-l-slate-300'}
        ${script.status !== 'ready' ? 'opacity-70' : ''}
      `}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2">
          <h4 className="text-sm font-medium line-clamp-2 leading-tight">
            {script.title}
          </h4>
        </div>
        
        <div className="flex items-center justify-between">
          {script.status === 'writing' && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 gap-1 text-[10px] h-5">
              <Loader2 className="w-3 h-3 animate-spin" />
              Пишем...
            </Badge>
          )}
          
          {script.status === 'ready' && (
            <Badge variant="secondary" className="bg-green-100 text-green-700 gap-1 text-[10px] h-5">
              <CheckCircle2 className="w-3 h-3" />
              Готово
            </Badge>
          )}

          {script.status === 'pending' && (
            <Badge variant="outline" className="text-slate-400 text-[10px] h-5">
              Очередь
            </Badge>
          )}

          {script.status === 'ready' && !isActive && (
             <Button size="icon" variant="ghost" className="h-6 w-6">
               <ArrowRight className="w-4 h-4 text-slate-400" />
             </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
