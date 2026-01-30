import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ContentItem } from '@/hooks/useContentFactory';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Send, CheckCircle, Truck, Instagram, Youtube, Globe, Smartphone, ArrowUpRight, Box } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ShippingDockProps {
  items: ContentItem[];
  onManualPublish: (id: string) => void;
}

export const ShippingDock = ({ items, onManualPublish }: ShippingDockProps) => {
  const manualTypes = ['reels', 'carousel', 'instagram', 'video_short'];
  const readyItems = items.filter(i => ['ready_to_send', 'avatar_ready', 'editing_ready'].includes(i.status));
  const manualQueue = readyItems.filter(i => manualTypes.some(t => i.content_type?.toLowerCase().includes(t)));

  return (
    <div className="h-full flex flex-col bg-muted/10 dark:bg-background border-l border-border/40 dark:border-white/5">
       {/* Header */}
       <div className="p-4 border-b border-border/40 dark:border-white/5 bg-background/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Package className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-sm">Зона Отгрузки</h2>
          </div>
          <Badge variant="secondary" className="text-xs">
            {items.length}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Готово к публикации
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {manualQueue.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/50">
                <Box className="w-8 h-8 mb-3 opacity-50" />
                <p className="text-sm text-center">Склад пуст</p>
             </div>
          ) : (
            manualQueue.map(item => (
                <motion.div
                    key={item.id}
                    layoutId={item.id}
                    className="group"
                >
                    <Card className="p-4 hover:shadow-md transition-all border-border/50 bg-card">
                        <div className="flex items-start gap-3 mb-3">
                             <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center shrink-0">
                                {item.content_type?.includes('video') ? (
                                    <Youtube className="w-5 h-5 text-red-500" />
                                ) : (
                                    <Instagram className="w-5 h-5 text-pink-500" />
                                )}
                             </div>
                             <div className="min-w-0">
                                <h4 className="text-sm font-medium line-clamp-2 leading-snug">{item.title}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                                        ГОТОВО
                                    </Badge>
                                </div>
                             </div>
                        </div>
                        
                        <Button 
                            size="sm" 
                            className="w-full h-8 text-xs gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => onManualPublish(item.id)}
                        >
                            <Send className="w-3 h-3" />
                            Опубликовать
                        </Button>
                    </Card>
                </motion.div>
            ))
          )}
      </div>
    </div>
  );
};

