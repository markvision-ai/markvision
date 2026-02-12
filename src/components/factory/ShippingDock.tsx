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
  onReject: (id: string) => void;
}

export const ShippingDock = ({ items, onManualPublish, onReject }: ShippingDockProps) => {
  const manualTypes = ['reels', 'carousel', 'instagram', 'video_short', 'dental_video'];
  const readyItems = items.filter(i => ['ready_to_send', 'avatar_ready', 'editing_ready'].includes(i.status));
  const manualQueue = readyItems.filter(i => manualTypes.some(t => i.content_type?.toLowerCase().includes(t)));

  return (
    <div className="h-full flex flex-col bg-muted/10 border-l border-border/40">
      {/* Header */}
       <div className="p-4 border-b border-border/40 bg-background/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-sm">Контроль Качества</h2>
          </div>
          <Badge variant="secondary" className="text-xs">
            {manualQueue.length}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Проверка перед публикацией
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {manualQueue.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/50">
                <Box className="w-8 h-8 mb-3 opacity-50" />
                <p className="text-sm text-center">Нет готовых материалов</p>
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
                                    <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                                        НА ПРОВЕРКЕ
                                    </Badge>
                                </div>
                             </div>
                        </div>
                        
                        {/* Preview Section */}
                        <div className="mb-3 p-3 bg-muted/30 rounded-md text-xs text-muted-foreground border border-border/30">
                            <p className="font-medium mb-1 text-foreground/80">Результат генерации:</p>
                            <p className="line-clamp-3 italic">
                                "{item.original_script ?
                                    (() => { try { return typeof item.original_script === 'string' && item.original_script.startsWith('{') ? JSON.parse(item.original_script).main_idea || item.original_script : item.original_script; } catch { return item.original_script; } })()
                                    : "Контент сгенерирован и ожидает проверки..."}"
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <Button 
                                size="sm" 
                                variant="outline"
                                className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                              onClick={() => onReject(item.id)}
                            >
                                Переделать
                            </Button>
                            <Button 
                                size="sm" 
                                className="h-8 text-xs gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => onManualPublish(item.id)}
                            >
                                <Send className="w-3 h-3" />
                                Опубликовать
                            </Button>
                        </div>
                    </Card>
                </motion.div>
            ))
          )}
      </div>
    </div>
  );
};

