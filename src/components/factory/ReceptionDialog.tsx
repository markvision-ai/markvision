import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { 
  Link, Image as ImageIcon, FileText, Mic, 
  Layers, Palette, Languages, 
  Smartphone, Monitor, Ratio,
  Sparkles, ArrowRight, Check, Upload, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface ReceptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: any) => Promise<unknown>;
}

type AspectRatio = '1:1' | '4:5' | '9:16' | '16:9';
type DesignStyle = 'modern' | 'minimalism' | 'premium' | 'tech';

export const ReceptionDialog = ({
  open,
  onOpenChange,
  onCreate,
}: ReceptionDialogProps) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Source
  const [sourceType, setSourceType] = useState<'link' | 'photo' | 'description'>('link');
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState<'tiktok' | 'instagram' | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [mainIdea, setMainIdea] = useState('');
  const [instructions, setInstructions] = useState('');

  // Step 2: Format
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [language, setLanguage] = useState('ru');
  const [variants, setVariants] = useState([3]); // Slider value array

  // Step 3: Design
  const [style, setStyle] = useState<DesignStyle>('modern');
  const [colorMode, setColorMode] = useState<'auto' | 'custom'>('auto');
  const [customColor, setCustomColor] = useState('#3b82f6');

  const handleNext = () => {
    if (step === 1) {
      if (sourceType === 'link' && !url) {
        toast.error('Введите ссылку');
        return;
      }
      if (sourceType === 'description' && !mainIdea) {
        toast.error('Опишите идею');
        return;
      }
      if (sourceType === 'photo' && files.length === 0) {
        toast.error('Загрузите фото');
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Prepare data payload for n8n/Supabase
    const payload = {
      title: sourceType === 'link' ? `Import from ${platform || 'URL'}` : 
             sourceType === 'photo' ? 'Photo Generation' : 
             mainIdea.slice(0, 30) + '...',
      content_type: 'ai_video', // Default type, logic will handle specific
      source_url: url,
      original_script: JSON.stringify({
        source_type: sourceType,
        main_idea: mainIdea,
        instructions: instructions,
        format: {
          aspect_ratio: aspectRatio,
          language: language,
          variants: variants[0]
        },
        design: {
          style: style,
          color_mode: colorMode,
          custom_color: colorMode === 'custom' ? customColor : null
        }
      }),
      // Additional metadata fields if supported by backend
      metadata: {
        step1_source: { type: sourceType, url, platform, files_count: files.length },
        step2_format: { aspectRatio, language, variants: variants[0] },
        step3_design: { style, colorMode, customColor }
      }
    };

    try {
      await onCreate(payload);
      toast.success('Производство запущено!');
      onOpenChange(false);
      // Reset form
      setTimeout(() => {
        setStep(1);
        setUrl('');
        setMainIdea('');
        setFiles([]);
        setInstructions('');
      }, 500);
    } catch (error) {
      console.error(error);
      toast.error('Ошибка запуска');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen && !isSubmitting) setStep(1);
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 gap-0 border-border/40 dark:border-white/5 bg-background dark:bg-[#030303] text-foreground dark:text-white overflow-hidden flex flex-col shadow-2xl rounded-3xl">
        
        {/* Header */}
        <DialogHeader className="p-6 border-b border-border/40 dark:border-white/5 bg-muted/20 dark:bg-[#050505] shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-xl font-bold tracking-tight">
              <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                 <Layers className="w-5 h-5 text-blue-600 dark:text-blue-500" />
              </div>
              Приемный Цех
              <Badge variant="outline" className="ml-2 border-border/40 dark:border-white/10 text-muted-foreground dark:text-white/40 font-mono text-[10px] uppercase tracking-wider">
                Шаг {step} из 3
              </Badge>
            </DialogTitle>
            
            {/* Stepper Indicator */}
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  s === step ? "w-8 bg-blue-500 shadow-[0_0_10px_#3b82f6]" : 
                  s < step ? "w-8 bg-blue-500/50" : "w-2 bg-muted dark:bg-white/10"
                )} />
              ))}
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.05),transparent_40%)] pointer-events-none" />
          
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 max-w-2xl mx-auto"
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Источник контента</h2>
                  <p className="text-muted-foreground dark:text-white/40 text-sm">Выберите исходные данные для запуска производства</p>
                </div>

                <Tabs value={sourceType} onValueChange={(v: any) => setSourceType(v)} className="w-full">
                  <TabsList className="w-full h-12 bg-muted/50 dark:bg-white/5 border border-border/40 dark:border-white/5 p-1 mb-8 rounded-xl">
                    <TabsTrigger value="link" className="flex-1 h-full data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all">
                      <Link className="w-4 h-4 mr-2" /> По ссылке
                    </TabsTrigger>
                    <TabsTrigger value="photo" className="flex-1 h-full data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all">
                      <ImageIcon className="w-4 h-4 mr-2" /> По фото
                    </TabsTrigger>
                    <TabsTrigger value="description" className="flex-1 h-full data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all">
                      <FileText className="w-4 h-4 mr-2" /> По описанию
                    </TabsTrigger>
                  </TabsList>

                  <div className="min-h-[200px]">
                    <TabsContent value="link" className="space-y-4 mt-0">
                      <div className="space-y-2">
                        <Label>URL материала</Label>
                        <div className="relative">
                          <Link className="absolute left-3 top-3 w-5 h-5 text-muted-foreground dark:text-white/30" />
                          <Input 
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://..." 
                            className="pl-10 h-11 bg-muted/30 dark:bg-white/5 border-border/40 dark:border-white/10 focus:border-blue-500/50 rounded-xl text-base"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setPlatform('tiktok')}
                          className={cn("flex-1 h-10 border-border/40 dark:border-white/10 hover:bg-muted/50 dark:hover:bg-white/5", platform === 'tiktok' && "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400")}
                        >
                          TikTok
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setPlatform('instagram')}
                          className={cn("flex-1 h-10 border-border/40 dark:border-white/10 hover:bg-muted/50 dark:hover:bg-white/5", platform === 'instagram' && "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400")}
                        >
                          Instagram
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="photo" className="mt-0">
                      <div 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleFileDrop}
                        className="border-2 border-dashed border-border/40 dark:border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-blue-500/30 hover:bg-blue-500/5 transition-all cursor-pointer min-h-[200px]"
                      >
                        <div className="w-16 h-16 rounded-full bg-muted/50 dark:bg-white/5 flex items-center justify-center mb-4">
                          <Upload className="w-8 h-8 text-muted-foreground dark:text-white/30" />
                        </div>
                        <p className="text-sm font-medium mb-1">Перетащите файлы сюда</p>
                        <p className="text-xs text-muted-foreground dark:text-white/40">JPG, PNG до 10MB</p>
                        
                        {files.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2 justify-center">
                            {files.map((f, i) => (
                              <Badge key={i} variant="secondary" className="bg-muted dark:bg-white/10 hover:bg-muted/80 dark:hover:bg-white/20 pl-2 pr-1 py-1 gap-1">
                                {f.name}
                                <Button size="icon" variant="ghost" className="h-4 w-4 rounded-full hover:bg-black/10 dark:hover:bg-white/20 p-0" onClick={(e) => {
                                  e.stopPropagation();
                                  setFiles(files.filter((_, idx) => idx !== i));
                                }}>
                                  <X className="w-3 h-3" />
                                </Button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="description" className="mt-0">
                      <div className="space-y-2">
                        <Label>Главная идея</Label>
                        <Textarea 
                          value={mainIdea}
                          onChange={(e) => setMainIdea(e.target.value)}
                          placeholder="Опишите, о чем должен быть контент..." 
                          className="min-h-[150px] bg-muted/30 dark:bg-white/5 border-border/40 dark:border-white/10 focus:border-blue-500/50 rounded-xl resize-none text-base"
                        />
                      </div>
                    </TabsContent>
                  </div>

                  <div className="mt-8 pt-6 border-t border-border/40 dark:border-white/5 space-y-3">
                    <Label className="flex items-center gap-2">
                      <Mic className="w-4 h-4 text-blue-500" /> 
                      Дополнительные инструкции
                    </Label>
                    <Textarea 
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="Например: используй более дерзкий тон..." 
                      className="h-20 bg-muted/30 dark:bg-white/5 border-border/40 dark:border-white/10 focus:border-blue-500/50 rounded-xl resize-none text-sm"
                    />
                  </div>
                </Tabs>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 max-w-2xl mx-auto"
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Настройки формата</h2>
                  <p className="text-muted-foreground dark:text-white/40 text-sm">Технические параметры генерации</p>
                </div>

                {/* Aspect Ratio */}
                <div className="space-y-4">
                  <Label className="text-base">Соотношение сторон</Label>
                  <div className="grid grid-cols-4 gap-4">
                    {(['1:1', '4:5', '9:16', '16:9'] as AspectRatio[]).map((ratio) => (
                      <div 
                        key={ratio}
                        onClick={() => setAspectRatio(ratio)}
                        className={cn(
                          "cursor-pointer border border-border/40 dark:border-white/10 rounded-xl p-4 flex flex-col items-center gap-3 transition-all hover:bg-muted/50 dark:hover:bg-white/5",
                          aspectRatio === ratio && "border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                        )}
                      >
                        <Ratio className={cn("w-6 h-6", aspectRatio === ratio ? "text-blue-500" : "text-muted-foreground dark:text-white/30")} />
                        <span className={cn("text-sm font-mono font-bold", aspectRatio === ratio ? "text-foreground dark:text-white" : "text-muted-foreground dark:text-white/50")}>{ratio}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div className="space-y-4">
                  <Label className="text-base">Язык контента</Label>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setLanguage('ru')}
                      className={cn("flex-1 h-12 border-border/40 dark:border-white/10 text-base", language === 'ru' && "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400")}
                    >
                      🇷🇺 Русский
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setLanguage('en')}
                      className={cn("flex-1 h-12 border-border/40 dark:border-white/10 text-base", language === 'en' && "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400")}
                    >
                      🇬🇧 English
                    </Button>
                  </div>
                </div>

                {/* Variants Count */}
                <div className="space-y-6">
                  <div className="flex justify-between">
                    <Label className="text-base">Количество вариантов</Label>
                    <span className="text-blue-500 font-bold font-mono">{variants[0]} шт.</span>
                  </div>
                  <Slider 
                    value={variants} 
                    onValueChange={setVariants} 
                    max={5} 
                    min={1} 
                    step={2} // 1, 3, 5
                    className="py-4"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground dark:text-white/30 px-1 font-mono">
                    <span>1</span>
                    <span>3</span>
                    <span>5</span>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 max-w-2xl mx-auto"
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Стиль дизайна</h2>
                  <p className="text-muted-foreground dark:text-white/40 text-sm">Визуальная эстетика и настроение</p>
                </div>

                {/* Design Style */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'modern', label: 'Современный', desc: 'Чистый, актуальный', icon: Monitor },
                    { id: 'minimalism', label: 'Минимализм', desc: 'Лаконичный, воздух', icon: Layers },
                    { id: 'premium', label: 'Премиум', desc: 'Luxury, дорогой', icon: Sparkles },
                    { id: 'tech', label: 'Технологичный', desc: 'Neon, Cyberpunk', icon: Smartphone }
                  ].map((s) => (
                    <div 
                      key={s.id}
                      onClick={() => setStyle(s.id as DesignStyle)}
                      className={cn(
                        "cursor-pointer border border-border/40 dark:border-white/10 rounded-xl p-4 flex items-start gap-4 transition-all hover:bg-muted/50 dark:hover:bg-white/5 group",
                        style === s.id && "border-blue-500 bg-blue-500/10"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg bg-muted/50 dark:bg-white/5 group-hover:bg-muted dark:group-hover:bg-white/10 transition-colors",
                        style === s.id && "bg-blue-500/20 text-blue-500"
                      )}>
                        <s.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className={cn("font-bold text-sm", style === s.id ? "text-foreground dark:text-white" : "text-muted-foreground dark:text-white/70")}>{s.label}</h3>
                        <p className="text-xs text-muted-foreground dark:text-white/40 mt-1">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Color Selection */}
                <div className="space-y-4 pt-4 border-t border-border/40 dark:border-white/5">
                  <Label className="text-base">Основной цвет</Label>
                  <div className="flex items-center gap-4">
                    <Button 
                      variant="outline"
                      onClick={() => setColorMode('auto')}
                      className={cn("h-10 border-border/40 dark:border-white/10", colorMode === 'auto' && "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400")}
                    >
                      <Palette className="w-4 h-4 mr-2" />
                      АВТО
                    </Button>
                    
                    <div className="h-8 w-px bg-border/40 dark:bg-white/10" />
                    
                    <div className="flex gap-2">
                      {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'].map((c) => (
                        <div 
                          key={c}
                          onClick={() => { setColorMode('custom'); setCustomColor(c); }}
                          className={cn(
                            "w-8 h-8 rounded-full cursor-pointer transition-transform hover:scale-110 ring-2 ring-offset-2 ring-offset-background dark:ring-offset-[#030303]",
                            colorMode === 'custom' && customColor === c ? "ring-foreground dark:ring-white" : "ring-transparent"
                          )}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border/40 dark:border-white/5 bg-muted/20 dark:bg-[#050505] flex justify-between items-center shrink-0">
          <Button 
            variant="ghost" 
            onClick={handleBack} 
            disabled={step === 1 || isSubmitting}
            className="text-muted-foreground hover:text-foreground dark:text-white/50 dark:hover:text-white"
          >
            Назад
          </Button>
          
          <Button 
            onClick={step === 3 ? handleSubmit : handleNext}
            disabled={isSubmitting}
            className={cn(
              "px-8 h-12 text-sm font-bold uppercase tracking-widest shadow-lg transition-all",
              step === 3 
                ? "bg-green-600 hover:bg-green-500 shadow-green-900/20 hover:shadow-green-500/30 text-white" 
                : "bg-blue-600 hover:bg-blue-500 shadow-blue-900/20 hover:shadow-blue-500/30 text-white"
            )}
          >
            {isSubmitting ? (
              <>Запуск...</>
            ) : step === 3 ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                ЗАПУСТИТЬ ПРОИЗВОДСТВО
              </>
            ) : (
              <>
                Далее
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
};
