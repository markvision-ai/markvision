import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles,
    Rocket,
    Type,
    Link as LinkIcon,
    Image as ImageIcon,
    Layers,
    Facebook,
    Instagram,
    PlaySquare,
    Camera,
    Layout,
    Settings2,
    CheckCircle2,
    AlertCircle,
    Wand2,
    ChevronRight,
    Palette
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ContentFactoryFormProps {
    projectId: string;
}

type SourceType = 'description' | 'link' | 'photo';
type ContentFormat = 'insta-carousel' | 'fb-target' | 'neuro-photo' | 'reels-cover' | 'instagram-stories';

const FORMATS = [
    { id: 'insta-carousel', label: 'Instagram Carousel', icon: Layers, color: 'text-pink-500' },
    { id: 'fb-target', label: 'Facebook Target', icon: Facebook, color: 'text-blue-500' },
    { id: 'neuro-photo', label: 'Нейрофото', icon: Camera, color: 'text-emerald-500' },
    { id: 'reels-cover', label: 'Обложка Reels', icon: PlaySquare, color: 'text-violet-500' },
    { id: 'instagram-stories', label: 'Instagram Stories', icon: Instagram, color: 'text-orange-500' },
] as const;

export const ContentFactoryForm: React.FC<ContentFactoryFormProps> = ({ projectId }) => {
    const [sourceType, setSourceType] = useState<SourceType>('description');
    const [format, setFormat] = useState<ContentFormat>('insta-carousel');
    const [mainText, setMainText] = useState('');
    const [magicGenerationNeeded, setMagicGenerationNeeded] = useState(false);
    const [visualInstructions, setVisualInstructions] = useState('');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [designTemplateId, setDesignTemplateId] = useState('template_1');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!mainText && !magicGenerationNeeded) {
            toast.error('Введите описание или активируйте Магию AI');
            return;
        }

        setIsLoading(true);

        const payload = {
            project_id: projectId,
            source_type: sourceType,
            format: format,
            main_text: mainText,
            magic_generation_needed: magicGenerationNeeded,
            visual_instructions: visualInstructions,
            aspect_ratio: aspectRatio,
            design_template_id: designTemplateId,
        };

        try {
            const webhookUrl = import.meta.env.VITE_N8N_CONTENT_WEBHOOK_URL;

            if (!webhookUrl) {
                throw new Error('URL вебхука n8n не настроен (VITE_N8N_CONTENT_WEBHOOK_URL)');
            }

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`Ошибка сервера: ${response.statusText}`);
            }

            toast.success('Задание отправлено на Контент-Завод!', {
                description: 'Генерация займет 1-2 минуты. Вы получите уведомление по готовности.',
                icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            });

            // Clear form
            setMainText('');
            setVisualInstructions('');
            setMagicGenerationNeeded(false);

        } catch (error: any) {
            console.error('Submission error:', error);
            toast.error('Ошибка отправки', {
                description: error.message || 'Не удалось связаться с Контент-Заводом.',
                icon: <AlertCircle className="w-5 h-5 text-red-500" />
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">
            {/* Header Section */}
            <div className="flex flex-col space-y-2">
                <div className="flex items-center gap-2 text-primary">
                    <Rocket className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-widest">Контент-Завод 3.0</span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Пульт управления</h1>
                <p className="text-muted-foreground max-w-2xl">
                    Спроектируйте ваш следующий виральный пост. Настройте параметры и отправьте задачу на наш AI-завод.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Block A: Source */}
                    <section className="space-y-4">
                        <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 px-1">
                            <Type className="w-4 h-4" /> Источник контента
                        </label>
                        <div className="grid grid-cols-3 gap-3 p-1 bg-muted/30 rounded-2xl border border-border overflow-hidden">
                            {(['description', 'link', 'photo'] as const).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setSourceType(type)}
                                    className={cn(
                                        "flex flex-col items-center justify-center py-4 px-2 rounded-xl transition-all duration-300 gap-2",
                                        sourceType === type
                                            ? "bg-background text-foreground shadow-sm border border-border"
                                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                    )}
                                >
                                    {type === 'description' && <Type className="w-5 h-5" />}
                                    {type === 'link' && <LinkIcon className="w-5 h-5" />}
                                    {type === 'photo' && <ImageIcon className="w-5 h-5" />}
                                    <span className="text-xs font-medium">
                                        {type === 'description' ? 'По описанию' : type === 'link' ? 'По ссылке' : 'По фото'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Block B: Format */}
                    <section className="space-y-4">
                        <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 px-1">
                            <Layout className="w-4 h-4" /> Выбор формата
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                            {FORMATS.map((f) => {
                                const Icon = f.icon;
                                const active = format === f.id;
                                return (
                                    <button
                                        key={f.id}
                                        onClick={() => setFormat(f.id)}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-5 rounded-2xl border transition-all duration-300 text-center gap-3 relative overflow-hidden group",
                                            active
                                                ? "bg-card border-primary/40 ring-1 ring-primary/20 shadow-md"
                                                : "bg-card border-border hover:border-primary/30 hover:shadow-sm"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-3 rounded-full transition-all duration-300",
                                            active ? "bg-primary/10 scale-105" : "bg-muted group-hover:bg-muted/80"
                                        )}>
                                            <Icon className={cn("w-5 h-5", active ? f.color : "text-muted-foreground")} />
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase tracking-tight leading-tight",
                                            active ? "text-foreground" : "text-muted-foreground"
                                        )}>
                                            {f.label}
                                        </span>
                                        {active && (
                                            <motion.div
                                                layoutId="active-format-dot"
                                                className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary"
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* Block C: Content */}
                    <section className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <Wand2 className="w-4 h-4" /> Сценарий и Текст
                            </label>

                            <button
                                onClick={() => setMagicGenerationNeeded(!magicGenerationNeeded)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300",
                                    magicGenerationNeeded
                                        ? "bg-amber-50 border-amber-200 text-amber-600 shadow-sm"
                                        : "bg-background border-border text-muted-foreground hover:bg-muted/50"
                                )}
                            >
                                <Sparkles className={cn("w-4 h-4", magicGenerationNeeded && "animate-pulse")} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Магия AI</span>
                            </button>
                        </div>

                        <div className="relative group">
                            <Textarea
                                placeholder={magicGenerationNeeded
                                    ? "Напишите краткую суть, остальное додумает AI..."
                                    : "Введите подробное описание или сценарий вашего контента..."
                                }
                                value={mainText}
                                onChange={(e) => setMainText(e.target.value)}
                                className="min-h-[200px] bg-card border-border text-foreground p-6 focus-visible:ring-primary/20 transition-all resize-none rounded-2xl leading-relaxed text-base shadow-sm"
                            />
                        </div>
                    </section>
                </div>

                {/* Sidebar Settings Area */}
                <div className="lg:col-span-4 space-y-6 text-foreground">
                    <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-8 sticky top-6">
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-[0.2em] flex items-center gap-3 pb-4 border-b border-border">
                            <Settings2 className="w-4 h-4 text-primary" /> Параметры
                        </h3>

                        {/* Aspect Ratio */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Пропорции</label>
                            <Select value={aspectRatio} onValueChange={setAspectRatio}>
                                <SelectTrigger className="bg-background border-border h-11 rounded-xl focus:ring-primary/10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1:1">1:1 (Квадрат)</SelectItem>
                                    <SelectItem value="9:16">9:16 (Stories/Reels)</SelectItem>
                                    <SelectItem value="4:5">4:5 (Портрет)</SelectItem>
                                    <SelectItem value="16:9">16:9 (Горизонт)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Design Template */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Стиль дизайна</label>
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { id: 'template_1', label: 'Минимализм', color: 'bg-zinc-100' },
                                    { id: 'template_2', label: 'Премиум Голд', color: 'bg-amber-100' },
                                    { id: 'template_3', label: '3D Футуризм', color: 'bg-blue-100' },
                                ].map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setDesignTemplateId(t.id)}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200",
                                            designTemplateId === t.id
                                                ? "bg-muted/50 border-primary/30 shadow-sm"
                                                : "bg-transparent border-transparent hover:bg-muted/30"
                                        )}
                                    >
                                        <div className={cn("w-5 h-5 rounded-md border border-border/50", t.color)} />
                                        <span className={cn(
                                            "text-xs font-semibold",
                                            designTemplateId === t.id ? "text-foreground" : "text-muted-foreground"
                                        )}>{t.label}</span>
                                        {designTemplateId === t.id && <CheckCircle2 className="w-4 h-4 ml-auto text-primary" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Visual Instructions */}
                        <div className="space-y-3 pt-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Palette className="w-3 h-3" /> Инструкции для фона
                            </label>
                            <Textarea
                                placeholder="Что изобразить на фоне?"
                                value={visualInstructions}
                                onChange={(e) => setVisualInstructions(e.target.value)}
                                className="bg-background border-border text-foreground p-4 focus-visible:ring-primary/20 transition-all resize-none rounded-xl text-sm min-h-[80px] shadow-sm"
                            />
                        </div>

                        {/* Main CTA */}
                        <div className="pt-4 space-y-4">
                            <Button
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className={cn(
                                    "w-full h-14 rounded-2xl text-base font-bold uppercase tracking-widest transition-all duration-300",
                                    isLoading
                                        ? "bg-muted text-muted-foreground"
                                        : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                                )}
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-3">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Обработка...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span>Сгенерировать</span>
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1" />
                                    </div>
                                )}
                            </Button>

                            <p className="text-[9px] text-muted-foreground text-center uppercase tracking-widest font-bold">
                                Будет использован 1 кредит генерации
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Internal Loader component
const Loader2 = ({ className }: { className?: string }) => (
    <svg
        className={cn("animate-spin", className)}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
    >
        <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
        />
        <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
    </svg>
);
