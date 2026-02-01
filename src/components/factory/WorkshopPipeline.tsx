import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Upload,
  BrainCircuit,
  Rocket,
  Sparkles,
  ChevronRight,
  Loader2,
  Video,
  Image,
  Type,
  MessageCircle,
  User,
  Wand2
} from 'lucide-react';
import { ContentItem, ContentStatus } from '@/hooks/useContentFactory';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface WorkshopPipelineProps {
  content: ContentItem[];
  projectId: string | null;
  onUpdate: (id: string, data: Partial<ContentItem>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  triggerVoice: (contentId: string, script: string, voiceSettings?: Record<string, unknown>) => Promise<boolean>;
  triggerAvatar: (contentId: string, audioUrl: string, avatarId?: string) => Promise<boolean>;
  triggerEdit: (contentId: string, videoUrl: string, captionsStyle?: string) => Promise<boolean>;
  triggerPublish: (contentId: string, finalVideoUrl: string, caption: string, platforms: string[]) => Promise<boolean>;
}

interface Workshop {
  id: number;
  name: string;
  emoji: string;
  icon: React.ReactNode;
  statuses: ContentStatus[];
  description: string;
  color: string;
  bgGradient: string;
}

const workshops: Workshop[] = [
  { 
    id: 1, 
    name: 'Загрузка', 
    emoji: '📥', 
    icon: <Upload className="w-5 h-5" />,
    statuses: ['ideation', 'scripting'],
    description: 'Идеи, сценарии и подготовка',
    color: 'text-blue-400',
    bgGradient: 'from-blue-500/20 to-cyan-500/20'
  },
  { 
    id: 2, 
    name: 'AI Анализ', 
    emoji: '🤖', 
    icon: <BrainCircuit className="w-5 h-5" />,
    statuses: ['voice_ready', 'avatar_ready', 'editing_ready'],
    description: 'Генерация, озвучка и монтаж',
    color: 'text-violet-400',
    bgGradient: 'from-violet-500/20 to-purple-500/20'
  },
  { 
    id: 3, 
    name: 'Готово', 
    emoji: '✨', 
    icon: <Rocket className="w-5 h-5" />,
    statuses: ['ready_to_send', 'sent'],
    description: 'Финальная проверка и отправка',
    color: 'text-emerald-400',
    bgGradient: 'from-emerald-500/20 to-teal-500/20'
  }
];

const getWorkshopForStatus = (status: ContentStatus): number => {
  const workshop = workshops.find(w => w.statuses.includes(status));
  return workshop ? workshop.id : 1;
};

interface ContentCardWorkshopProps {
  item: ContentItem;
  workshop: Workshop;
  onUpdate: (id: string, data: Partial<ContentItem>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onMoveNext: (item: ContentItem) => void;
  isProcessing: boolean;
  setProcessing: (id: string | null) => void;
}

const ContentCardWorkshop = ({ 
  item, 
  workshop, 
  onUpdate, 
  onMoveNext,
  isProcessing,
  setProcessing 
}: ContentCardWorkshopProps) => {
  
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

  const getFormatLabel = (format: string) => {
    switch (format) {
      case 'reels': return 'Reels';
      case 'carousel': return 'Carousel';
      case 'static': return 'Post';
      case 'avatar_video': return 'Avatar';
      case 'ai_viral': return 'Viral';
      case 'threads_post': return 'Threads';
      case 'telegram_post': return 'Telegram';
      default: return format;
    }
  };

  const generateHormoziScript = async () => {
    setProcessing(item.id);
    // Simulate AI generation - in production this would call an Edge Function with Claude
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const hormoziScript = `🎯 ХУК: ${item.title}

Знаете, что отличает успешные клиники от тех, кто постоянно борется за выживание?

📖 ИСТОРИЯ:
Когда я начинал, у меня была та же проблема — пациенты приходили раз и исчезали. Я тратил тысячи на рекламу, но возврат инвестиций был минимальным.

Потом я понял одну простую вещь: дело не в количестве пациентов, а в системе, которая превращает каждого посетителя в постоянного клиента.

💰 ОФФЕР:
Запишитесь на бесплатную диагностику, и мы покажем, как увеличить выручку на 500 000 ₸ в день, без увеличения рекламного бюджета.

Ссылка в шапке профиля. Количество мест ограничено.`;

    await onUpdate(item.id, { rewritten_script: hormoziScript });
    setProcessing(null);
    toast.success('Сценарий сгенерирован по методу Хармози!');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-card/40 backdrop-blur-md border border-border rounded-xl p-4 hover:border-violet-500/20 hover:shadow-[0_0_20px_-10px_rgba(124,58,237,0.2)] transition-all duration-300 group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <Badge variant="outline" className="bg-muted/10 border-border text-muted-foreground gap-1.5 font-normal px-2 py-1">
          {getFormatIcon(item.content_type)}
          {getFormatLabel(item.content_type)}
        </Badge>
        <span className="text-[10px] text-muted-foreground font-mono">
          {format(new Date(item.created_at), 'dd MMM', { locale: ru })}
        </span>
      </div>

      <h3 className="text-white font-medium text-base mb-4 leading-tight group-hover:text-violet-300 transition-colors">
        {item.title}
      </h3>

      <div className="flex flex-wrap items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={generateHormoziScript}
          disabled={!!isProcessing}
          className="h-8 bg-muted/10 hover:bg-violet-500/20 hover:text-violet-300 text-muted-foreground border border-border hover:border-violet-500/30 transition-all text-xs gap-1.5"
        >
          {isProcessing ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Sparkles className="w-3 h-3" />
          )}
          AI Рерайт
        </Button>

        {workshop.id === 1 && (
          <Button 
             variant="ghost" 
             size="sm"
             onClick={() => onMoveNext(item)}
             className="h-8 ml-auto bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs gap-1.5"
          >
            В работу <ChevronRight className="w-3 h-3" />
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export const WorkshopPipeline = ({
  content,
  projectId,
  onUpdate,
  onDelete,
  triggerVoice,
  triggerAvatar,
  triggerEdit,
  triggerPublish
}: WorkshopPipelineProps) => {
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Filter content by projectId if provided
  const filteredContent = content.filter(c => !projectId || c.project_id === projectId);

  const getWorkshopContent = (workshopId: number) => {
    const workshop = workshops.find(w => w.id === workshopId);
    if (!workshop) return [];
    return filteredContent.filter(item => workshop.statuses.includes(item.status));
  };

  const handleMoveNext = async (item: ContentItem) => {
    // Simple logic to move to next stage (for demo purposes)
    // Ideally this would be more complex based on current status
    if (item.status === 'ideation') {
      await onUpdate(item.id, { status: 'scripting' });
    } else if (item.status === 'scripting') {
      await onUpdate(item.id, { status: 'voice_ready' });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
      {workshops.map((workshop) => (
        <div 
          key={workshop.id} 
          className="flex flex-col bg-black/20 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden"
        >
          {/* Column Header */}
          <div className={`p-4 border-b border-white/5 bg-gradient-to-b ${workshop.bgGradient}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg bg-black/20 ${workshop.color}`}>
                  {workshop.icon}
                </div>
                <h3 className={`font-semibold ${workshop.color}`}>
                  {workshop.name}
                </h3>
              </div>
              <Badge className="bg-black/20 text-white border-white/10">
                {getWorkshopContent(workshop.id).length}
              </Badge>
            </div>
            <p className="text-xs text-white/40 ml-1">
              {workshop.description}
            </p>
          </div>

          {/* Content List */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {getWorkshopContent(workshop.id).map((item) => (
                  <ContentCardWorkshop
                    key={item.id}
                    item={item}
                    workshop={workshop}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    onMoveNext={handleMoveNext}
                    isProcessing={processingId === item.id}
                    setProcessing={setProcessingId}
                  />
                ))}
              </AnimatePresence>
              
              {getWorkshopContent(workshop.id).length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground/50 border-2 border-dashed border-border rounded-xl">
                  {workshop.icon}
                  <p className="text-sm mt-2">Нет задач</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      ))}
    </div>
  );
};
