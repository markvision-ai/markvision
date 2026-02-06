import React from 'react';
import { useFactoryStore } from './store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ArrowDown, Flame, RefreshCw, TrendingUp, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

export const IdeasHeader = () => {
  const { ideas, moveIdeaToWorkshop } = useFactoryStore();

  return (
    <div className="w-full bg-background border-b border-border p-6 flex flex-col gap-6 shadow-sm relative z-10">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h3 className="text-2xl font-bold flex items-center gap-3 text-foreground tracking-tight">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Flame className="w-6 h-6 text-orange-600 dark:text-orange-400 fill-orange-600 dark:fill-orange-400" />
            </div>
            Входящий поток идей
            <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-200 text-sm px-3 py-1 border-orange-200 dark:border-orange-800">
              Top {ideas.length}
            </Badge>
          </h3>
          <p className="text-muted-foreground text-sm ml-14">
            Трендовые темы и вирусные идеи для вашего контента
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 h-10 px-4 hover:bg-accent hover:text-accent-foreground transition-colors border-input">
          <RefreshCw className="w-4 h-4" />
          Обновить тренды
        </Button>
      </div>

      <ScrollArea className="w-full whitespace-nowrap pb-4">
        <div className="flex w-max space-x-5 p-1">
          {ideas.map((idea) => (
            <motion.div
              key={idea.id}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="inline-block"
            >
              <Card 
                className="w-80 h-40 cursor-pointer hover:shadow-xl dark:hover:shadow-primary/5 transition-all duration-300 border-border bg-card hover:border-orange-500/50 dark:hover:border-orange-400/50 group relative overflow-hidden"
                onClick={() => moveIdeaToWorkshop(idea)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-orange-500/5 dark:to-orange-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <CardContent className="p-5 flex flex-col justify-between h-full relative z-10">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-muted-foreground border-border bg-muted/50">
                        {idea.source}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                        <TrendingUp className="w-3 h-3" />
                        {idea.viralScore}%
                      </div>
                    </div>
                    
                    <p className="text-lg font-bold leading-snug whitespace-normal line-clamp-2 text-card-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors" title={idea.title}>
                      {idea.title}
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center mt-auto pt-2 border-t border-border/50">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      <Eye className="w-3 h-3" />
                      <span className="font-medium">{idea.views.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-primary font-medium text-xs opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <span>В работу</span>
                      <ArrowDown className="w-4 h-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="h-2.5" />
      </ScrollArea>
    </div>
  );
};
