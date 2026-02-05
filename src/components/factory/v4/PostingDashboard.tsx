import React from 'react';
import { useFactoryStore, PostingItem } from './store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ExternalLink,
  Youtube,
  MessageCircle,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PostingDashboard = () => {
  const { postingQueue } = useFactoryStore();

  return (
    <div className="w-80 border-l border-slate-200 bg-slate-50/50 flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 bg-white/50 backdrop-blur-sm">
        <h3 className="font-semibold flex items-center gap-2">
          <Send className="w-5 h-5 text-indigo-600" />
          Станция Дистрибуции
        </h3>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          <AnimatePresence>
            {postingQueue.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <PostingCard item={item} />
              </motion.div>
            ))}
          </AnimatePresence>
          
          {postingQueue.length === 0 && (
            <div className="text-center text-slate-400 py-10 text-sm">
              Очередь публикации пуста
              <br />
              Утвердите контент в центре
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

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
          {getIcon(item.channel)}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium">{item.channel}</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">
            {item.status === 'pending' && 'В очереди'}
            {item.status === 'sending' && 'Отправка...'}
            {item.status === 'published' && 'Опубликовано'}
            {item.status === 'error' && 'Ошибка'}
          </span>
        </div>
      </div>

      <div>
        {item.status === 'pending' && <Clock className="w-4 h-4 text-slate-400" />}
        {item.status === 'sending' && <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />}
        {item.status === 'published' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
        {item.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
      </div>
    </div>
  );
};
