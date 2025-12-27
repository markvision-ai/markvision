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
} from 'lucide-react';
import { ContentItem, ContentType, ContentStatus } from '@/hooks/useContentFactory';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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

const contentTypeConfig: Record<ContentType, { label: string; icon: React.ReactNode; color: string }> = {
  avatar_video: { label: 'Аватар видео', icon: <Video className="w-4 h-4" />, color: 'bg-blue-500' },
  ai_video: { label: 'AI Видео', icon: <Film className="w-4 h-4" />, color: 'bg-purple-500' },
  static_post: { label: 'Статичный пост', icon: <Image className="w-4 h-4" />, color: 'bg-green-500' },
  carousel: { label: 'Карусель', icon: <Image className="w-4 h-4" />, color: 'bg-orange-500' },
  threads: { label: 'Threads', icon: <MessageSquare className="w-4 h-4" />, color: 'bg-pink-500' },
  tg_text: { label: 'Telegram', icon: <Send className="w-4 h-4" />, color: 'bg-sky-500' },
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
              className="gap-2"
              disabled={!script.trim()}
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
              className="gap-2"
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
              className="gap-2"
            >
              <Scissors className="w-4 h-4" />
              В Submagic
            </Button>
          );
        }
        return (
          <Button 
            onClick={() => triggerPublish(item.id, item.final_video_url!, caption, ['instagram', 'tiktok'])}
            className="gap-2"
            variant="default"
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
              className="gap-2"
              disabled={!script.trim()}
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
              className="gap-2"
            >
              <Scissors className="w-4 h-4" />
              В Submagic
            </Button>
          );
        }
        return (
          <Button 
            onClick={() => triggerPublish(item.id, item.final_video_url!, caption, ['instagram', 'tiktok'])}
            className="gap-2"
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
            className="gap-2"
            disabled={!caption.trim()}
          >
            <Send className="w-4 h-4" />
            Отправить
          </Button>
        );

      default:
        return (
          <Button className="gap-2">
            <Send className="w-4 h-4" />
            Далее
          </Button>
        );
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-white', typeConfig.color)}>
              {typeConfig.icon}
            </div>
            <div>
              <h3 className="font-semibold">{item.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {typeConfig.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(item.created_at), 'dd MMM yyyy', { locale: ru })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(item.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="mt-4">
          <div className="flex items-center gap-2">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                    index < currentStep
                      ? 'bg-success text-success-foreground'
                      : index === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {index < currentStep ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'w-8 h-0.5 mx-1',
                      index < currentStep ? 'bg-success' : 'bg-muted'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex mt-2">
            {steps.map((step, index) => (
              <div
                key={step}
                className={cn(
                  'flex-1 text-xs text-center',
                  index === currentStep ? 'text-primary font-medium' : 'text-muted-foreground'
                )}
              >
                {step}
              </div>
            ))}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4 pt-0">
          {/* Analytics */}
          {(item.views_count > 0 || item.followers_gained > 0 || item.revenue_attributed > 0) && (
            <div className="grid grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Просмотры</p>
                  <p className="font-semibold">{item.views_count.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Подписки</p>
                  <p className="font-semibold">+{item.followers_gained}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Выручка</p>
                  <p className="font-semibold">{item.revenue_attributed.toLocaleString()} ₸</p>
                </div>
              </div>
            </div>
          )}

          {/* Script Section */}
          {['avatar_video', 'ai_video'].includes(item.content_type) && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Сценарий</label>
              <Textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="Введите или вставьте сценарий..."
                rows={4}
              />
              <Button variant="outline" size="sm" onClick={handleSaveScript}>
                Сохранить сценарий
              </Button>
            </div>
          )}

          {/* Audio Player */}
          {item.audio_url && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Озвучка</label>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <audio
                  src={item.audio_url}
                  controls
                  className="flex-1 h-8"
                />
              </div>
            </div>
          )}

          {/* Video Player */}
          {(item.raw_video_url || item.final_video_url) && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {item.final_video_url ? 'Финальное видео' : 'Сырое видео'}
              </label>
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  src={item.final_video_url || item.raw_video_url || undefined}
                  controls
                  className="w-full h-full"
                />
              </div>
            </div>
          )}

          {/* Caption Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Текст публикации</label>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Текст для публикации..."
              rows={3}
            />
            <Button variant="outline" size="sm" onClick={handleSaveCaption}>
              Сохранить текст
            </Button>
          </div>

          {/* Source URL */}
          {item.source_url && (
            <div className="text-xs text-muted-foreground">
              Источник: <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{item.source_url}</a>
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-end pt-2">
            {renderActionButton()}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
