import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Idea {
  id: string;
  title: string;
  source: string;
  url: string;
  views: string;
}

interface FactoryBriefingProps {
  ideas: Idea[];
  onSelectIdea: (idea: Idea) => void;
  selectedIdeaId?: string;
}

export const FactoryBriefing = ({ ideas, onSelectIdea, selectedIdeaId }: FactoryBriefingProps) => {
  return (
    <div className="w-full h-[220px] bg-white border-b border-slate-200 flex flex-col relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
      <div className="absolute top-0 right-0 w-[500px] h-[200px] bg-purple-500/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 z-10">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
             <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_#a855f7]" />
             <span className="text-[10px] font-bold tracking-[0.2em] text-purple-600 uppercase">Центр Идей</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            Входящий Поток
            <span className="text-slate-400 font-normal text-sm ml-2">Топ 20 трендов</span>
          </h2>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm">
            <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span className="text-xs font-medium text-slate-700">AI Мониторинг активен</span>
          </div>
        </div>
      </div>

      {/* Cards Scroll Area */}
      <ScrollArea className="flex-1 w-full whitespace-nowrap px-8 pb-6">
        <div className="flex gap-4 pb-4 pl-8 pr-8">
          {ideas.map((idea, index) => (
            <motion.div
              key={idea.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}
              onClick={() => onSelectIdea(idea)}
              className={cn(
                "w-[320px] h-[120px] flex-shrink-0 rounded-xl border cursor-pointer transition-all duration-300 group relative overflow-hidden",
                selectedIdeaId === idea.id 
                  ? "bg-white border-purple-500 shadow-xl shadow-purple-500/10 ring-1 ring-purple-500" 
                  : "bg-white border-slate-200 hover:border-purple-300 hover:shadow-lg hover:-translate-y-1"
              )}
            >
              {/* Selection Glow */}
              {selectedIdeaId === idea.id && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent pointer-events-none" />
              )}

              <div className="p-4 h-full flex flex-col justify-between relative z-10">
                {/* Top Row */}
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-mono bg-slate-100 text-slate-500 rounded-md">
                        INTEL #{index + 1}
                      </Badge>
                      <span className="text-[10px] font-bold text-purple-600 tracking-wide uppercase">
                        {idea.source}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 whitespace-normal leading-snug group-hover:text-purple-600 transition-colors">
                      {idea.title}
                    </h3>
                  </div>
                </div>
                
                {/* Bottom Row */}
                <div className="flex justify-between items-end mt-auto pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                    <TrendingUp className="w-3 h-3" />
                    {idea.views}
                  </div>

                  <div className="flex items-center gap-2">
                    <a 
                      href={idea.url} 
                      target="_blank" 
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()} 
                      className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      <ExternalLink size={14} />
                    </a>
                    <Button 
                      size="sm" 
                      className={cn(
                        "h-7 text-[10px] font-bold uppercase tracking-wider transition-all",
                        selectedIdeaId === idea.id 
                          ? "bg-purple-600 text-white shadow-md shadow-purple-500/20" 
                          : "bg-slate-100 text-slate-600 hover:bg-purple-500 hover:text-white"
                      )}
                    >
                      {selectedIdeaId === idea.id ? 'Выбрано' : 'В работу'}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="h-2 bg-slate-100" />
      </ScrollArea>
    </div>
  );
};
