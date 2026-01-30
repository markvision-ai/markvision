import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ContentItem } from '@/hooks/useContentFactory';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Lightbulb, Sparkles, Plus, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface IdeaWorkshopProps {
  items: ContentItem[];
  onApprove: (id: string) => void;
}

export const IdeaWorkshop = ({ items, onApprove }: IdeaWorkshopProps) => {
  return (
    <div className="h-full flex flex-col bg-muted/10 dark:bg-background border-r border-border/40 dark:border-white/5">
      {/* Header */}
      <div className="p-4 border-b border-border/40 dark:border-white/5 bg-background/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Brain className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-sm">Цех Идей</h2>
          </div>
          <Badge variant="secondary" className="text-xs">
            {items.length}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Очередь сценариев на утверждение
        </p>
      </div>

      {/* Vertical List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {items.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-muted-foreground/50"
            >
              <Lightbulb className="w-8 h-8 mb-3 opacity-50" />
              <p className="text-sm text-center">Нет новых идей</p>
            </motion.div>
          ) : (
            items.map((item) => (
              <motion.div
                key={item.id}
                layoutId={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="p-4 hover:shadow-md transition-all border-border/50 bg-card">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider opacity-70">
                      {item.content_type || 'Черновик'}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className="text-sm font-medium mb-2 line-clamp-2 leading-snug">
                    {item.title}
                  </h3>
                  
                  <p className="text-xs text-muted-foreground mb-4 line-clamp-3">
                    {item.original_script ? 
                      (typeof item.original_script === 'string' && item.original_script.startsWith('{') 
                        ? JSON.parse(item.original_script).main_idea 
                        : item.original_script) 
                      : "Описание отсутствует..."}
                  </p>

                  <Button 
                    size="sm" 
                    className="w-full h-8 text-xs gap-2"
                    onClick={() => onApprove(item.id)}
                  >
                    <Sparkles className="w-3 h-3" />
                    Запустить в производство
                  </Button>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

