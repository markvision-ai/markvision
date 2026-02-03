// @ts-nocheck
import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Video,
  Image,
  MessageSquare,
  Send,
  Mic,
  Film,
  Scissors,
  CheckCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Eye,
  Users,
  DollarSign,
  Sparkles,
  Bot,
  MoreHorizontal,
  Globe
} from 'lucide-react';
import { ContentItem, ContentType, ContentStatus } from '@/hooks/useContentFactory';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ContentCardProps {
  item: ContentItem;
  onUpdate: (id: string, data: Partial<ContentItem>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  triggerVoice: (contentId: string, script: string, voiceSettings?: Record<string, unknown>) => Promise<boolean>;
  triggerAvatar: (contentId: string, audioUrl: string, avatarId?: string) => Promise<boolean>;
  triggerAiVideo: (contentId: string, script: string, style?: string) => Promise<boolean>;
  triggerEdit: (contentId: string, videoUrl: string, captionsStyle?: string) => Promise<boolean>;
  triggerPublish: (contentId: string, finalVideoUrl: string, caption: string, platforms: string[]) => Promise<boolean>;
}

const contentTypeConfig: Record<ContentType, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
  avatar_video: { 
    label: 'Аватар видео', 
    icon: <Video className="w-4 h-4" />, 
    bg: 'bg-blue-500/10', 
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800/30'
  },
  ai_video: { 
    label: 'AI Видео', 
    icon: <Film className="w-4 h-4" />, 
    bg: 'bg-purple-500/10', 
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800/30'
  },
  static_post: { 
    label: 'Статичный пост', 
    icon: <Image className="w-4 h-4" />, 
    bg: 'bg-green-500/10', 
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800/30'
  },
  carousel: { 
    label: 'Карусель', 
    icon: <Image className="w-4 h-4" />, 
    bg: 'bg-orange-500/10', 
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800/30'
  },
  threads: { 
    label: 'Threads', 
    icon: <MessageSquare className="w-4 h-4" />, 
    bg: 'bg-pink-500/10', 
    text: 'text-pink-600 dark:text-pink-400',
    border: 'border-pink-200 dark:border-pink-800/30'
  },
  tg_text: { 
    label: 'Telegram', 
    icon: <Send className="w-4 h-4" />, 
    bg: 'bg-sky-500/10', 
    text: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-200 dark:border-sky-800/30'
  },
};

const statusConfig: Record<ContentStatus, { label: string; step: number }> = {
  ideation: { label: 'Идея', step: 0 },
  scripting: { label: 'Сценарий', step: 1 },
  voice_ready: { label: 'Озвучка готова', step: 2 },
  avatar_ready: { label: 'Видео готово', step: 3 },
  editing_ready: { label: 'Монтаж готов', step: 4 },
  ready_to_send: { label: 'Готово к отправке', step: 5 },
  sent: { label: 'Отправлено', step: 6 },
};

const getStepsForType = (type: ContentType): string[] => {
  switch (type) {
    case 'avatar_video':
      return ['Сценарий', 'Озвучка', 'Аватар', 'Монтаж', 'Публикация'];
    case 'ai_video':
      return ['Сценарий', 'AI Видео', 'Монтаж', 'Публикация'];
    case 'carousel':
      return ['Промпты', 'Генерация', 'Публикация'];
    case 'threads':
    case 'tg_text':
      return ['Текст', 'Публикация'];
    default:
      return ['Контент', 'Публикация'];
  }
};

