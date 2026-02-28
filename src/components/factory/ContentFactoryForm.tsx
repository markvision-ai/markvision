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
        <div className="relative min-h-full w-full bg-slate-50/50 font-sans text-slate-800 p-4 sm:p-8 overflow-hidden rounded-3xl border border-slate-200/50 shadow-sm">
            {/* Ambient Background Glow for Premium Feel */}
            <div className="absolute top-[-10%] left-[20%] w-[60%] h-[400px] bg-emerald-200/30 blur-[120px] rounded-full pointer-events-none z-0" />
            <div className="absolute bottom-[-20%] right-[10%] w-[50%] h-[400px] bg-sky-200/30 blur-[150px] rounded-full pointer-events-none z-0" />

            <div className="relative z-10 max-w-[1200px] mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col space-y-4 pb-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 border border-white/80 shadow-sm backdrop-blur-md w-fit">
                        <Rocket className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Контент-Завод 3.0</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 drop-shadow-sm">
                        Пульт управления <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">AI</span>
                    </h1>
                    <p className="text-slate-500 max-w-2xl text-lg leading-relaxed">
                        Спроектируйте ваш следующий виральный пост. Выберите формат, настройте дизайн и отправьте задачу на наш автоматизированный AI-завод.
                    </p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Main Content Area */}
                    <div className="xl:col-span-8 space-y-8">

                        {/* Block A: Source */}
                        <section className="bg-white/70 backdrop-blur-2xl rounded-3xl p-6 md:p-8 border border-white flex flex-col gap-6 shadow-xl shadow-slate-200/40 transition-all hover:bg-white/90">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                    <Type className="w-5 h-5 text-emerald-600" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 tracking-wide">1. Источник контента</h2>
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
                                                    ? "border border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)] bg-emerald-50/50"
                                                    : "border border-slate-200/60 bg-white/50 hover:bg-white hover:border-slate-300 hover:shadow-sm"
                                            )}
                                        >
                                            <div className={cn(
                                                "p-3.5 rounded-full transition-colors duration-300 border",
                                                active ? "bg-emerald-100 text-emerald-600 border-emerald-200" : "bg-slate-50 text-slate-400 border-slate-100 group-hover:text-slate-600 group-hover:bg-slate-100"
                                            )}>
                                                {type === 'description' && <Type className="w-6 h-6 stroke-[1.5]" />}
                                                {type === 'link' && <LinkIcon className="w-6 h-6 stroke-[1.5]" />}
                                                {type === 'photo' && <ImageIcon className="w-6 h-6 stroke-[1.5]" />}
                                            </div>
                                            <span className={cn(
                                                "text-sm font-semibold transition-colors duration-300 tracking-wide",
                                                active ? "text-emerald-700 font-bold" : "text-slate-500 group-hover:text-slate-700"
                                            )}>
                                                {type === 'description' ? 'По описанию' : type === 'link' ? 'По ссылке' : 'По фото'}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Block B: Format */}
                        <section className="bg-white/70 backdrop-blur-2xl rounded-3xl p-6 md:p-8 border border-white flex flex-col gap-6 shadow-xl shadow-slate-200/40 transition-all hover:bg-white/90">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                    <Layout className="w-5 h-5 text-indigo-500" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 tracking-wide">2. Выбор формата</h2>
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
                                                    ? "border border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)] bg-emerald-50/50"
                                                    : "border border-slate-200/60 bg-white/50 hover:bg-white hover:border-slate-300 hover:shadow-sm"
                                            )}
                                        >
                                            <div className={cn(
                                                "p-3 rounded-xl transition-all duration-300",
                                                active ? `${f.bg} scale-110 border border-emerald-200/50 shadow-sm` : "bg-slate-50 border border-slate-100 group-hover:scale-105"
                                            )}>
                                                <Icon className={cn("w-6 h-6 stroke-[1.5]", active ? f.color : "text-slate-400")} />
                                            </div>
                                            <span className={cn(
                                                "text-[11px] font-bold uppercase tracking-wider leading-tight",
                                                active ? "text-emerald-700" : "text-slate-500 group-hover:text-slate-700"
                                            )}>
                                                {f.label}
                                            </span>
                                            {active && (
                                                <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-md border-2 border-white">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Block C: Content */}
                        <section className="bg-white/70 backdrop-blur-2xl rounded-3xl p-6 md:p-8 border border-white flex flex-col gap-6 shadow-xl shadow-slate-200/40 transition-all hover:bg-white/90">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-100 pb-5">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                        <Wand2 className="w-5 h-5 text-sky-500" />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-800 tracking-wide">3. Сценарий и Текст</h2>
                                </div>

                                <button
                                    onClick={() => setMagicGenerationNeeded(!magicGenerationNeeded)}
                                    className={cn(
                                        "relative overflow-hidden flex items-center gap-2.5 px-6 py-2.5 rounded-full transition-all duration-300 font-bold text-xs uppercase tracking-widest outline-none",
                                        magicGenerationNeeded
                                            ? "border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 shadow-md shadow-indigo-100"
                                            : "border border-slate-200 bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-50 hover:shadow-sm"
                                    )}
                                >
                                    {magicGenerationNeeded && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/30 to-purple-100/30 opacity-50 animate-pulse pointer-events-none" />
                                    )}
                                    <Sparkles className={cn("w-4 h-4 z-10", magicGenerationNeeded ? "text-indigo-600 animate-pulse" : "text-slate-400 group-hover:text-slate-600")} />
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
                                        "min-h-[240px] p-6 text-base leading-relaxed resize-none rounded-2xl transition-all duration-300 outline-none shadow-inner",
                                        magicGenerationNeeded
                                            ? "bg-indigo-50/30 border-indigo-200/60 focus-visible:ring-indigo-100 focus-visible:border-indigo-400 text-slate-800 placeholder:text-indigo-300"
                                            : "bg-slate-50/50 border-slate-200/80 focus-visible:ring-emerald-50 focus-visible:border-emerald-500 text-slate-800 placeholder:text-slate-400"
                                    )}
                                />
                            </div>
                        </section>
                    </div>

                    {/* Sidebar Settings Area */}
                    <div className="xl:col-span-4 space-y-6">
                        <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50 border border-white flex flex-col gap-8 sticky top-6">
                            <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm">
                                    <Settings2 className="w-5 h-5 text-emerald-600" />
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
                                    <SelectTrigger className="bg-white shadow-sm border-slate-200 h-14 rounded-xl text-slate-800 font-semibold focus:ring-emerald-100 focus:border-emerald-400 hover:border-slate-300 transition-colors">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-100 shadow-xl bg-white text-slate-800">
                                        <SelectItem value="1:1" className="cursor-pointer font-medium py-3 rounded-lg mx-1 my-0.5 focus:bg-slate-50 focus:text-emerald-700">1:1 (Квадратный)</SelectItem>
                                        <SelectItem value="9:16" className="cursor-pointer font-medium py-3 rounded-lg mx-1 my-0.5 focus:bg-slate-50 focus:text-emerald-700">9:16 (Stories/Reels)</SelectItem>
                                        <SelectItem value="4:5" className="cursor-pointer font-medium py-3 rounded-lg mx-1 my-0.5 focus:bg-slate-50 focus:text-emerald-700">4:5 (Портретный)</SelectItem>
                                        <SelectItem value="16:9" className="cursor-pointer font-medium py-3 rounded-lg mx-1 my-0.5 focus:bg-slate-50 focus:text-emerald-700">16:9 (Горизонтальный)</SelectItem>
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
                                        { id: 'template_2', label: 'Премиум Голд', color: 'bg-gradient-to-br from-amber-100 to-amber-300 border-amber-200' },
                                        { id: 'template_3', label: '3D Футуризм', color: 'bg-gradient-to-br from-blue-300 to-indigo-500 border-indigo-200' },
                                    ].map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setDesignTemplateId(t.id)}
                                            className={cn(
                                                "flex items-center gap-4 p-4 rounded-xl transition-all duration-300 outline-none backdrop-blur-md",
                                                designTemplateId === t.id
                                                    ? "border border-emerald-400 bg-emerald-50 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                                    : "border border-slate-200 bg-white/50 hover:border-slate-300 hover:bg-white hover:shadow-sm"
                                            )}
                                        >
                                            <div className={cn("w-6 h-6 rounded-md border", t.color)} />
                                            <span className={cn(
                                                "text-sm font-bold tracking-wide",
                                                designTemplateId === t.id ? "text-emerald-700" : "text-slate-600"
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
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Palette className="w-4 h-4 text-slate-400" /> Доп. инструкции (Фон, цвета)
                                </label>
                                <Textarea
                                    placeholder="Опишите желаемый фон, цвета или специфичные элементы дизайна..."
                                    value={visualInstructions}
                                    onChange={(e) => setVisualInstructions(e.target.value)}
                                    className="bg-white border border-slate-200 text-slate-800 p-5 focus-visible:ring-emerald-100 focus-visible:border-emerald-400 transition-all resize-none rounded-xl text-sm min-h-[120px] placeholder:text-slate-400 shadow-inner"
                                />
                            </div>

                            {/* Main CTA */}
                            <div className="pt-8 space-y-4 border-t border-slate-100">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    className={cn(
                                        "relative overflow-hidden w-full h-16 rounded-2xl text-base font-extrabold uppercase tracking-widest transition-all duration-300 group shadow-lg text-white border-none",
                                        isLoading
                                            ? "bg-slate-200 cursor-not-allowed text-slate-400 shadow-none"
                                            : "bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/30 hover:shadow-[0_8px_25px_rgba(16,185,129,0.4)] hover:brightness-105 hover:-translate-y-0.5"
                                    )}
                                >
                                    {/* Subtle shine effect on hover */}
                                    {!isLoading && (
                                        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                                    )}

                                    {isLoading ? (
                                        <div className="flex items-center justify-center gap-3">
                                            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
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
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
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
