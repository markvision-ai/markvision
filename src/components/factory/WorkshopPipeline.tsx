import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  FileText,
  Mic,
  User,
  Scissors,
  Sparkles,
  CheckCircle,
  Play,
  Pause,
  Loader2,
  Send,
  ChevronRight,
  Trash2,
  RotateCcw,
  Wand2,
} from 'lucide-react';
import { ContentItem, ContentStatus } from '@/hooks/useContentFactory';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
  status: ContentStatus;
  description: string;
  color: string;
}

const workshops: Workshop[] = [
  { 
    id: 1, 
    name: 'Сценарий', 
    emoji: '📝', 
    icon: <FileText className="w-5 h-5" />,
    status: 'ideation',
    description: 'Создание и редактирование сценария',
    color: 'from-blue-500 to-cyan-500'
  },
  { 
    id: 2, 
    name: 'Озвучка', 
    emoji: '🔊', 
    icon: <Mic className="w-5 h-5" />,
    status: 'scripting',
    description: 'Генерация голоса ElevenLabs',
    color: 'from-violet-500 to-purple-500'
  },
  { 
    id: 3, 
    name: 'Аватар', 
    emoji: '👤', 
    icon: <User className="w-5 h-5" />,
    status: 'voice_ready',
    description: 'Создание видео с HeyGen',
    color: 'from-pink-500 to-rose-500'
  },
  { 
    id: 4, 
    name: 'Монтаж', 
    emoji: '✂️', 
    icon: <Scissors className="w-5 h-5" />,
    status: 'avatar_ready',
    description: 'Субтитры и эффекты Submagic',
    color: 'from-orange-500 to-amber-500'
  },
  { 
    id: 5, 
    name: 'Виральность', 
    emoji: '🚀', 
    icon: <Sparkles className="w-5 h-5" />,
    status: 'editing_ready',
    description: 'Sora 2: виральный фон',
    color: 'from-green-500 to-emerald-500'
  },
  { 
    id: 6, 
    name: 'Готово', 
    emoji: '✅', 
    icon: <CheckCircle className="w-5 h-5" />,
    status: 'ready_to_send',
    description: 'Предпросмотр и публикация',
    color: 'from-teal-500 to-cyan-500'
  },
];

