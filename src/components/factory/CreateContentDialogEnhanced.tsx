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
import { Badge } from '@/components/ui/badge';
import { Video, Film, Image, MessageSquare, Send, Loader2, Sparkles, FileText, Wand2 } from 'lucide-react';
import { ContentType } from '@/hooks/useContentFactory';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CreateContentDialogEnhancedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: {
    title: string;
    content_type: ContentType;
    original_script?: string;
    source_url?: string;
  }) => Promise<unknown>;
}

const contentTypes: { value: ContentType; label: string; description: string; icon: React.ReactNode; platformType: string }[] = [
  {
    value: 'avatar_video',
    label: '👤 Аватар видео',
    description: 'Voice → HeyGen → Submagic',
    icon: <Video className="w-5 h-5" />,
    platformType: 'reels',
  },
  {
    value: 'ai_video',
    label: '🎬 AI Видео',
    description: 'Script → VEO/Sora → Submagic',
    icon: <Film className="w-5 h-5" />,
    platformType: 'reels',
  },
  {
    value: 'carousel',
    label: '🖼️ Карусель',
    description: 'Промпты → Генерация изображений',
    icon: <Image className="w-5 h-5" />,
    platformType: 'carousel',
  },
  {
    value: 'threads',
    label: '💬 Threads',
    description: 'Текстовый пост для Threads',
    icon: <MessageSquare className="w-5 h-5" />,
    platformType: 'text',
  },
  {
    value: 'tg_text',
    label: '📱 Telegram',
    description: 'Текстовый пост для Telegram',
    icon: <Send className="w-5 h-5" />,
    platformType: 'text',
  },
];

export const CreateContentDialogEnhanced = ({
  open,
  onOpenChange,
  onCreate,
}: CreateContentDialogEnhancedProps) => {
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState<ContentType>('avatar_video');
  const [script, setScript] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // AI Analysis results
  const [aiHook, setAiHook] = useState('');
  const [aiScript, setAiScript] = useState('');
  const [aiSkeleton, setAiSkeleton] = useState('');

  const handleCreate = async () => {
    if (!title.trim()) return;
    
    setIsCreating(true);
    await onCreate({
      title: title.trim(),
      content_type: contentType,
      original_script: script.trim() || aiScript || undefined,
      source_url: sourceUrl.trim() || undefined,
    });
    setIsCreating(false);
    
    // Reset form
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setTitle('');
    setScript('');
    setSourceUrl('');
    setContentType('avatar_video');
    setAiHook('');
    setAiScript('');
    setAiSkeleton('');
  };

  const handleAIAnalysis = async () => {
    if (!sourceUrl.trim()) {
      toast.error('Вставьте ссылку на источник');
      return;
    }

    setIsAnalyzing(true);
    toast.info('🤖 ИИ анализирует контент...');
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mock AI results
    setAiHook('❌ Главная ошибка, которую совершают 90% клиник при работе с пациентами...');
    setAiScript(`Привет! Сегодня расскажу вам о том, как мы увеличили выручку клиники в 3 раза за 2 месяца.

Всё началось с простого наблюдения: большинство пациентов приходят один раз и больше не возвращаются.

Мы внедрили систему автоматических напоминаний, персонализированных предложений и программу лояльности.

Результат? Повторные визиты выросли на 67%, а средний чек увеличился на 40%.

Хотите узнать, как это работает для вашей клиники? Ссылка в шапке профиля.`);
    setAiSkeleton(`1. ХУК: Проблема/боль целевой аудитории
2. ИСТОРИЯ: Личный опыт или кейс
3. РЕШЕНИЕ: Что конкретно сделали
4. РЕЗУЛЬТАТ: Цифры и доказательства
5. CTA: Призыв к действию`);
    
    // Auto-fill title if empty
    if (!title.trim()) {
      setTitle('Как увеличить выручку клиники в 3 раза');
    }
    
    setIsAnalyzing(false);
    toast.success('Анализ завершён!');
  };

  const selectedType = contentTypes.find(t => t.value === contentType);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Создать контент
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
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

          {/* Content Type with Platform Type indication */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Тип контента</Label>
              {selectedType && (
                <Badge variant="outline" className="text-xs">
                  platform_type: {selectedType.platformType}
                </Badge>
              )}
            </div>
            <RadioGroup
              value={contentType}
              onValueChange={(value) => setContentType(value as ContentType)}
              className="grid grid-cols-2 sm:grid-cols-3 gap-2"
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
                      'flex flex-col items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all text-center',
                      'hover:border-primary/50 hover:bg-primary/5',
                      contentType === type.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border'
                    )}
                  >
                    <div className="text-primary">{type.icon}</div>
                    <div>
                      <p className="font-medium text-sm">{type.label}</p>
                      <p className="text-[10px] text-muted-foreground">{type.description}</p>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Source URL with AI Analysis */}
          <div className="space-y-2">
            <Label htmlFor="source">Ссылка на источник (опционально)</Label>
            <div className="flex gap-2">
              <Input
                id="source"
                placeholder="https://instagram.com/reel/..."
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className="flex-1"
              />
              <Button 
                variant="secondary" 
                onClick={handleAIAnalysis}
                disabled={isAnalyzing || !sourceUrl.trim()}
                className="gap-2"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
                ИИ-анализ
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Ссылка на рилс конкурента для анализа и переработки
            </p>
          </div>

          {/* AI Analysis Results */}
          {(aiHook || aiScript || aiSkeleton) && (
            <div className="space-y-4 p-4 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-xl border border-violet-500/20">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-500" />
                <span className="font-medium text-sm">Результаты ИИ-анализа</span>
              </div>

              {aiHook && (
                <div className="space-y-1">
                  <Label className="text-xs text-violet-600">🎯 Хук</Label>
                  <div className="p-2 bg-background rounded-lg text-sm">
                    {aiHook}
                  </div>
                </div>
              )}

              {aiScript && (
                <div className="space-y-1">
                  <Label className="text-xs text-violet-600">📝 Исходный сценарий</Label>
                  <Textarea
                    value={aiScript}
                    onChange={(e) => setAiScript(e.target.value)}
                    rows={4}
                    className="text-sm"
                  />
                </div>
              )}

              {aiSkeleton && (
                <div className="space-y-1">
                  <Label className="text-xs text-violet-600">🦴 Скелет</Label>
                  <div className="p-2 bg-background rounded-lg text-sm whitespace-pre-line">
                    {aiSkeleton}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Manual Script (if no AI analysis) */}
          {['avatar_video', 'ai_video'].includes(contentType) && !aiScript && (
            <div className="space-y-2">
              <Label htmlFor="script">Исходный сценарий (опционально)</Label>
              <Textarea
                id="script"
                placeholder="Вставьте сценарий или используйте ИИ-анализ..."
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
          <Button 
            onClick={handleCreate} 
            disabled={!title.trim() || isCreating}
            className="gap-2"
          >
            {isCreating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            {isCreating ? 'Создание...' : 'Создать → Цех 1'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
