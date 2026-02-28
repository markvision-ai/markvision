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
    { id: 'insta-carousel', label: 'Instagram Carousel', icon: Layers, color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { id: 'fb-target', label: 'Facebook Target', icon: Facebook, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 'neuro-photo', label: 'Нейрофото', icon: Camera, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: 'reels-cover', label: 'Обложка Reels', icon: PlaySquare, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { id: 'instagram-stories', label: 'Instagram Stories', icon: Instagram, color: 'text-orange-400', bg: 'bg-orange-500/10' },
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
        <div className="relative min-h-full w-full bg-neutral-950 font-sans text-neutral-100 p-4 sm:p-8 overflow-hidden rounded-3xl border border-white/5 shadow-2xl">
            {/* Ambient Background Glow for Premium Feel */}
            <div className="absolute top-[-10%] left-[20%] w-[60%] h-[400px] bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none z-0" />
            <div className="absolute bottom-[-20%] right-[10%] w-[50%] h-[400px] bg-purple-500/15 blur-[150px] rounded-full pointer-events-none z-0" />

            <div className="relative z-10 max-w-[1200px] mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col space-y-4 pb-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md w-fit">
                        <Rocket className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Контент-Завод 3.0</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm">
                        Пульт управления <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">AI</span>
                    </h1>
                    <p className="text-neutral-400 max-w-2xl text-lg leading-relaxed">
                        Спроектируйте ваш следующий виральный пост. Выберите формат, настройте дизайн и отправьте задачу на наш автоматизированный AI-завод.
                    </p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Main Content Area */}
                    <div className="xl:col-span-8 space-y-8">

                        {/* Block A: Source */}
                        <section className="bg-neutral-900/50 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/10 flex flex-col gap-6 shadow-xl transition-all hover:bg-neutral-900/60">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                    <Type className="w-5 h-5 text-emerald-400" />
                                </div>
                                <h2 className="text-xl font-bold text-white tracking-wide">1. Источник контента</h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {(['description', 'link', 'photo'] as const).map((type) => {
                                    const active = sourceType === type;
                                    return (
                                        <button
                                            key={type}
                                            onClick={() => setSourceType(type)}
                                            className={cn(
                                                "relative flex flex-col items-center justify-center p-6 rounded-2xl transition-all duration-300 gap-4 overflow-hidden group outline-none",
                                                active
                                                    ? "border border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                                    : "border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                                            )}
                                        >
                                            <div className={cn(
                                                "p-3.5 rounded-full transition-colors duration-300 border",
                                                active ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-white/5 text-neutral-400 border-transparent group-hover:text-white"
                                            )}>
                                                {type === 'description' && <Type className="w-6 h-6 stroke-[1.5]" />}
                                                {type === 'link' && <LinkIcon className="w-6 h-6 stroke-[1.5]" />}
                                                {type === 'photo' && <ImageIcon className="w-6 h-6 stroke-[1.5]" />}
                                            </div>
                                            <span className={cn(
                                                "text-sm font-semibold transition-colors duration-300 tracking-wide",
                                                active ? "text-emerald-400 font-bold" : "text-neutral-400 group-hover:text-neutral-200"
                                            )}>
                                                {type === 'description' ? 'По описанию' : type === 'link' ? 'По ссылке' : 'По фото'}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Block B: Format */}
                        <section className="bg-neutral-900/50 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/10 flex flex-col gap-6 shadow-xl transition-all hover:bg-neutral-900/60">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                    <Layout className="w-5 h-5 text-purple-400" />
                                </div>
                                <h2 className="text-xl font-bold text-white tracking-wide">2. Выбор формата</h2>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                                {FORMATS.map((f) => {
                                    const Icon = f.icon;
                                    const active = format === f.id;
                                    return (
                                        <button
                                            key={f.id}
                                            onClick={() => setFormat(f.id)}
                                            className={cn(
                                                "relative flex flex-col items-center justify-center p-5 rounded-2xl transition-all duration-300 text-center gap-4 group",
                                                active
                                                    ? "border border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                                    : "border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                                            )}
                                        >
                                            <div className={cn(
                                                "p-3 rounded-xl transition-all duration-300",
                                                active ? `${f.bg} scale-110 border border-emerald-500/30` : "bg-white/5 border border-transparent group-hover:scale-105"
                                            )}>
                                                <Icon className={cn("w-6 h-6 stroke-[1.5]", active ? f.color : "text-neutral-400")} />
                                            </div>
                                            <span className={cn(
                                                "text-[11px] font-bold uppercase tracking-wider leading-tight",
                                                active ? "text-emerald-400" : "text-neutral-400 group-hover:text-neutral-200"
                                            )}>
                                                {f.label}
                                            </span>
                                            {active && (
                                                <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.5)] border border-emerald-200">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Block C: Content */}
                        <section className="bg-neutral-900/50 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/10 flex flex-col gap-6 shadow-xl transition-all hover:bg-neutral-900/60">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-white/10 pb-5">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                        <Wand2 className="w-5 h-5 text-teal-400" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white tracking-wide">3. Сценарий и Текст</h2>
                                </div>

                                <button
                                    onClick={() => setMagicGenerationNeeded(!magicGenerationNeeded)}
                                    className={cn(
                                        "relative overflow-hidden flex items-center gap-2.5 px-6 py-2.5 rounded-full transition-all duration-300 font-bold text-xs uppercase tracking-widest outline-none",
                                        magicGenerationNeeded
                                            ? "border border-purple-500/50 bg-purple-500/20 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-emerald-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                                            : "border border-white/10 bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
                                    )}
                                >
                                    {magicGenerationNeeded && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-emerald-500/20 opacity-50 animate-pulse pointer-events-none" />
                                    )}
                                    <Sparkles className={cn("w-4 h-4 z-10", magicGenerationNeeded ? "text-purple-400 animate-pulse" : "text-neutral-400 group-hover:text-white")} />
                                    <span className="z-10">{magicGenerationNeeded ? "Магия AI Активна" : "Магия AI ✨"}</span>
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
                                        "min-h-[240px] p-6 text-base leading-relaxed resize-none rounded-2xl transition-all duration-300 text-white outline-none ring-0",
                                        magicGenerationNeeded
                                            ? "bg-black/40 border border-purple-500/30 focus-visible:ring-0 focus-visible:border-purple-400 placeholder:text-purple-300/30"
                                            : "bg-black/40 border border-white/10 focus-visible:ring-0 focus-visible:border-emerald-500 placeholder:text-neutral-500/50"
                                    )}
                                />
                            </div>
                        </section>
                    </div>

                    {/* Sidebar Settings Area */}
                    <div className="xl:col-span-4 space-y-6">
                        <div className="bg-neutral-900/50 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl border border-white/10 flex flex-col gap-8 sticky top-6">
                            <div className="flex items-center gap-4 pb-6 border-b border-white/10">
                                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                    <Settings2 className="w-5 h-5 text-emerald-400" />
                                </div>
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest">
                                    Параметры дизайна
                                </h3>
                            </div>

                            {/* Aspect Ratio */}
                            <div className="space-y-4">
                                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                    Пропорции
                                </label>
                                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                                    <SelectTrigger className="bg-black/40 border-white/10 h-14 rounded-xl text-white font-semibold focus:ring-0 focus:border-emerald-500/50 hover:border-white/20 transition-colors">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-white/10 shadow-2xl bg-neutral-900 text-white">
                                        <SelectItem value="1:1" className="cursor-pointer font-medium py-3 rounded-lg mx-1 my-0.5 focus:bg-white/5 focus:text-emerald-400">1:1 (Квадратный)</SelectItem>
                                        <SelectItem value="9:16" className="cursor-pointer font-medium py-3 rounded-lg mx-1 my-0.5 focus:bg-white/5 focus:text-emerald-400">9:16 (Stories/Reels)</SelectItem>
                                        <SelectItem value="4:5" className="cursor-pointer font-medium py-3 rounded-lg mx-1 my-0.5 focus:bg-white/5 focus:text-emerald-400">4:5 (Портретный)</SelectItem>
                                        <SelectItem value="16:9" className="cursor-pointer font-medium py-3 rounded-lg mx-1 my-0.5 focus:bg-white/5 focus:text-emerald-400">16:9 (Горизонтальный)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Design Template */}
                            <div className="space-y-4">
                                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">
                                    Шаблон стиля
                                </label>
                                <div className="grid grid-cols-1 gap-3">
                                    {[
                                        { id: 'template_1', label: 'Минимализм (Clean)', color: 'bg-white border-white/20' },
                                        { id: 'template_2', label: 'Премиум Голд', color: 'bg-gradient-to-br from-amber-200 to-yellow-600 border-amber-500/20' },
                                        { id: 'template_3', label: '3D Футуризм', color: 'bg-gradient-to-br from-blue-400 to-indigo-600 border-blue-500/20' },
                                    ].map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setDesignTemplateId(t.id)}
                                            className={cn(
                                                "flex items-center gap-4 p-4 rounded-xl transition-all duration-300 outline-none backdrop-blur-md",
                                                designTemplateId === t.id
                                                    ? "border border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                                    : "border border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5"
                                            )}
                                        >
                                            <div className={cn("w-6 h-6 rounded-md border", t.color)} />
                                            <span className={cn(
                                                "text-sm font-bold tracking-wide",
                                                designTemplateId === t.id ? "text-emerald-400" : "text-neutral-300"
                                            )}>{t.label}</span>
                                            {designTemplateId === t.id && (
                                                <CheckCircle2 className="w-5 h-5 ml-auto text-emerald-500 animate-in zoom-in duration-200" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Visual Instructions */}
                            <div className="space-y-4 pt-2">
                                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                    <Palette className="w-4 h-4 text-neutral-500" /> Доп. инструкции (Фон, цвета)
                                </label>
                                <Textarea
                                    placeholder="Опишите желаемый фон, цвета или специфичные элементы дизайна..."
                                    value={visualInstructions}
                                    onChange={(e) => setVisualInstructions(e.target.value)}
                                    className="bg-black/40 border border-white/10 text-white p-5 focus-visible:ring-0 focus-visible:border-emerald-500 transition-all resize-none rounded-xl text-sm min-h-[120px] placeholder:text-neutral-500/50"
                                />
                            </div>

                            {/* Main CTA */}
                            <div className="pt-8 space-y-4 border-t border-white/10">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    className={cn(
                                        "relative overflow-hidden w-full h-16 rounded-2xl text-base font-extrabold uppercase tracking-widest transition-all duration-300 group shadow-lg text-white border-none",
                                        isLoading
                                            ? "bg-neutral-800 cursor-not-allowed text-neutral-400 shadow-none"
                                            : "bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/30 hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:brightness-110 hover:-translate-y-0.5"
                                    )}
                                >
                                    {/* Subtle shine effect on hover */}
                                    {!isLoading && (
                                        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                                    )}

                                    {isLoading ? (
                                        <div className="flex items-center justify-center gap-3">
                                            <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
                                            <span>Обработка...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-3 z-10 relative">
                                            <span className="drop-shadow-sm font-bold tracking-widest">Сгенерировать</span>
                                            <Rocket className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300 drop-shadow-sm" />
                                        </div>
                                    )}
                                </Button>

                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">
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