const getWorkshopForStatus = (status: ContentStatus): number => {
  const mapping: Record<ContentStatus, number> = {
    ideation: 1,
    scripting: 2,
    voice_ready: 3,
    avatar_ready: 4,
    editing_ready: 5,
    ready_to_send: 6,
    sent: 6,
  };
  return mapping[status] || 1;
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
  onDelete,
  onMoveNext,
  isProcessing,
  setProcessing 
}: ContentCardWorkshopProps) => {
  const [script, setScript] = useState(item.rewritten_script || item.original_script || '');
  const [caption, setCaption] = useState(item.caption || '');
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const generateHormoziScript = async () => {
    setProcessing(item.id);
    // Simulate AI generation
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
    setScript(hormoziScript);
    setProcessing(null);
    toast.success('Сценарий сгенерирован по методу Хармози!');
  };

  const handleVoiceGeneration = async () => {
    if (!script.trim()) {
      toast.error('Сначала напишите сценарий');
      return;
    }
    setProcessing(item.id);
    toast.info('🔊 Отправлено в ElevenLabs (Голос Юрия)...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Simulate audio generation
    const mockAudioUrl = 'https://example.com/audio.mp3';
    await onUpdate(item.id, { 
      audio_url: mockAudioUrl, 
      rewritten_script: script,
      status: 'voice_ready' 
    });
    setProcessing(null);
    toast.success('Озвучка готова!');
  };

  const handleAvatarGeneration = async () => {
    setProcessing(item.id);
    toast.info('👤 Создаём видео-аватара в HeyGen...');
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    const mockVideoUrl = 'https://example.com/avatar.mp4';
    await onUpdate(item.id, { 
      raw_video_url: mockVideoUrl,
      status: 'avatar_ready' 
    });
    setProcessing(null);
    toast.success('Видео-аватар создан!');
  };

  const handleEditGeneration = async () => {
    setProcessing(item.id);
    toast.info('✂️ Накладываем субтитры и эффекты...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await onUpdate(item.id, { status: 'editing_ready' });
    setProcessing(null);
    toast.success('Монтаж завершён!');
  };

  const handleViralBackground = async () => {
    setProcessing(item.id);
    toast.info('🚀 Sora 2: Создаём виральный фон...');
    await new Promise(resolve => setTimeout(resolve, 3500));
    
    const mockFinalUrl = 'https://example.com/final.mp4';
    await onUpdate(item.id, { 
      final_video_url: mockFinalUrl,
      status: 'ready_to_send' 
    });
    setProcessing(null);
    toast.success('Виральный фон создан!');
  };

  const handlePublish = async () => {
    setProcessing(item.id);
    toast.info('📤 Отправляем в Telegram...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await onUpdate(item.id, { 
      status: 'sent',
      caption: caption 
    });
    setProcessing(null);
    toast.success('Контент отправлен в Telegram!');
  };

  const renderWorkshopContent = () => {
    switch (workshop.id) {
      case 1: // Сценарий
        return (
          <div className="space-y-3">
            <Textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Напишите сценарий или нажмите кнопку для генерации..."
              rows={4}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={generateHormoziScript}
                disabled={isProcessing}
                className="gap-2 flex-1 bg-gradient-to-r from-violet-600 to-purple-600"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                Сгенерировать по Хармози
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onUpdate(item.id, { rewritten_script: script })}
              >
                Сохранить
              </Button>
            </div>
          </div>
        );

      case 2: // Озвучка
        return (
          <div className="space-y-3">
            <div className="p-3 bg-secondary/50 rounded-lg text-sm">
              <p className="text-muted-foreground line-clamp-3">{script || 'Нет сценария'}</p>
            </div>
            <Button 
              size="sm" 
              onClick={handleVoiceGeneration}
              disabled={isProcessing || !script.trim()}
              className="gap-2 w-full bg-gradient-to-r from-violet-500 to-purple-500"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
              🔊 Озвучить (Голос Юрия)
            </Button>
            {item.audio_url && (
              <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8"
                  onClick={() => {
                    if (audioRef.current) {
                      if (isPlaying) {
                        audioRef.current.pause();
                      } else {
                        audioRef.current.play();
                      }
                      setIsPlaying(!isPlaying);
                    }
                  }}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <audio ref={audioRef} src={item.audio_url} onEnded={() => setIsPlaying(false)} />
                <span className="text-sm text-green-600">Аудио готово</span>
              </div>
            )}
          </div>
        );

      case 3: // Аватар
        return (
          <div className="space-y-3">
            <Button 
              size="sm" 
              onClick={handleAvatarGeneration}
              disabled={isProcessing || !item.audio_url}
              className="gap-2 w-full bg-gradient-to-r from-pink-500 to-rose-500"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
              👤 Создать видео-аватара
            </Button>
            {item.raw_video_url && (
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video src={item.raw_video_url} controls className="w-full h-full" />
              </div>
            )}
            {isProcessing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Рендеринг видео...
              </div>
            )}
          </div>
        );

      case 4: // Монтаж
        return (
          <div className="space-y-3">
            <Button 
              size="sm" 
              onClick={handleEditGeneration}
              disabled={isProcessing || !item.raw_video_url}
              className="gap-2 w-full bg-gradient-to-r from-orange-500 to-amber-500"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
              ✂️ Наложить субтитры и эффекты
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Стиль Submagic: анимированные субтитры, emoji, звуковые эффекты
            </p>
          </div>
        );

      case 5: // Виральность
        return (
          <div className="space-y-3">
            <Button 
              size="sm" 
              onClick={handleViralBackground}
              disabled={isProcessing}
              className="gap-2 w-full bg-gradient-to-r from-green-500 to-emerald-500"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              🚀 Sora 2: Создать виральный фон
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Генерация 5-сек видео-перебивки для повышения вовлечённости
            </p>
          </div>
        );

      case 6: // Готово
        return (
          <div className="space-y-3">
            {item.final_video_url && (
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video src={item.final_video_url} controls className="w-full h-full" />
              </div>
            )}
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Текст для публикации..."
              rows={2}
              className="text-sm"
            />
            <Button 
              size="sm" 
              onClick={handlePublish}
              disabled={isProcessing}
              className="gap-2 w-full bg-gradient-to-r from-teal-500 to-cyan-500"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              ✅ Одобрить и отправить в Telegram
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="bg-card border rounded-xl p-3 min-w-[280px] max-w-[320px] shadow-lg"
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-sm truncate flex-1">{item.title}</h4>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive hover:text-destructive"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
      
      {renderWorkshopContent()}
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
  triggerPublish,
}: WorkshopPipelineProps) => {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const getContentForWorkshop = (workshopId: number) => {
    return content.filter(item => getWorkshopForStatus(item.status) === workshopId);
  };

  const handleMoveNext = async (item: ContentItem) => {
    const currentWorkshop = getWorkshopForStatus(item.status);
    if (currentWorkshop < 6) {
      const nextStatus = workshops[currentWorkshop].status;
      await onUpdate(item.id, { status: nextStatus });
    }
  };

  if (content.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
          <span className="text-4xl">🏭</span>
        </div>
        <h3 className="text-xl font-semibold mb-2">Производственная линия пуста</h3>
        <p className="text-muted-foreground max-w-md">
          Создайте первый контент или добавьте идею из мониторинга конкурентов
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4 min-w-max">
          {workshops.map((workshop, index) => (
            <div key={workshop.id} className="flex items-start">
              <div className="flex flex-col min-w-[320px]">
                {/* Workshop Header */}
                <div className={cn(
                  "flex items-center gap-3 p-3 rounded-t-xl bg-gradient-to-r text-white",
                  workshop.color
                )}>
                  <span className="text-2xl">{workshop.emoji}</span>
                  <div>
                    <h3 className="font-semibold">Цех {workshop.id}: {workshop.name}</h3>
                    <p className="text-xs text-white/80">{workshop.description}</p>
                  </div>
                </div>

                {/* Workshop Content */}
                <div className="flex-1 bg-secondary/30 rounded-b-xl p-3 min-h-[300px] space-y-3">
                  <AnimatePresence mode="popLayout">
                    {getContentForWorkshop(workshop.id).map(item => (
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
                  
                  {getContentForWorkshop(workshop.id).length === 0 && (
                    <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                      Нет контента
                    </div>
                  )}
                </div>
              </div>

              {/* Arrow between workshops */}
              {index < workshops.length - 1 && (
                <div className="flex items-center justify-center px-2 pt-20">
                  <ChevronRight className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </TooltipProvider>
  );
};
