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
      <DialogContent className="max-w-4xl h-[80vh] p-0 gap-0 border-border/40 bg-background text-foreground overflow-hidden flex flex-col shadow-2xl rounded-3xl">
        
        {/* Header */}
        <DialogHeader className="p-6 border-b border-border/40 bg-muted/20 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-xl font-bold tracking-tight">
              <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
                 <Layers className="w-5 h-5 text-primary" />
              </div>
              Приемный Цех
              <Badge variant="outline" className="ml-2 border-border/40 text-muted-foreground font-mono text-[10px] uppercase tracking-wider">
                Шаг {step} из 3
              </Badge>
            </DialogTitle>
            
            {/* Stepper Indicator */}
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  s === step ? "w-8 bg-primary shadow-[0_0_10px_theme(colors.primary.DEFAULT)]" : 
                  s < step ? "w-8 bg-primary/50" : "w-2 bg-muted"
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
                  <p className="text-muted-foreground text-sm">Выберите исходные данные для запуска производства</p>
                </div>

                <Tabs value={sourceType} onValueChange={(v: any) => setSourceType(v)} className="w-full">
                  <TabsList className="w-full h-12 bg-muted/50 border border-border/40 p-1 mb-8 rounded-xl">
                    <TabsTrigger value="link" className="flex-1 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all">
                      <Link className="w-4 h-4 mr-2" /> По ссылке
                    </TabsTrigger>
                    <TabsTrigger value="photo" className="flex-1 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all">
                      <ImageIcon className="w-4 h-4 mr-2" /> По фото
                    </TabsTrigger>
                    <TabsTrigger value="description" className="flex-1 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all">
                      <FileText className="w-4 h-4 mr-2" /> По описанию
                    </TabsTrigger>
                  </TabsList>

                  <div className="min-h-[200px]">
                    <TabsContent value="link" className="space-y-4 mt-0">
                      <div className="space-y-2">
                        <Label>URL материала</Label>
                        <div className="relative">
                          <Link className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                          <Input 
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://..." 
                            className="pl-10 h-11 bg-muted/30 border-border/40 focus:border-primary/50 rounded-xl text-base"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setPlatform('tiktok')}
                          className={cn("flex-1 h-10 border-border/40 hover:bg-muted/50", platform === 'tiktok' && "border-primary bg-primary/10 text-primary")}
                        >
                          TikTok
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setPlatform('instagram')}
                          className={cn("flex-1 h-10 border-border/40 hover:bg-muted/50", platform === 'instagram' && "border-primary bg-primary/10 text-primary")}
                        >
                          Instagram
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="photo" className="mt-0">
                      <div 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleFileDrop}
                        className="border-2 border-dashed border-border/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer min-h-[200px]"
                      >
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                          <Upload className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium mb-1">Перетащите файлы сюда</p>
                        <p className="text-xs text-muted-foreground">JPG, PNG до 10MB</p>
                        
                        {files.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2 justify-center">
                            {files.map((f, i) => (
                              <Badge key={i} variant="secondary" className="bg-muted hover:bg-muted/80 pl-2 pr-1 py-1 gap-1">
                                {f.name}
                                <Button size="icon" variant="ghost" className="h-4 w-4 rounded-full hover:bg-muted p-0" onClick={(e) => {
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
                        <div className="relative">
                          <Textarea 
                            value={mainIdea}
                            onChange={(e) => setMainIdea(e.target.value)}
                            placeholder="Опишите, о чем должен быть контент..." 
                            className="min-h-[150px] bg-muted/30 border-border/40 focus:border-primary/50 rounded-xl resize-none text-base pr-10"
                          />
                          <button 
                            className="absolute right-3 top-3 p-1 text-muted-foreground hover:text-primary transition-colors"
                            aria-label="Голосовой ввод"
                          >
                            <Mic className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                    </TabsContent>
                  </div>

                  <div className="mt-8 pt-6 border-t border-border/40 space-y-3">
                    <Label className="flex items-center gap-2">
                      <Mic className="w-4 h-4 text-primary" /> 
                      Дополнительные инструкции
                    </Label>
                    <Textarea 
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="Например: используй более дерзкий тон..." 
                      className="h-20 bg-muted/30 border-border/40 focus:border-primary/50 rounded-xl resize-none text-sm"
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
                  <p className="text-muted-foreground text-sm">Технические параметры генерации</p>
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
                          "cursor-pointer border border-border/40 rounded-xl p-4 flex flex-col items-center gap-3 transition-all hover:bg-muted/50",
                          aspectRatio === ratio && "border-primary bg-primary/10 shadow-[0_0_15px_theme(colors.primary.DEFAULT)]"
                        )}
                      >
                        <Ratio className={cn("w-6 h-6", aspectRatio === ratio ? "text-primary" : "text-muted-foreground")} />
                        <span className={cn("text-sm font-mono font-bold", aspectRatio === ratio ? "text-foreground" : "text-muted-foreground")}>{ratio}</span>
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
                      className={cn("flex-1 h-12 border-border/40 text-base", language === 'ru' && "border-primary bg-primary/10 text-primary")}
                    >
                      🇷🇺 Русский
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setLanguage('en')}
                      className={cn("flex-1 h-12 border-border/40 text-base", language === 'en' && "border-primary bg-primary/10 text-primary")}
                    >
                      🇬🇧 English
                    </Button>
                  </div>
                </div>

                {/* Variants Count */}
                <div className="space-y-6">
                  <div className="flex justify-between">
                    <Label className="text-base">Количество вариантов</Label>
                    <span className="text-primary font-bold font-mono">{variants[0]} шт.</span>
                  </div>
                  <Slider 
                    value={variants} 
                    onValueChange={setVariants} 
                    max={5} 
                    min={1} 
                    step={2} // 1, 3, 5
                    className="py-4"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground px-1 font-mono">
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
                  <p className="text-muted-foreground text-sm">Визуальная эстетика и настроение</p>
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
                        "cursor-pointer border border-border/40 rounded-xl p-4 flex items-start gap-4 transition-all hover:bg-muted/50 group",
                        style === s.id && "border-primary bg-primary/10"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors",
                        style === s.id && "bg-primary/20 text-primary"
                      )}>
                        <s.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className={cn("font-bold text-sm", style === s.id ? "text-foreground" : "text-muted-foreground")}>{s.label}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Color Selection */}
                <div className="space-y-4 pt-4 border-t border-border/40">
                  <Label className="text-base">Основной цвет</Label>
                  <div className="flex items-center gap-4">
                    <Button 
                      variant="outline"
                      onClick={() => setColorMode('auto')}
                      className={cn("h-10 border-border/40", colorMode === 'auto' && "border-primary bg-primary/10 text-primary")}
                    >
                      <Palette className="w-4 h-4 mr-2" />
                      АВТО
                    </Button>
                    
                    <div className="h-8 w-px bg-border/40" />
                    
                    <div className="flex gap-2">
                      {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'].map((c) => (
                        <div 
                          key={c}
                          onClick={() => { setColorMode('custom'); setCustomColor(c); }}
                          className={cn(
                            "w-8 h-8 rounded-full cursor-pointer transition-transform hover:scale-110 ring-2 ring-offset-2 ring-offset-background",
                            colorMode === 'custom' && customColor === c ? "ring-foreground" : "ring-transparent"
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
        <div className="p-6 border-t border-border/40 bg-muted/20 flex justify-between items-center shrink-0">
          <Button 
            variant="ghost" 
            onClick={handleBack} 
            disabled={step === 1 || isSubmitting}
            className="text-muted-foreground hover:text-foreground"
          >
            Назад
          </Button>
          
          <Button 
            onClick={step === 3 ? handleSubmit : handleNext}
            disabled={isSubmitting}
            className={cn(
              "px-8 h-12 text-sm font-bold uppercase tracking-widest shadow-lg transition-all",
              step === 3 
                ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20 hover:shadow-emerald-500/30 text-white" 
                : "bg-primary hover:bg-primary/90 shadow-primary/20 hover:shadow-primary/30 text-primary-foreground"
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
