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
import { Textarea } from '@/components/ui/textarea';
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
    { id: 'insta-carousel', label: 'Instagram Carousel', icon: Layers, color: 'text-pink-600', bg: 'bg-pink-50' },
    { id: 'fb-target', label: 'Facebook Target', icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'neuro-photo', label: 'Нейрофото', icon: Camera, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'reels-cover', label: 'Обложка Reels', icon: PlaySquare, color: 'text-violet-600', bg: 'bg-violet-50' },
    { id: 'instagram-stories', label: 'Instagram Stories', icon: Instagram, color: 'text-orange-600', bg: 'bg-orange-50' },
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
        <div className="relative max-w-[1200px] mx-auto p-4 sm:p-8 font-sans animate-in fade-in duration-700">
            {/* Ambient Background Glow for Premium Feel */}
            <div className="absolute top-[-10%] left-[20%] w-[60%] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none z-0" />

            <div className="relative z-10 space-y-8">
                {/* Header Section */}
                <div className="flex flex-col space-y-3 pb-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 w-fit border border-primary/20">
                        <Rocket className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold text-primary uppercase tracking-widest">Контент-Завод 3.0</span>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Пульт управления</h1>
                    <p className="text-slate-500 pr-4 max-w-2xl text-lg leading-relaxed">
                        Спроектируйте ваш следующий виральный пост. Выберите формат, настройте дизайн и отправьте задачу на наш автоматизированный AI-завод.
                    </p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Main Content Area */}
                    <div className="xl:col-span-8 space-y-8">

                        {/* Block A: Source */}
                        <section className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col gap-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-slate-100 rounded-xl">
                                    <Type className="w-5 h-5 text-slate-600" />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800">1. Источник контента</h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {(['description', 'link', 'photo'] as const).map((type) => {
                                    const active = sourceType === type;
                                    return (
                                        <button
                                            key={type}
                                            onClick={() => setSourceType(type)}
                                            className={cn(
                                                "relative flex flex-col items-center justify-center p-5 rounded-2xl transition-all duration-300 gap-3 overflow-hidden group border-2 outline-none",
                                                active
                                                    ? "border-primary bg-primary/5 shadow-sm"
                                                    : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                                            )}
                                        >
                                            <div className={cn(
                                                "p-3 rounded-full transition-colors duration-300",
                                                active ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700"
                                            )}>
                                                {type === 'description' && <Type className="w-5 h-5" />}
                                                {type === 'link' && <LinkIcon className="w-5 h-5" />}
                                                {type === 'photo' && <ImageIcon className="w-5 h-5" />}
                                            </div>
                                            <span className={cn(
                                                "text-sm font-semibold transition-colors duration-300",
                                                active ? "text-slate-900" : "text-slate-600"
                                            )}>
                                                {type === 'description' ? 'По описанию' : type === 'link' ? 'По ссылке' : 'По фото'}
                                            </span>
                                            {active && (
                                                <motion.div layoutId="source-active-bg" className="absolute inset-0 bg-primary/5 z-[-1] rounded-xl" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Block B: Format */}
                        <section className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col gap-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-slate-100 rounded-xl">
                                    <Layout className="w-5 h-5 text-slate-600" />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800">2. Выбор формата</h2>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                {FORMATS.map((f) => {
                                    const Icon = f.icon;
                                    const active = format === f.id;
                                    return (
                                        <button
                                            key={f.id}
                                            onClick={() => setFormat(f.id)}
                                            className={cn(
                                                "relative flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all duration-300 text-center gap-4 group",
                                                active
                                                    ? "border-primary bg-white shadow-md shadow-primary/10"
                                                    : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"
                                            )}
                                        >
                                            <div className={cn(
                                                "p-3.5 rounded-full transition-all duration-300",
                                                active ? `${f.bg} scale-110 shadow-inner` : "bg-slate-50 group-hover:bg-slate-100 group-hover:scale-105"
                                            )}>
                                                <Icon className={cn("w-6 h-6", active ? f.color : "text-slate-400")} />
                                            </div>
                                            <span className={cn(
                                                "text-xs font-bold uppercase tracking-tight leading-tight",
                                                active ? "text-slate-900" : "text-slate-500"
                                            )}>
                                                {f.label}
                                            </span>
                                            {active && (
                                                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center shadow-sm border-2 border-white">
                                                    <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Block C: Content */}
                        <section className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col gap-5">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-slate-100 rounded-xl">
                                        <Wand2 className="w-5 h-5 text-slate-600" />
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-800">3. Сценарий и Текст</h2>
                                </div>

                                <button
                                    onClick={() => setMagicGenerationNeeded(!magicGenerationNeeded)}
                                    className={cn(
                                        "relative overflow-hidden flex items-center gap-2.5 px-5 py-2.5 rounded-full border transition-all duration-300 font-bold text-xs uppercase tracking-widest outline-none",
                                        magicGenerationNeeded
                                            ? "border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 text-orange-600 shadow-inner"
                                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                                    )}
                                >
                                    {magicGenerationNeeded && (
                                        <span className="absolute inset-0 bg-gradient-to-r from-orange-100/50 via-amber-100/30 to-orange-100/50 opacity-50 animate-pulse" />
                                    )}
                                    <Sparkles className={cn("w-4 h-4 z-10", magicGenerationNeeded && "animate-pulse")} />
                                    <span className="z-10">Магия AI ✨</span>
                                </button>
                            </div>

                            <div className="relative group">
                                <Textarea
                                    placeholder={magicGenerationNeeded
                                        ? "✨ Напишите краткую суть в 2-3 словах, остальное блестяще додумает AI..."
                                        : "📝 Введите подробное описание, текст поста или сценарий вашего контента..."
                                    }
                                    value={mainText}
                                    onChange={(e) => setMainText(e.target.value)}
                                    className={cn(
                                        "min-h-[220px] p-6 text-base leading-relaxed resize-none rounded-2xl transition-all duration-300",
                                        magicGenerationNeeded
                                            ? "bg-amber-50/30 border-amber-200/50 focus-visible:ring-amber-500/20 text-slate-800 placeholder:text-amber-700/40"
                                            : "bg-slate-50 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary text-slate-800 placeholder:text-slate-400"
                                    )}
                                />
                            </div>
                        </section>
                    </div>

                    {/* Sidebar Settings Area */}
                    <div className="xl:col-span-4 space-y-6">
                        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_2px_30px_rgb(0,0,0,0.06)] border border-slate-100 flex flex-col gap-8 sticky top-6">
                            <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Settings2 className="w-5 h-5 text-primary" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">
                                    Параметры дизайна
                                </h3>
                            </div>

                            {/* Aspect Ratio */}
                            <div className="space-y-4">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    Пропорции
                                </label>
                                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                                    <SelectTrigger className="bg-slate-50 border-slate-200 h-12 rounded-xl text-slate-700 font-medium focus:ring-primary/20 hover:border-slate-300 transition-colors">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                        <SelectItem value="1:1" className="cursor-pointer font-medium py-3 rounded-lg mx-1 my-0.5">1:1 (Квадратный)</SelectItem>
                                        <SelectItem value="9:16" className="cursor-pointer font-medium py-3 rounded-lg mx-1 my-0.5">9:16 (Stories/Reels)</SelectItem>
                                        <SelectItem value="4:5" className="cursor-pointer font-medium py-3 rounded-lg mx-1 my-0.5">4:5 (Портретный)</SelectItem>
                                        <SelectItem value="16:9" className="cursor-pointer font-medium py-3 rounded-lg mx-1 my-0.5">16:9 (Горизонтальный)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Design Template */}
                            <div className="space-y-4">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                    Шаблон стиля
                                </label>
                                <div className="grid grid-cols-1 gap-3">
                                    {[
                                        { id: 'template_1', label: 'Минимализм (Clean)', color: 'bg-white border-slate-200 shadow-sm' },
                                        { id: 'template_2', label: 'Премиум Голд', color: 'bg-gradient-to-br from-amber-200 to-yellow-500 shadow-md border-transparent' },
                                        { id: 'template_3', label: '3D Футуризм', color: 'bg-gradient-to-br from-blue-400 to-indigo-600 shadow-md border-transparent' },
                                    ].map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setDesignTemplateId(t.id)}
                                            className={cn(
                                                "flex items-center gap-4 p-3.5 rounded-xl border-2 transition-all duration-300 outline-none",
                                                designTemplateId === t.id
                                                    ? "border-primary bg-primary/5 shadow-sm"
                                                    : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                                            )}
                                        >
                                            <div className={cn("w-6 h-6 rounded-md border", t.color)} />
                                            <span className={cn(
                                                "text-sm font-bold",
                                                designTemplateId === t.id ? "text-primary" : "text-slate-600"
                                            )}>{t.label}</span>
                                            {designTemplateId === t.id && (
                                                <CheckCircle2 className="w-5 h-5 ml-auto text-primary animate-in zoom-in duration-200" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Visual Instructions */}
                            <div className="space-y-4 pt-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Palette className="w-4 h-4 text-slate-400" /> Доп. инструкции (Фон, цвета)
                                </label>
                                <Textarea
                                    placeholder="Опишите желаемый фон, цвета или специфичные элементы дизайна..."
                                    value={visualInstructions}
                                    onChange={(e) => setVisualInstructions(e.target.value)}
                                    className="bg-slate-50 border-slate-200 text-slate-800 p-4 focus-visible:ring-primary/20 focus-visible:border-primary transition-all resize-none rounded-xl text-sm min-h-[100px]"
                                />
                            </div>

                            {/* Main CTA */}
                            <div className="pt-6 space-y-4 border-t border-slate-100">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    className={cn(
                                        "relative overflow-hidden w-full h-16 rounded-2xl text-base font-extrabold uppercase tracking-widest transition-all duration-300 group shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.16)] text-white border-none",
                                        isLoading
                                            ? "bg-slate-300 cursor-not-allowed text-slate-500 shadow-none hover:shadow-none"
                                            : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:-translate-y-0.5"
                                    )}
                                >
                                    {/* Subtle shine effect on hover */}
                                    {!isLoading && (
                                        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                                    )}

                                    {isLoading ? (
                                        <div className="flex items-center justify-center gap-3">
                                            <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                                            <span>Обработка...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-3 z-10 relative">
                                            <span>Сгенерировать</span>
                                            <Rocket className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                                        </div>
                                    )}
                                </Button>

                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                        Будет использован 1 кредит
                                    </p>
                                </div>
                            </div>
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
