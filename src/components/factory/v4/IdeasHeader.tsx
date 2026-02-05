import React from 'react';
import { useFactoryStore } from './store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ArrowDown, Flame, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export const IdeasHeader = () => {
  const { ideas, moveIdeaToWorkshop } = useFactoryStore();

  return (
    <div className="w-full h-48 bg-white/50 backdrop-blur-sm border-b border-slate-200 p-4 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          Входящий поток идей
          <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-700">
            Top {ideas.length}
          </Badge>
        </h3>
        <Button variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Обновить тренды
        </Button>
      </div>

      <ScrollArea className="w-full whitespace-nowrap pb-2">
        <div className="flex w-max space-x-4 p-1">
          {ideas.map((idea) => (
            <motion.div
              key={idea.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-block"
            >
              <Card 
                className="w-64 h-28 cursor-pointer hover:shadow-md transition-all border-slate-200 bg-white/80 group relative overflow-hidden"
                onClick={() => moveIdeaToWorkshop(idea)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-4 flex flex-col justify-between h-full relative z-10">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-tight whitespace-normal line-clamp-2" title={idea.title}>
                      {idea.title}
                    </p>
                    <p className="text-xs text-slate-500">{idea.source}</p>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <Badge variant="outline" className="text-xs bg-slate-100 border-0">
                      {idea.views}
                    </Badge>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowDown className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
