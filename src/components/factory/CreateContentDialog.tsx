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
  { value: 'minimal', label: 'Минимализм', color: 'bg-slate-500' },
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
                ? "border-blue-500 bg-blue-50/50 text-blue-600 shadow-sm" 
                : "border-slate-100 hover:border-blue-200 hover:bg-slate-50 text-slate-600"
            )}
          >
            {item.icon}
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="min-h-[120px]">
        {sourceType === 'link' && (
          <div className="space-y-3">
            <Label>Ссылка на товар (Kaspi/WB/Instagram)</Label>
            <Input 
              placeholder="https://..." 
              value={sourceValue}
              onChange={(e) => setSourceValue(e.target.value)}
              className="h-12 text-lg"
            />
          </div>
        )}
        {sourceType === 'photo' && (
          <div className="space-y-3">
            <Label>Загрузите фото товара</Label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer relative group">
              <Input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                accept="image/*"
              />
              <div className="group-hover:scale-105 transition-transform duration-300">
                <ImageIcon className="w-10 h-10 mx-auto text-blue-500 mb-3" />
                <p className="text-sm font-medium text-slate-700">
                  {selectedFile ? selectedFile.name : "Нажмите для загрузки или перетащите"}
                </p>
                <p className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP до 10MB</p>
              </div>
            </div>
          </div>
        )}
        {sourceType === 'description' && (
          <div className="space-y-3">
            <Label>Опишите идею или товар</Label>
            <Textarea 
              placeholder="Введите текст здесь..." 
              value={sourceValue}
              onChange={(e) => setSourceValue(e.target.value)}
              className="min-h-[120px] text-base resize-none"
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
        <Label className="text-base">Формат видео</Label>
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
                  ? "border-blue-500 bg-blue-50/50 text-blue-600 shadow-sm" 
                  : "bg-white text-slate-500 border-slate-100 hover:border-slate-200 hover:bg-slate-50"
              )}
            >
              {ratio.icon}
              <span className="font-bold text-sm">{ratio.label}</span>
              <span className="text-[10px] uppercase tracking-wider opacity-70">{ratio.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quantity Variants - UPDATED */}
      <div className="space-y-4">
        <Label className="text-base">Количество вариантов</Label>
        <div className="flex gap-4">
          {[5, 7, 10].map((count) => (
            <button
              key={count}
              onClick={() => setQuantity(count)}
              className={cn(
                "flex-1 py-4 rounded-xl border-2 font-bold text-xl transition-all flex flex-col items-center justify-center gap-1",
                quantity === count
                  ? "border-purple-500 bg-purple-50 text-purple-600 shadow-sm ring-1 ring-purple-500/20"
                  : "border-slate-100 hover:border-purple-200 hover:bg-purple-50/30 text-slate-600"
              )}
            >
              <span>{count}</span>
              <span className="text-[10px] font-normal uppercase tracking-wider text-slate-400">Вариантов</span>
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
          <Label>Стиль дизайна</Label>
          {stylePreset === 'custom' && (
             <Button variant="link" size="sm" className="h-auto p-0 text-purple-600" onClick={() => toast.info('Редактор шаблонов скоро будет доступен')}>
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
                  ? "border-blue-500 shadow-md bg-blue-50/30"
                  : "border-slate-100 hover:border-slate-200 bg-slate-50 hover:bg-white"
              )}
            >
              <div className={cn("absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20 -mr-6 -mt-6 transition-transform group-hover:scale-150", preset.color)} />
              
              <div className="relative z-10">
                {preset.value === 'custom' ? (
                  <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center mb-2">
                    <Plus className="w-4 h-4 text-purple-600" />
                  </div>
                ) : (
                  <div className={cn("w-2 h-2 rounded-full mb-auto", preset.color.replace('bg-', 'bg-'))} />
                )}
              </div>

              <div className="relative z-10 flex items-end justify-between w-full">
                <span className={cn(
                  "font-semibold text-sm leading-tight",
                  stylePreset === preset.value ? "text-blue-900" : "text-slate-700"
                )}>
                  {preset.label}
                </span>
                {stylePreset === preset.value && (
                  <div className="bg-blue-500 rounded-full p-0.5">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Color Picker - UPDATED */}
      <div className="space-y-3">
        <Label>Акцентный цвет</Label>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="flex flex-wrap gap-3">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setCustomColor(color)}
                className={cn(
                  "w-8 h-8 rounded-full shadow-sm transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                  customColor === color && "ring-2 ring-offset-2 ring-blue-500 scale-110"
                )}
                style={{ backgroundColor: color, border: color === '#FFFFFF' ? '1px solid #e2e8f0' : 'none' }}
              />
            ))}
            
            {/* Custom Picker */}
            <div className="relative group">
              <div 
                className={cn(
                  "w-8 h-8 rounded-full shadow-sm cursor-pointer transition-transform hover:scale-110 border border-slate-200",
                  !PRESET_COLORS.includes(customColor) && "ring-2 ring-offset-2 ring-blue-500 scale-110"
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
          
          <div className="mt-3 flex items-center gap-2">
            <div 
              className="w-20 h-8 rounded-md border border-slate-200 shadow-sm"
              style={{ backgroundColor: customColor }} 
            />
            <span className="text-xs font-mono text-slate-500 uppercase">{customColor}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden bg-white/95 backdrop-blur-xl border-slate-200/60 shadow-2xl rounded-2xl">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Мастер создания контента
          </DialogTitle>
        </DialogHeader>

        {/* Stepper Progress */}
        <div className="px-6 py-2">
          <div className="flex items-center gap-2 mb-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-500 ease-out", 
                    s <= step ? "bg-gradient-to-r from-blue-500 to-purple-500" : "bg-transparent"
                  )} 
                />
              </div>
            ))}
          </div>
          <p className="text-xs font-medium text-slate-400 text-right">Шаг {step} из 3</p>
        </div>

        <div className="px-6 py-4 min-h-[350px]">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between sm:justify-between">
          <Button 
            variant="ghost" 
            onClick={step === 1 ? () => onOpenChange(false) : handleBack}
            className="text-slate-500 hover:text-slate-800"
          >
            {step === 1 ? 'Отмена' : 'Назад'}
          </Button>
          
          {step < 3 ? (
            <Button onClick={handleNext} className="gap-2 bg-black hover:bg-slate-800 text-white shadow-2xl shadow-blue-900/5 shadow-slate-200">
              Далее
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={isCreating} className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl shadow-blue-900/5 shadow-purple-200">
              {isCreating ? 'Создаем...' : 'Запустить создание'}
              <Sparkles className="w-4 h-4" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
