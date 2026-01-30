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
import { Video, Film, Image, MessageSquare, Send, Loader2, Sparkles, FileText, Wand2, Check } from 'lucide-react';
import { ContentType } from '@/hooks/useContentFactory';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

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

const contentTypes: { value: ContentType; label: string; description: string; icon: React.ReactNode; platformType: string; color: string }[] = [
  {
    value: 'avatar_video',
    label: 'Аватар видео',
    description: 'Voice → HeyGen → Submagic',
    icon: <Video className="w-5 h-5" />,
    platformType: 'Reels',
    color: 'bg-blue-500/10 text-blue-600',
  },
  {
    value: 'ai_video',
    label: 'AI Видео',
    description: 'Script → VEO/Sora → Submagic',
    icon: <Film className="w-5 h-5" />,
    platformType: 'Reels',
    color: 'bg-violet-500/10 text-violet-600',
  },
  {
    value: 'carousel',
    label: 'Карусель',
    description: 'Промпты → Генерация',
    icon: <Image className="w-5 h-5" />,
    platformType: 'Carousel',
    color: 'bg-pink-500/10 text-pink-600',
  },
  {
    value: 'threads',
    label: 'Threads',
    description: 'Текстовый пост',
    icon: <MessageSquare className="w-5 h-5" />,
    platformType: 'Text',
    color: 'bg-zinc-500/10 text-zinc-600',
  },
  {
    value: 'tg_text',
    label: 'Telegram',
    description: 'Текстовый пост',
    icon: <Send className="w-5 h-5" />,
    platformType: 'Text',
    color: 'bg-sky-500/10 text-sky-600',
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-border/40 bg-background/80 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
        
        <DialogHeader className="p-6 pb-2 border-b border-border/40 relative z-10">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold tracking-tight">
            <div className="p-2 bg-primary/10 rounded-xl">
               <Sparkles className="w-5 h-5 text-primary" />
            </div>
            Создать контент
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-6 relative z-10">
          {/* Title */}
          <div className="space-y-3">
            <Label htmlFor="title" className="text-sm font-medium text-muted-foreground ml-1">Название проекта</Label>
            <Input
              id="title"
              placeholder="Введите название..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-12 text-lg rounded-2xl bg-muted/30 border-border/50 focus:bg-background focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Content Type */}
          <div className="space-y-3">
            <div className="flex items-center justify-between ml-1">
              <Label className="text-sm font-medium text-muted-foreground">Тип контента</Label>
              {selectedType && (
                <Badge variant="outline" className="text-[10px] font-medium tracking-wide border-primary/20 bg-primary/5 text-primary">
                  {selectedType.platformType.toUpperCase()}
                </Badge>
              )}
            </div>
            
            <RadioGroup
              value={contentType}
              onValueChange={(value) => setContentType(value as ContentType)}
              className="grid grid-cols-2 sm:grid-cols-3 gap-3"
            >
              {contentTypes.map((type) => (
                <div key={type.value} className="relative">
                  <RadioGroupItem
                    value={type.value}
                    id={type.value}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={type.value}
                    className={cn(
                      'flex flex-col items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 h-full',
                      'hover:bg-muted/30 hover:border-primary/30',
                      contentType === type.value
                        ? 'border-primary bg-primary/5 shadow-sm scale-[1.02]'
                        : 'border-transparent bg-muted/30'
                    )}
                  >
                    <div className={cn("p-2.5 rounded-xl transition-colors", type.color)}>
                        {type.icon}
                    </div>
                    <div className="text-center space-y-0.5">
                      <p className="font-semibold text-sm">{type.label}</p>
                      <p className="text-[10px] text-muted-foreground/80 font-medium">{type.description}</p>
                    </div>
                    {contentType === type.value && (
                        <div className="absolute top-3 right-3 text-primary animate-in zoom-in duration-300">
                            <Check className="w-4 h-4" />
                        </div>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Source URL with AI Analysis */}
          <div className="space-y-3">
            <Label htmlFor="source" className="text-sm font-medium text-muted-foreground ml-1">AI Анализ конкурента</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                    id="source"
                    placeholder="Вставьте ссылку на Reels..."
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    className="h-11 pr-4 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all"
                />
              </div>
              <Button 
                variant="secondary" 
                onClick={handleAIAnalysis}
                disabled={isAnalyzing || !sourceUrl.trim()}
                className="h-11 px-5 gap-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-sm"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
                <span className="font-medium">Анализ</span>
              </Button>
            </div>
          </div>

          {/* AI Analysis Results */}
          <AnimatePresence>
            {(aiHook || aiScript || aiSkeleton) && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                >
                    <div className="space-y-4 p-5 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl border border-primary/10 mt-2">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="font-semibold text-sm">Результаты анализа</span>
                        </div>

                        {aiHook && (
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-primary uppercase tracking-wide">Хук</Label>
                                <div className="p-3 bg-background/60 backdrop-blur-sm rounded-xl text-sm border border-primary/5 shadow-sm">
                                    {aiHook}
                                </div>
                            </div>
                        )}

                        {aiSkeleton && (
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-primary uppercase tracking-wide">Структура</Label>
                                <div className="p-3 bg-background/60 backdrop-blur-sm rounded-xl text-sm whitespace-pre-line border border-primary/5 shadow-sm">
                                    {aiSkeleton}
                                </div>
                            </div>
                        )}
                        
                        {aiScript && (
                             <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-primary uppercase tracking-wide">Сценарий</Label>
                                <Textarea
                                    value={aiScript}
                                    onChange={(e) => setAiScript(e.target.value)}
                                    rows={4}
                                    className="text-sm bg-background/60 backdrop-blur-sm border-primary/10 rounded-xl"
                                />
                             </div>
                        )}
                    </div>
                </motion.div>
            )}
          </AnimatePresence>

          {/* Manual Script (if no AI analysis) */}
          {['avatar_video', 'ai_video'].includes(contentType) && !aiScript && !isAnalyzing && (
            <div className="space-y-3">
              <Label htmlFor="script" className="text-sm font-medium text-muted-foreground ml-1">Сценарий</Label>
              <Textarea
                id="script"
                placeholder="Напишите сценарий здесь..."
                value={script}
                onChange={(e) => setScript(e.target.value)}
                rows={4}
                className="rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all resize-none"
              />
            </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-2 border-t border-border/40 bg-muted/5 relative z-10">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl hover:bg-muted/50">
            Отмена
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!title.trim() || isCreating}
            className="gap-2 rounded-xl px-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300"
          >
            {isCreating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            {isCreating ? 'Создание...' : 'Отправить в Цех'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
