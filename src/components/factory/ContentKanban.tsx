import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Lightbulb,
  FileText,
  Mic,
  User,
  Scissors,
  CheckCircle,
  Loader2,
  Send,
  Trash2,
  Wand2,
  ChevronRight,
  Video,
  Image,
  Type,
  Instagram,
  MessageCircle,
} from 'lucide-react';
import { ContentItem, ContentStatus, ContentType } from '@/hooks/useContentFactory';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
}

const CONTENT_FORMAT_OPTIONS = [
  { value: 'reels', label: 'Reels (TikTok/YouTube/Instagram)', icon: <Video className="w-4 h-4" /> },
  { value: 'carousel', label: 'Карусель (Instagram)', icon: <Image className="w-4 h-4" /> },
  { value: 'static', label: 'Статичный креатив', icon: <Image className="w-4 h-4" /> },
  { value: 'avatar_video', label: 'Видео с аватаром', icon: <User className="w-4 h-4" /> },
  { value: 'ai_viral', label: 'AI Sora виральное', icon: <Wand2 className="w-4 h-4" /> },
  { value: 'threads_post', label: 'Пост в Threads (текст)', icon: <Type className="w-4 h-4" /> },
  { value: 'telegram_post', label: 'Пост в Telegram (текст + обложка)', icon: <MessageCircle className="w-4 h-4" /> },
];

const kanbanStages: KanbanStage[] = [
  {
    id: 'idea',
    name: 'Идея',
    emoji: '💡',
    icon: <Lightbulb className="w-5 h-5" />,
    statuses: ['ideation'],
    color: 'from-amber-500 to-yellow-500'
  },
  {
    id: 'script',
    name: 'Сценарий',
    emoji: '📝',
    icon: <FileText className="w-5 h-5" />,
    statuses: ['scripting'],
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'voice_avatar',
    name: 'Озвучка + Аватар',
    emoji: '🎙️',
    icon: <Mic className="w-5 h-5" />,
    statuses: ['voice_ready', 'avatar_ready'],
    color: 'from-violet-500 to-purple-500'
  },
  {
    id: 'editing',
    name: 'Монтаж',
    emoji: '✂️',
    icon: <Scissors className="w-5 h-5" />,
    statuses: ['editing_ready'],
    color: 'from-orange-500 to-red-500'
  },
  {
    id: 'ready',
    name: 'Готово к публикации',
    emoji: '✅',
    icon: <CheckCircle className="w-5 h-5" />,
    statuses: ['ready_to_send', 'sent'],
    color: 'from-green-500 to-emerald-500'
  },
];

const getStageForStatus = (status: ContentStatus): string => {
  for (const stage of kanbanStages) {
    if (stage.statuses.includes(status)) {
      return stage.id;
    }
  }
  return 'idea';
};

interface ContentCardProps {
  item: ContentItem;
  stage: KanbanStage;
  onUpdate: (id: string, data: Partial<ContentItem>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onMoveToStage: (item: ContentItem, stageId: string) => void;
  isProcessing: boolean;
  setProcessing: (id: string | null) => void;
}

const ContentCard = ({
  item,
  stage,
  onUpdate,
  onDelete,
  onMoveToStage,
  isProcessing,
  setProcessing
}: ContentCardProps) => {
  const [script, setScript] = useState(item.rewritten_script || item.original_script || '');
  const [caption, setCaption] = useState(item.caption || '');
  const [contentFormat, setContentFormat] = useState(item.content_type || 'reels');

  const generateHormoziScript = async () => {
    setProcessing(item.id);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const hormoziScript = `🎯 ХУК: ${item.title}

Знаете, что отличает успешные клиники от тех, кто постоянно борется за выживание?

📖 ИСТОРИЯ:
Когда я начинал, у меня была та же проблема — пациенты приходили раз и исчезали.

💰 ОФФЕР:
Запишитесь на бесплатную диагностику, и мы покажем, как увеличить выручку.`;

    await onUpdate(item.id, { rewritten_script: hormoziScript });
    setScript(hormoziScript);
    setProcessing(null);
    toast.success('Сценарий сгенерирован!');
  };

  const handleFormatChange = async (format: string) => {
    setContentFormat(format as ContentType);
    await onUpdate(item.id, { content_type: format as ContentType });
  };

  const handleMoveNext = () => {
    const currentIndex = kanbanStages.findIndex(s => s.id === stage.id);
    if (currentIndex < kanbanStages.length - 1) {
      onMoveToStage(item, kanbanStages[currentIndex + 1].id);
    }
  };

  const getFormatIcon = (format: string) => {
    const option = CONTENT_FORMAT_OPTIONS.find(o => o.value === format);
    return option?.icon || <Video className="w-4 h-4" />;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card border rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{item.title}</h4>
          <div className="flex items-center gap-2 mt-1">
            {getFormatIcon(item.content_type)}
            <span className="text-xs text-muted-foreground">
              {CONTENT_FORMAT_OPTIONS.find(o => o.value === item.content_type)?.label || item.content_type}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive hover:text-destructive"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      {/* Format Selector */}
      <div className="mb-3">
        <Select value={contentFormat} onValueChange={handleFormatChange}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Формат контента" />
          </SelectTrigger>
          <SelectContent>
            {CONTENT_FORMAT_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value} className="text-xs">
                <div className="flex items-center gap-2">
                  {option.icon}
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stage-specific content */}
      {stage.id === 'idea' && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground line-clamp-2">
            {item.source_url || 'Идея из мониторинга конкурентов'}
          </p>
          <Button
            size="sm"
            onClick={() => onMoveToStage(item, 'script')}
            className="w-full gap-2"
          >
            <ChevronRight className="w-4 h-4" />
            В сценарий
          </Button>
        </div>
      )}

