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
import {
  Link,
  Image as ImageIcon,
  FileText,
  Check,
  ChevronRight,
  Sparkles,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CreateContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: any) => Promise<unknown>;
}

type SourceType = 'link' | 'photo' | 'description';
type AspectRatio = '1:1' | '9:16' | '16:9';
type StylePreset = 'premium' | 'minimal' | 'energetic' | 'corporate' | 'custom';

const STYLE_PRESETS: { value: StylePreset; label: string; color: string }[] = [
  { value: 'premium', label: 'Премиум', color: 'bg-amber-500' },
  { value: 'minimal', label: 'Минимализм', color: 'bg-white/50' },
  { value: 'energetic', label: 'Энергичный', color: 'bg-red-500' },
  { value: 'corporate', label: 'Корпоративный', color: 'bg-blue-600' },
  { value: 'custom', label: 'Свой шаблон', color: 'bg-purple-500' },
];

const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#FF3B30', '#FF9500',
  '#34C759', '#007AFF', '#5856D6', '#FF2D55',
  '#AF52DE', '#FFD60A', '#8E8E93'
];

export const CreateContentDialog = ({
  open,
  onOpenChange,
  onCreate,
}: CreateContentDialogProps) => {
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);

  // Form Data
  const [sourceType, setSourceType] = useState<SourceType>('link');
  const [sourceValue, setSourceValue] = useState(''); // URL, or Text
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  // Removed language state
  const [quantity, setQuantity] = useState(5); // Default 5

  const [stylePreset, setStylePreset] = useState<StylePreset>('premium');
  const [customColor, setCustomColor] = useState('#000000');

  const handleNext = () => setStep(prev => Math.min(prev + 1, 3));
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const handleCreate = async () => {
    setIsCreating(true);

    const payload = {
      source_type: sourceType,
      source_value: sourceValue,
      // file would need upload logic, sending name for now if file selected
      file_name: selectedFile?.name,
      settings: {
        aspect_ratio: aspectRatio,
        // Removed language from payload
        quantity: quantity,
        style_preset: stylePreset,
        custom_color: customColor
      },
      title: `Content from ${sourceType} - ${new Date().toLocaleTimeString()}`, // Auto-generate title
      content_type: 'avatar_video', // Default fallback
      status: 'pending'
    };

    await onCreate(payload);
    setIsCreating(false);

    // Reset & Close
    setStep(1);
    setSourceValue('');
    setSelectedFile(null);
    onOpenChange(false);
  };

  const renderStep1 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-3 gap-3">
        {[
          { id: 'link', label: 'По ссылке', icon: <Link className="w-6 h-6" /> },
          { id: 'photo', label: 'По фото', icon: <ImageIcon className="w-6 h-6" /> },
          { id: 'description', label: 'По описанию', icon: <FileText className="w-6 h-6" /> },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setSourceType(item.id as SourceType)}
            className={cn(
              "flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all",
              sourceType === item.id
                ? "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/20"
                : "border-white/5 hover:border-white/10 bg-white/5 text-white/40 hover:text-white/60"
            )}
          >
            {item.icon}
            <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="min-h-[120px]">
        {sourceType === 'link' && (
          <div className="space-y-3">
            <Label className="text-white/40 uppercase tracking-widest text-[10px] font-black ml-1">Ссылка на товар (Kaspi/WB/Instagram)</Label>
            <Input
              placeholder="https://..."
              value={sourceValue}
              onChange={(e) => setSourceValue(e.target.value)}
              className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl"
            />
          </div>
        )}
        {sourceType === 'photo' && (
          <div className="space-y-3">
            <Label className="text-white/40 uppercase tracking-widest text-[10px] font-black ml-1">Загрузите фото товара</Label>
            <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:bg-white/10 transition-colors cursor-pointer relative group">
              <Input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                accept="image/*"
              />
              <div className="group-hover:scale-105 transition-transform duration-300">
                <ImageIcon className="w-10 h-10 mx-auto text-primary mb-3" />
                <p className="text-sm font-bold text-white/80">
                  {selectedFile ? selectedFile.name : "Нажмите для загрузки или перетащите"}
                </p>
                <p className="text-xs text-white/40 mt-1 uppercase tracking-widest font-bold">JPG, PNG, WEBP до 10MB</p>
              </div>
            </div>
          </div>
        )}
        {sourceType === 'description' && (
          <div className="space-y-3">
            <Label className="text-white/40 uppercase tracking-widest text-[10px] font-black ml-1">Опишите идею или товар</Label>
            <Textarea
              placeholder="Введите текст здесь..."
              value={sourceValue}
              onChange={(e) => setSourceValue(e.target.value)}
              className="min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl resize-none p-4"
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Aspect Ratio */}
      <div className="space-y-4">
        <Label className="text-white/40 uppercase tracking-widest text-[10px] font-black ml-1">Формат видео</Label>
        <div className="flex gap-4">
          {[
            { id: '1:1', label: 'Квадрат', sub: 'Post', icon: <div className="w-6 h-6 border-2 border-current rounded-sm" /> },
            { id: '9:16', label: 'Вертикаль', sub: 'Reels/TikTok', icon: <div className="w-4 h-7 border-2 border-current rounded-sm" /> },
            { id: '16:9', label: 'Горизонт', sub: 'YouTube', icon: <div className="w-7 h-4 border-2 border-current rounded-sm" /> },
          ].map((ratio) => (
            <button
              key={ratio.id}
              onClick={() => setAspectRatio(ratio.id as AspectRatio)}
              className={cn(
                "flex flex-col items-center gap-2 py-4 px-2 rounded-xl border-2 transition-all flex-1 justify-center relative overflow-hidden",
                aspectRatio === ratio.id
                  ? "border-secondary bg-secondary/10 text-secondary shadow-sm shadow-secondary/20"
                  : "bg-white/5 text-white/40 border-white/5 hover:border-white/10 hover:bg-white/10"
              )}
            >
              {ratio.icon}
              <span className="font-bold text-xs uppercase tracking-tight">{ratio.label}</span>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-50">{ratio.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quantity Variants */}
      <div className="space-y-4">
        <Label className="text-white/40 uppercase tracking-widest text-[10px] font-black ml-1">Количество вариантов</Label>
        <div className="flex gap-4">
          {[5, 7, 10].map((count) => (
            <button
              key={count}
              onClick={() => setQuantity(count)}
              className={cn(
                "flex-1 py-4 rounded-xl border-2 font-black transition-all flex flex-col items-center justify-center gap-1",
                quantity === count
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : "border-white/5 hover:border-white/10 hover:bg-white/5 text-white/40"
              )}
            >
              <span className="text-2xl">{count}</span>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Вариантов</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Style Presets */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label className="text-white/40 uppercase tracking-widest text-[10px] font-black ml-1">Стиль дизайна</Label>
          {stylePreset === 'custom' && (
            <Button variant="link" size="sm" className="h-auto p-0 text-primary hover:text-primary/80 uppercase tracking-widest text-[10px] font-black" onClick={() => toast.info('Редактор шаблонов скоро будет доступен')}>
              + Создать новый
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {STYLE_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => setStylePreset(preset.value)}
              className={cn(
                "relative overflow-hidden p-4 rounded-xl border-2 text-left transition-all h-24 flex flex-col justify-between group",
                stylePreset === preset.value
                  ? "border-primary bg-primary/10 shadow-lg shadow-primary/5"
                  : "border-white/5 hover:border-white/10 bg-white/5 text-white/40 hover:text-white/60"
              )}
            >
              <div className={cn("absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20 -mr-6 -mt-6 transition-transform group-hover:scale-150", preset.color)} />

              <div className="relative z-10">
                {preset.value === 'custom' ? (
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mb-2 border border-white/20">
                    <Plus className="w-4 h-4 text-primary" />
                  </div>
                ) : (
                  <div className={cn("w-2 h-2 rounded-full mb-auto", preset.color)} />
                )}
              </div>

              <div className="relative z-10 flex items-end justify-between w-full">
                <span className={cn(
                  "font-bold text-[10px] uppercase tracking-widest leading-tight",
                  stylePreset === preset.value ? "text-primary" : "text-white/60"
                )}>
                  {preset.label}
                </span>
                {stylePreset === preset.value && (
                  <div className="bg-primary rounded-full p-0.5 shadow-lg shadow-primary/40">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Color Picker */}
      <div className="space-y-3">
        <Label className="text-white/40 uppercase tracking-widest text-[10px] font-black ml-1">Акцентный цвет</Label>
        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
          <div className="flex flex-wrap gap-3">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setCustomColor(color)}
                className={cn(
                  "w-8 h-8 rounded-full shadow-sm transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
                  customColor === color && "ring-2 ring-offset-2 ring-primary scale-110"
                )}
                style={{ backgroundColor: color, border: '1px solid rgba(255,255,255,0.1)' }}
              />
            ))}

            {/* Custom Picker */}
            <div className="relative group">
              <div
                className={cn(
                  "w-8 h-8 rounded-full shadow-sm cursor-pointer transition-transform hover:scale-110 border border-white/20",
                  !PRESET_COLORS.includes(customColor) && "ring-2 ring-offset-2 ring-primary scale-110"
                )}
                style={{
                  background: 'conic-gradient(from 180deg at 50% 50%, red 0deg, orange 60deg, yellow 120deg, green 180deg, blue 240deg, purple 300deg, red 360deg)'
                }}
              />
              <Input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full p-0 border-0"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div
              className="w-20 h-8 rounded-lg border border-white/20 shadow-inner"
              style={{ backgroundColor: customColor }}
            />
            <span className="text-[10px] font-black font-mono text-white/40 uppercase tracking-[0.2em]">{customColor}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden bg-[#020617]/95 backdrop-blur-3xl border-white/10 shadow-interstellar rounded-3xl">
        <DialogHeader className="px-8 pt-8 pb-4">
          <DialogTitle className="text-xl font-black flex items-center gap-3 uppercase tracking-tight">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            Мастер создания контента
          </DialogTitle>
        </DialogHeader>

        {/* Stepper Progress */}
        <div className="px-8 py-2">
          <div className="flex items-center gap-3 mb-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden border border-white/10">
                <div
                  className={cn(
                    "h-full transition-all duration-700 ease-out",
                    s <= step ? "bg-gradient-to-r from-primary to-[#B57170] shadow-[0_0_10px_rgba(181,113,112,0.3)]" : "bg-transparent"
                  )}
                />
              </div>
            ))}
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 text-right">Шаг {step} из 3</p>
        </div>

        <div className="px-8 py-6 min-h-[400px]">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        <DialogFooter className="px-8 py-6 bg-white/5 border-t border-white/10 flex items-center justify-between sm:justify-between">
          <Button
            variant="ghost"
            onClick={step === 1 ? () => onOpenChange(false) : handleBack}
            className="text-white/40 hover:text-white uppercase tracking-widest text-[10px] font-black h-12 px-6 rounded-xl transition-all"
          >
            {step === 1 ? 'Отмена' : 'Назад'}
          </Button>

          {step < 3 ? (
            <Button onClick={handleNext} className="gap-3 bg-secondary hover:bg-secondary/90 text-white shadow-lg shadow-secondary/20 h-12 px-8 rounded-xl uppercase tracking-widest text-[10px] font-black transition-all">
              Далее
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={isCreating} className="gap-3 bg-gradient-to-r from-primary to-[#955251] hover:from-primary/90 hover:to-[#B57170] text-white shadow-interstellar h-12 px-10 rounded-xl uppercase tracking-widest text-[10px] font-black transition-all">
              {isCreating ? 'Создаем...' : 'Запустить создание'}
              <Sparkles className="w-4 h-4" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