export const ContentCard = ({
  item,
  onUpdate,
  onDelete,
  triggerVoice,
  triggerAvatar,
  triggerAiVideo,
  triggerEdit,
  triggerPublish,
}: ContentCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [script, setScript] = useState(item.rewritten_script || item.original_script || '');
  const [caption, setCaption] = useState(item.caption || '');
  const [isPlaying, setIsPlaying] = useState(false);

  const typeConfig = contentTypeConfig[item.content_type];
  const status = statusConfig[item.status];
  const steps = getStepsForType(item.content_type);
  const currentStep = Math.min(status.step, steps.length - 1);

  const handleSaveScript = async () => {
    await onUpdate(item.id, { rewritten_script: script });
  };

  const handleSaveCaption = async () => {
    await onUpdate(item.id, { caption });
  };

  const renderActionButton = () => {
    switch (item.content_type) {
      case 'avatar_video':
        if (!item.audio_url) {
          return (
            <Button 
              onClick={() => triggerVoice(item.id, script)}
              className="gap-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 shadow-none border-0"
              disabled={!script.trim()}
              size="sm"
            >
              <Mic className="w-4 h-4" />
              В ElevenLabs
            </Button>
          );
        }
        if (!item.raw_video_url) {
          return (
            <Button 
              onClick={() => triggerAvatar(item.id, item.audio_url!)}
              className="gap-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 shadow-none border-0"
              size="sm"
            >
              <Video className="w-4 h-4" />
              В HeyGen
            </Button>
          );
        }
        if (!item.final_video_url) {
          return (
            <Button 
              onClick={() => triggerEdit(item.id, item.raw_video_url!)}
              className="gap-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 shadow-none border-0"
              size="sm"
            >
              <Scissors className="w-4 h-4" />
              В Submagic
            </Button>
          );
        }
        return (
          <Button 
            onClick={() => triggerPublish(item.id, item.final_video_url!, caption, ['instagram', 'tiktok'])}
            className="gap-2 rounded-xl"
            variant="default"
            size="sm"
          >
            <Send className="w-4 h-4" />
            Отправить в TG
          </Button>
        );

      case 'ai_video':
        if (!item.raw_video_url) {
          return (
            <Button 
              onClick={() => triggerAiVideo(item.id, script)}
              className="gap-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 shadow-none border-0"
              disabled={!script.trim()}
              size="sm"
            >
              <Film className="w-4 h-4" />
              В VEO/Sora
            </Button>
          );
        }
        if (!item.final_video_url) {
          return (
            <Button 
              onClick={() => triggerEdit(item.id, item.raw_video_url!)}
              className="gap-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 shadow-none border-0"
              size="sm"
            >
              <Scissors className="w-4 h-4" />
              В Submagic
            </Button>
          );
        }
        return (
          <Button 
            onClick={() => triggerPublish(item.id, item.final_video_url!, caption, ['instagram', 'tiktok'])}
            className="gap-2 rounded-xl"
            size="sm"
          >
            <Send className="w-4 h-4" />
            Отправить
          </Button>
        );

      case 'threads':
      case 'tg_text':
        return (
          <Button 
            onClick={() => triggerPublish(item.id, '', caption, [item.content_type === 'tg_text' ? 'telegram' : 'threads'])}
            className="gap-2 rounded-xl"
            disabled={!caption.trim()}
            size="sm"
          >
            <Send className="w-4 h-4" />
            Отправить
          </Button>
        );

      default:
        // Для неизвестных типов контента - просто сохраняем текущий статус
        return (
          <Button 
            onClick={async () => {
              // Переход на следующий шаг для статичных постов и каруселей
              const nextStatus = item.status === 'ideation' ? 'scripting' : 
                                item.status === 'scripting' ? 'ready_to_send' : 
                                item.status === 'ready_to_send' ? 'sent' : item.status;
              if (nextStatus !== item.status) {
                await onUpdate(item.id, { status: nextStatus as ContentStatus });
              }
            }}
            className="gap-2 rounded-xl"
            size="sm"
          >
            <Send className="w-4 h-4" />
            Далее
          </Button>
        );
    }
  };

  return (
    <Card className={cn(
      "overflow-hidden border transition-all duration-300 group rounded-3xl",
      "bg-background/60 backdrop-blur-xl hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20",
      "border-border/40"
    )}>
      <CardHeader className="pb-4 pt-5 px-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-sm border',
              typeConfig.bg, typeConfig.text, typeConfig.border
            )}>
              {typeConfig.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-1">
                  {item.title}
                </h3>
                {item.rewritten_script && (
                  <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 text-[10px] px-1.5 h-5 gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    AI
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-muted/50 text-muted-foreground">
                  {typeConfig.label}
                </span>
                <span className="text-xs text-muted-foreground/60 flex items-center gap-1">
                  <CalendarDaysIcon className="w-3 h-3" />
                  {format(new Date(item.created_at), 'd MMM', { locale: ru })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-background/80 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-background/80 text-muted-foreground">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-xl bg-background/80 backdrop-blur-xl">
                <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer rounded-lg" onClick={() => onDelete(item.id)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="mt-6 relative px-1">
          <div className="absolute top-[11px] left-0 w-full h-0.5 bg-muted/40 rounded-full" />
          <div className="flex items-center justify-between relative z-10">
            {steps.map((step, index) => {
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              
              return (
                <div key={step} className="flex flex-col items-center gap-2 group/step w-full">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500 shadow-sm border-2',
                      isCompleted
                        ? 'bg-primary text-primary-foreground border-primary scale-90'
                        : isCurrent
                        ? 'bg-background text-primary border-primary scale-125 shadow-md ring-4 ring-primary/10'
                        : 'bg-background text-muted-foreground border-muted group-hover/step:border-primary/30'
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-3.5 h-3.5" />
                    ) : (
                      <span className="text-[9px]">{index + 1}</span>
                    )}
                  </div>
                  {isCurrent && (
                    <div className="absolute top-8 left-0 w-full text-center animate-in fade-in slide-in-from-top-1 duration-300">
                      <span className="text-[10px] font-semibold text-foreground bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded-full border border-border/50 shadow-sm">
                        {step}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-5 pt-4 px-5 pb-5 animate-in slide-in-from-top-2 duration-300">
          {/* Analytics */}
          {(item.views_count > 0 || item.followers_gained > 0 || item.revenue_attributed > 0) && (
            <div className="grid grid-cols-3 gap-3 p-3 bg-muted/30 rounded-2xl border border-border/20">
              <div className="flex flex-col items-center justify-center p-2 text-center">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase tracking-wider font-medium">Просмотры</span>
                </div>
                <p className="font-semibold text-sm">{item.views_count.toLocaleString()}</p>
              </div>
              <div className="flex flex-col items-center justify-center p-2 text-center border-x border-border/10">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Users className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase tracking-wider font-medium">Подписки</span>
                </div>
                <p className="font-semibold text-sm">+{item.followers_gained}</p>
              </div>
              <div className="flex flex-col items-center justify-center p-2 text-center">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase tracking-wider font-medium">Выручка</span>
                </div>
                <p className="font-semibold text-sm">{item.revenue_attributed.toLocaleString()} ₸</p>
              </div>
            </div>
          )}

          {/* Script Section */}
          {['avatar_video', 'ai_video'].includes(item.content_type) && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Сценарий</label>
              <div className="relative">
                <Textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="Введите или вставьте сценарий..."
                  rows={4}
                  className="resize-none rounded-xl bg-muted/20 border-border/40 focus:border-primary/30 focus:bg-background transition-all pr-10 text-sm"
                />
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="absolute bottom-2 right-2 h-7 w-7 text-primary hover:bg-primary/10 rounded-lg"
                  onClick={handleSaveScript}
                  title="Сохранить сценарий"
                >
                  <CheckCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Audio Player */}
          {item.audio_url && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Озвучка</label>
              <div className="flex items-center gap-3 p-2 pr-4 bg-muted/30 rounded-xl border border-border/20">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-background shadow-sm text-primary hover:text-primary hover:bg-background/80"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </Button>
                <div className="flex-1 h-8 flex items-center">
                  <audio
                    src={item.audio_url}
                    controls
                    className="w-full h-8 opacity-80"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Video Player */}
          {(item.raw_video_url || item.final_video_url) && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                {item.final_video_url ? 'Финальное видео' : 'Сырое видео'}
              </label>
              <div className="aspect-video bg-black/90 rounded-2xl overflow-hidden shadow-lg border border-border/20 relative group/video">
                <video
                  src={item.final_video_url || item.raw_video_url || undefined}
                  controls
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}

          {/* Caption Section */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Текст публикации</label>
            <div className="relative">
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Текст для публикации..."
                rows={3}
                className="resize-none rounded-xl bg-muted/20 border-border/40 focus:border-primary/30 focus:bg-background transition-all text-sm"
              />
              <Button 
                size="icon" 
                variant="ghost" 
                className="absolute bottom-2 right-2 h-7 w-7 text-primary hover:bg-primary/10 rounded-lg"
                onClick={handleSaveCaption}
                title="Сохранить текст"
              >
                <CheckCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Source URL */}
          {item.source_url && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
              <Globe className="w-3.5 h-3.5" />
              <span>Источник:</span>
              <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[200px]">
                {item.source_url}
              </a>
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-end pt-2 border-t border-border/30">
            {renderActionButton()}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

function CalendarDaysIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
      <path d="M8 14h.01" />
      <path d="M12 14h.01" />
      <path d="M16 14h.01" />
      <path d="M8 18h.01" />
      <path d="M12 18h.01" />
      <path d="M16 18h.01" />
    </svg>
  );
}
