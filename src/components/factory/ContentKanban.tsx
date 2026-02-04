import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Lightbulb,
  FileText,
  Mic,
  User,
  Scissors,
  CheckCircle,
  Loader2,
  Send,
  Wand2,
  Video,
  Image,
  Type,
  MessageCircle,
  Sparkles
} from 'lucide-react';
import { ContentItem, ContentStatus, ContentType } from '@/hooks/useContentFactory';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ContentKanbanProps {
  content: ContentItem[];
  projectId: string | null;
  onUpdate: (id: string, data: Partial<ContentItem>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  triggerVoice: (contentId: string, script: string, voiceSettings?: Record<string, unknown>) => Promise<boolean>;
  triggerAvatar: (contentId: string, audioUrl: string, avatarId?: string) => Promise<boolean>;
  triggerEdit: (contentId: string, videoUrl: string, captionsStyle?: string) => Promise<boolean>;
  triggerPublish: (contentId: string, finalVideoUrl: string, caption: string, platforms: string[]) => Promise<boolean>;
}

interface KanbanStage {
  id: string;
  name: string;
  emoji: string;
  icon: React.ReactNode;
  statuses: ContentStatus[];
  color: string;
  bgGradient: string;
}

const kanbanStages: KanbanStage[] = [
  {
    id: 'idea',
    name: 'Идея',
    emoji: '💡',
    icon: <Lightbulb className="w-4 h-4" />,
    statuses: ['ideation'],
    color: 'text-amber-400',
    bgGradient: 'from-amber-500/20 to-yellow-500/20'
  },
  {
    id: 'script',
    name: 'Сценарий',
    emoji: '📝',
    icon: <FileText className="w-4 h-4" />,
    statuses: ['scripting'],
    color: 'text-blue-400',
    bgGradient: 'from-blue-500/20 to-cyan-500/20'
  },
  {
    id: 'voice',
    name: 'Озвучка',
    emoji: '🎙️',
    icon: <Mic className="w-4 h-4" />,
    statuses: ['voice_ready'],
    color: 'text-violet-400',
    bgGradient: 'from-violet-500/20 to-purple-500/20'
  },
  {
    id: 'avatar',
    name: 'Аватар',
    emoji: '👤',
    icon: <User className="w-4 h-4" />,
    statuses: ['avatar_ready'],
    color: 'text-pink-400',
    bgGradient: 'from-pink-500/20 to-rose-500/20'
  },
  {
    id: 'editing',
    name: 'Монтаж',
    emoji: '✂️',
    icon: <Scissors className="w-4 h-4" />,
    statuses: ['editing_ready'],
    color: 'text-orange-400',
    bgGradient: 'from-orange-500/20 to-red-500/20'
  },
  {
    id: 'ready',
    name: 'Готово',
    emoji: '✅',
    icon: <CheckCircle className="w-4 h-4" />,
    statuses: ['ready_to_send'],
    color: 'text-emerald-400',
    bgGradient: 'from-emerald-500/20 to-green-500/20'
  },
  {
    id: 'sent',
    name: 'Опубликовано',
    emoji: '🚀',
    icon: <Send className="w-4 h-4" />,
    statuses: ['sent'],
    color: 'text-sky-400',
    bgGradient: 'from-sky-500/20 to-indigo-500/20'
  }
];

interface ContentCardProps {
  item: ContentItem;
  onUpdate: (id: string, data: Partial<ContentItem>) => Promise<boolean>;
  isProcessing: boolean;
  setProcessing: (id: string | null) => void;
}

const ContentCard = ({
  item,
  onUpdate,
  isProcessing,
  setProcessing
}: ContentCardProps) => {
  
  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'reels': return <Video className="w-3 h-3" />;
      case 'carousel': return <Image className="w-3 h-3" />;
      case 'static': return <Image className="w-3 h-3" />;
      case 'avatar_video': return <User className="w-3 h-3" />;
      case 'ai_viral': return <Wand2 className="w-3 h-3" />;
      case 'threads_post': return <Type className="w-3 h-3" />;
      case 'telegram_post': return <MessageCircle className="w-3 h-3" />;
      default: return <Video className="w-3 h-3" />;
    }
  };

  const generateHormoziScript = async () => {
    setProcessing(item.id);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const hormoziScript = `🎯 ХУК: ${item.title}

🔥 ИСТОРИЯ/БОЛЬ:
Многие думают, что главное — это трафик, но на самом деле...

💡 РЕШЕНИЕ:
Мы используем подход, который...

💰 ОФФЕР:
Запишитесь на бесплатный визит, и мы покажем, как увеличить выручку.

👇 ПРИЗЫВ:
Пишите "ВИЗИТ" в комментариях!`;

    await onUpdate(item.id, { rewritten_script: hormoziScript });
    setProcessing(null);
    toast.success('Сценарий сгенерирован!');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-xl p-3 hover:border-violet-500/20 hover:shadow-[0_0_20px_-10px_rgba(124,58,237,0.2)] transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-muted/10 border-border text-muted-foreground gap-1 font-normal">
          {getFormatIcon(item.content_type)}
          {item.content_type}
        </Badge>
        <span className="text-[10px] text-white/30 font-mono">
          {format(new Date(item.created_at), 'dd MMM', { locale: ru })}
        </span>
      </div>
      
      <h4 className="font-medium text-sm text-white/90 mb-2 leading-tight group-hover:text-violet-300 transition-colors">
        {item.title}
      </h4>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-white/40 hover:text-violet-400 hover:bg-violet-500/10"
          onClick={generateHormoziScript}
          disabled={!!isProcessing}
        >
           {isProcessing === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
        </Button>
      </div>
    </motion.div>
  );
};

export const ContentKanban = ({
  content,
  projectId,
  onUpdate,
  onDelete,
  triggerVoice,
  triggerAvatar,
  triggerEdit,
  triggerPublish
}: ContentKanbanProps) => {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filteredContent = content.filter(c => !projectId || c.project_id === projectId);

  const getContentForStage = (stage: KanbanStage) => {
    return filteredContent.filter(item => stage.statuses.includes(item.status));
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-200px)]">
      {kanbanStages.map((stage) => (
        <div 
          key={stage.id} 
          className="flex-shrink-0 w-72 flex flex-col bg-black/20 backdrop-blur-sm rounded-xl border border-white/5"
        >
          {/* Header */}
          <div className={`p-3 border-b border-white/5 bg-gradient-to-b ${stage.bgGradient}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{stage.emoji}</span>
                <span className={`font-medium text-sm ${stage.color}`}>{stage.name}</span>
              </div>
              <Badge className="bg-black/20 text-white border-white/10 text-xs">
                {getContentForStage(stage).length}
              </Badge>
            </div>
          </div>

          {/* List */}
          <ScrollArea className="flex-1 p-2">
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {getContentForStage(stage).map((item) => (
                  <ContentCard
                    key={item.id}
                    item={item}
                    onUpdate={onUpdate}
                    isProcessing={processingId === item.id}
                    setProcessing={setProcessingId}
                  />
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>
      ))}
    </div>
  );
};