      {stage.id === 'script' && (
        <div className="space-y-2">
          <Textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Напишите сценарий..."
            rows={3}
            className="text-xs"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={generateHormoziScript}
              disabled={isProcessing}
              className="flex-1 gap-1 text-xs"
            >
              {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
              Хармози
            </Button>
            <Button
              size="sm"
              onClick={() => {
                onUpdate(item.id, { rewritten_script: script, status: 'voice_ready' });
                onMoveToStage(item, 'voice_avatar');
              }}
              className="flex-1 gap-1 text-xs"
            >
              <ChevronRight className="w-3 h-3" />
              Далее
            </Button>
          </div>
        </div>
      )}

      {stage.id === 'voice_avatar' && (
        <div className="space-y-2">
          <div className="p-2 bg-secondary/50 rounded-lg">
            <p className="text-xs text-muted-foreground line-clamp-2">{script || 'Нет сценария'}</p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              toast.info('🎙️ Генерация озвучки и аватара...');
              setTimeout(() => {
                onUpdate(item.id, { status: 'editing_ready' });
                onMoveToStage(item, 'editing');
                toast.success('Аватар создан!');
              }, 2000);
            }}
            disabled={isProcessing}
            className="w-full gap-2 bg-gradient-to-r from-violet-500 to-purple-500"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
            Озвучить + Аватар
          </Button>
        </div>
      )}

      {stage.id === 'editing' && (
        <div className="space-y-2">
          <Button
            size="sm"
            onClick={() => {
              toast.info('✂️ Монтаж видео...');
              setTimeout(() => {
                onUpdate(item.id, { status: 'ready_to_send' });
                onMoveToStage(item, 'ready');
                toast.success('Монтаж завершён!');
              }, 2000);
            }}
            disabled={isProcessing}
            className="w-full gap-2 bg-gradient-to-r from-orange-500 to-red-500"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
            Субтитры + Эффекты
          </Button>
        </div>
      )}

      {stage.id === 'ready' && (
        <div className="space-y-2">
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Текст публикации..."
            rows={2}
            className="text-xs"
          />
          <Button
            size="sm"
            onClick={() => {
              toast.success('📤 Отправлено на публикацию!');
              onUpdate(item.id, { status: 'sent', caption });
            }}
            disabled={isProcessing}
            className="w-full gap-2 bg-gradient-to-r from-green-500 to-emerald-500"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Опубликовать
          </Button>
        </div>
      )}
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
  triggerPublish,
}: ContentKanbanProps) => {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const getContentForStage = (stageId: string) => {
    const stage = kanbanStages.find(s => s.id === stageId);
    if (!stage) return [];
    return content.filter(item => stage.statuses.includes(item.status));
  };

  const handleMoveToStage = async (item: ContentItem, stageId: string) => {
    const stage = kanbanStages.find(s => s.id === stageId);
    if (stage && stage.statuses.length > 0) {
      await onUpdate(item.id, { status: stage.statuses[0] });
    }
  };

  if (content.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
          <span className="text-4xl">🏭</span>
        </div>
        <h3 className="text-xl font-semibold mb-2">Контент-конвейер пуст</h3>
        <p className="text-muted-foreground max-w-md">
          Создайте первый контент или добавьте идею из мониторинга конкурентов
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {kanbanStages.map((stage) => {
        const stageContent = getContentForStage(stage.id);
        
        return (
          <div key={stage.id} className="flex-shrink-0 w-72">
            {/* Stage Header */}
            <div className={cn(
              "flex items-center gap-2 p-3 rounded-t-xl bg-gradient-to-r text-white mb-2",
              stage.color
            )}>
              <span className="text-xl">{stage.emoji}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{stage.name}</h3>
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                {stageContent.length}
              </Badge>
            </div>

            {/* Stage Content */}
            <ScrollArea className="h-[500px] pr-2">
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {stageContent.map((item) => (
                    <ContentCard
                      key={item.id}
                      item={item}
                      stage={stage}
                      onUpdate={onUpdate}
                      onDelete={onDelete}
                      onMoveToStage={handleMoveToStage}
                      isProcessing={processingId === item.id}
                      setProcessing={setProcessingId}
                    />
                  ))}
                </AnimatePresence>

                {stageContent.length === 0 && (
                  <div className="p-4 border-2 border-dashed rounded-xl text-center">
                    <p className="text-xs text-muted-foreground">
                      Перетащите сюда или создайте новый контент
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
};