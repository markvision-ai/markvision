import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Video, Film, Image, MessageSquare, Send } from 'lucide-react';
import { ContentType } from '@/hooks/useContentFactory';
import { cn } from '@/lib/utils';

interface CreateContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: {
    title: string;
    content_type: ContentType;
    original_script?: string;
    source_url?: string;
  }) => Promise<unknown>;
}

const contentTypes: { value: ContentType; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'avatar_video',
    label: 'Аватар видео',
    description: 'Voice → HeyGen → Submagic',
    icon: <Video className="w-5 h-5" />,
  },
  {
    value: 'ai_video',
    label: 'AI Видео',
    description: 'Script → VEO/Sora → Submagic',
    icon: <Film className="w-5 h-5" />,
  },
  {
    value: 'carousel',
    label: 'Карусель',
    description: 'Промпты → Генерация изображений',
    icon: <Image className="w-5 h-5" />,
  },
  {
    value: 'threads',
    label: 'Threads',
    description: 'Текстовый пост для Threads',
    icon: <MessageSquare className="w-5 h-5" />,
  },
  {
    value: 'tg_text',
    label: 'Telegram',
    description: 'Текстовый пост для Telegram',
    icon: <Send className="w-5 h-5" />,
  },
];

export const CreateContentDialog = ({
  open,
  onOpenChange,
  onCreate,
}: CreateContentDialogProps) => {
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState<ContentType>('avatar_video');
  const [script, setScript] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    
    setIsCreating(true);
    await onCreate({
      title: title.trim(),
      content_type: contentType,
      original_script: script.trim() || undefined,
      source_url: sourceUrl.trim() || undefined,
    });
    setIsCreating(false);
    
    // Reset form
    setTitle('');
    setScript('');
    setSourceUrl('');
    setContentType('avatar_video');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Создать контент</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Название</Label>
            <Input
              id="title"
              placeholder="Название контента"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Content Type */}
          <div className="space-y-2">
            <Label>Тип контента</Label>
            <RadioGroup
              value={contentType}
              onValueChange={(value) => setContentType(value as ContentType)}
              className="grid grid-cols-2 gap-2"
            >
              {contentTypes.map((type) => (
                <div key={type.value}>
                  <RadioGroupItem
                    value={type.value}
                    id={type.value}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={type.value}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors',
                      'hover:border-primary/50',
                      contentType === type.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    )}
                  >
                    <div className="text-primary mt-0.5">{type.icon}</div>
                    <div>
                      <p className="font-medium text-sm">{type.label}</p>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Source URL */}
          <div className="space-y-2">
            <Label htmlFor="source">Ссылка на источник (опционально)</Label>
            <Input
              id="source"
              placeholder="https://instagram.com/reel/..."
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Ссылка на рилс конкурента для анализа и переработки
            </p>
          </div>

          {/* Initial Script */}
          {['avatar_video', 'ai_video'].includes(contentType) && (
            <div className="space-y-2">
              <Label htmlFor="script">Исходный сценарий (опционально)</Label>
              <Textarea
                id="script"
                placeholder="Вставьте сценарий или оставьте пустым..."
                value={script}
                onChange={(e) => setScript(e.target.value)}
                rows={4}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleCreate} disabled={!title.trim() || isCreating}>
            {isCreating ? 'Создание...' : 'Создать'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
