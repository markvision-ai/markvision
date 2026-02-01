import { ContentItem } from '@/hooks/useContentFactory';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  Video, 
  Images, 
  Type, 
  Send, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Activity,
  Box,
  FastForward,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface AssemblyLinesProps {
  items: ContentItem[];
  className?: string;
  logs?: any[];
  onRetry?: (id: string, lineId: string) => void;
  onForceComplete?: (id: string, lineId: string) => void;
}

const LINES = [
  { id: 'avatar', label: 'Цех Аватаров', icon: Bot, color: 'text-purple-500', bg: 'bg-purple-500/10', field_status: 'avatar_status' },
  { id: 'sora', label: 'Цех Sora', icon: Video, color: 'text-blue-500', bg: 'bg-blue-500/10', field_status: 'sora_status' },
  { id: 'carousel', label: 'Дизайн Цех', icon: Images, color: 'text-pink-500', bg: 'bg-pink-500/10', field_status: 'carousel_status' },
  { id: 'threads', label: 'Текстовый Цех', icon: Type, color: 'text-orange-500', bg: 'bg-orange-500/10', field_status: 'threads_status' },
  { id: 'telegram', label: 'Telegram Цех', icon: Send, color: 'text-sky-500', bg: 'bg-sky-500/10', field_status: 'telegram_status' },
  { id: 'article', label: 'Редакция', icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/10', field_status: 'article_status' }
];

export const AssemblyLines = ({ items, className, logs = [], onRetry, onForceComplete }: AssemblyLinesProps) => {
  const [consoleOpen, setConsoleOpen] = useState(true);

  return (
    <div className={cn("h-full flex flex-col bg-background relative overflow-hidden", className)}>
      {/* Header */}
      <div className="p-6 border-b border-border flex justify-between items-center bg-background/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <Activity className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">ГЛАВНЫЙ КОНВЕЙЕР</h2>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Активное производство: {items.length} ед.</p>
          </div>
        </div>
      </div>

      {/* Main Content Area - Vertical List of Active Units */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-48 custom-scrollbar">
        <AnimatePresence mode='popLayout'>
          {items.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="h-64 flex flex-col items-center justify-center text-muted-foreground/40 border border-dashed border-border/40 rounded-2xl bg-muted/20"
            >
              <Box className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm">Линии остановлены</p>
              <p className="text-xs opacity-50">Ожидание запуска конвейера...</p>
            </motion.div>
          ) : (
            items.map((item) => (
              <motion.div
                key={item.id}
                layoutId={`card-${item.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative bg-card border border-border rounded-2xl p-6 shadow-sm hover:border-blue-500/30 transition-all"
              >
                {/* Unit Header */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-border/40">
                  <div className="flex items-center gap-4">
                     <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center border border-border/40">
                        <span className="text-lg font-mono font-bold text-muted-foreground">{item.content_type?.slice(0, 2).toUpperCase() || 'ID'}</span>
                     </div>
                     <div>
                        <h3 className="text-base font-bold text-foreground leading-tight">{item.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                           <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-border/40 text-muted-foreground font-mono">
                              ID: {item.id.slice(0, 4)}
                           </Badge>
                           <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Запуск: {new Date(item.created_at).toLocaleTimeString()}</span>
                        </div>
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]" />
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">В РАБОТЕ</span>
                     </div>
                  </div>
                </div>

                {/* The 6 Horizontal Tracks */}
                <div className="grid grid-cols-1 gap-3">
                   {LINES.map((line, idx) => {
                      const statusKey = line.field_status as keyof ContentItem;
                      const status = (item[statusKey] as string) || 'idle';
                      const isProcessing = status === 'processing' || status === 'generating';
                      const isCompleted = status === 'completed' || status === 'ready';
                      const isFailed = status === 'failed';

                      return (
                        <div key={line.id} className="relative h-14 bg-muted/30 border border-border/40 rounded-xl flex items-center px-4 overflow-hidden group/track">
                           {/* Animated Background Progress for Processing */}
                           {isProcessing && (
                             <motion.div 
                               className={cn("absolute inset-0 opacity-10", line.bg.replace('/10', '/30'))}
                               initial={{ x: '-100%' }}
                               animate={{ x: '100%' }}
                               transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                             />
                           )}
                           
                           {/* Completed Background */}
                           {isCompleted && (
                              <div className={cn("absolute inset-0 opacity-5", line.bg)} />
                           )}

                           {/* Icon Box */}
                           <div className={cn(
                             "w-8 h-8 rounded-lg flex items-center justify-center mr-4 relative z-10 transition-colors",
                             isProcessing ? "bg-background/80 text-foreground" : "bg-muted text-muted-foreground",
                             isCompleted && "bg-green-500/20 text-green-500",
                             isFailed && "bg-red-500/20 text-red-500"
                           )}>
                              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                               isCompleted ? <CheckCircle2 className="w-4 h-4" /> :
                               isFailed ? <AlertCircle className="w-4 h-4" /> :
                               <line.icon className="w-4 h-4" />}
                           </div>

                           {/* Track Info */}
                           <div className="flex-1 z-10">
                              <div className="flex justify-between items-center mb-1">
                                 <span className={cn(
                                   "text-xs font-bold uppercase tracking-wider",
                                   isProcessing ? "text-foreground" : "text-muted-foreground"
                                 )}>
                                   {line.label}
                                 </span>
                                 <span className={cn(
                                   "text-[9px] font-mono",
                                   isProcessing ? line.color : "text-muted-foreground/50"
                                 )}>
                                   {status.toUpperCase()}
                                 </span>
                              </div>
                              
                              {/* Progress Bar */}
                              <div className="h-1 w-full bg-muted/50 rounded-full overflow-hidden">
                                 <motion.div 
                                    className={cn("h-full shadow-[0_0_10px_currentColor]", isFailed ? "bg-red-500" : isCompleted ? "bg-green-500" : line.color.replace('text-', 'bg-'))}
                                    initial={{ width: 0 }}
                                    animate={{ width: isCompleted ? '100%' : isProcessing ? '60%' : '0%' }}
                                    transition={{ duration: 0.5 }}
                                 />
                              </div>
                           </div>

                           {/* Actions (Hover) */}
                           <div className="ml-4 opacity-0 group-hover/track:opacity-100 transition-opacity flex gap-2 z-20">
                              {isFailed && onRetry && (
                                <Button size="icon" variant="ghost" className="h-6 w-6 hover:bg-muted text-muted-foreground hover:text-foreground" onClick={() => onRetry(item.id, line.id)}>
                                  <RefreshCw className="w-3 h-3" />
                                </Button>
                              )}
                              {isProcessing && onForceComplete && (
                                <Button size="icon" variant="ghost" className="h-6 w-6 hover:bg-muted text-muted-foreground hover:text-foreground" onClick={() => onForceComplete(item.id, line.id)}>
                                  <FastForward className="w-3 h-3" />
                                </Button>
                              )}
                           </div>
                        </div>
                      );
                   })}
                </div>

              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

