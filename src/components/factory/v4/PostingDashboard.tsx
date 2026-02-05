import React from 'react';
import { useFactoryStore, PostingItem } from './store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Youtube,
  MessageCircle,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PostingDashboard = () => {
  const { postingQueue } = useFactoryStore();

  return (
    <div className="w-80 flex flex-col h-full bg-muted/5 border-l border-border">
      <div className="p-5 border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
          <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-md">
            <Send className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          Станция Дистрибуции
        </h3>
        <p className="text-xs text-muted-foreground mt-1 ml-9">
          Мониторинг статусов публикации контента
        </p>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {postingQueue.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                layout
              >
                <PostingCard item={item} />
              </motion.div>
            ))}
          </AnimatePresence>
          
          {postingQueue.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center py-12 px-4 border-2 border-dashed border-muted-foreground/20 rounded-xl bg-muted/5 mx-2">
              <Globe className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-foreground">Очередь пуста</p>
              <p className="text-xs text-muted-foreground mt-1">
                Утвердите готовый контент в центре генерации
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

const PostingCard = ({ item }: { item: PostingItem }) => {
  const getIcon = (channel: string) => {
    if (channel.includes('YouTube') || channel.includes('TikTok')) return <Youtube className="w-4 h-4" />;
    if (channel.includes('Telegram') || channel.includes('Threads')) return <MessageCircle className="w-4 h-4" />;
    return <Globe className="w-4 h-4" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-muted text-muted-foreground border-border';
      case 'sending': return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30';
      case 'published': return 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/30';
      case 'error': return 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="bg-card hover:bg-background border border-border hover:border-border/80 rounded-xl p-4 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center text-foreground group-hover:scale-110 transition-transform duration-300">
            {getIcon(item.channel)}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground line-clamp-1">{item.channel}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        
        <div>
          {item.status === 'pending' && <Clock className="w-5 h-5 text-muted-foreground/50" />}
          {item.status === 'sending' && <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />}
          {item.status === 'published' && <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-green-400" />}
          {item.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />}
        </div>
      </div>

      <div className={`text-xs px-3 py-2 rounded-md border font-medium flex items-center justify-between ${getStatusColor(item.status)}`}>
        <span>
          {item.status === 'pending' && 'Ожидает отправки'}
          {item.status === 'sending' && 'Публикация...'}
          {item.status === 'published' && 'Успешно опубликовано'}
          {item.status === 'error' && 'Ошибка публикации'}
        </span>
      </div>
    </div>
  );
};
