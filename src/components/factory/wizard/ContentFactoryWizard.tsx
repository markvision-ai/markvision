
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Link as LinkIcon,
    Image as ImageIcon,
    Video as VideoIcon,
    FileText,
    ArrowRight,
    Sparkles,
    ArrowLeft,
    MessageSquare,
    Instagram,
    Globe,
    Send,
    Clapperboard,
    Layers,
    Palette,
    Mic,
    Wand2,
    Terminal,
    Cpu,
    CheckCircle2,
    Code2,
    TrendingUp,
    Layout,
    ShieldCheck,
    Check,
    Dna,
    Rocket,
    TrendingUp as TrendingUpIcon,
    Layout as LayoutIcon,
    Dna as DnaIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

// Types
type SourceType = 'link' | 'photo' | 'video' | 'description' | null;
type ContentCategory = 'carousel' | 'avatar_video' | 'viral_video' | 'article_threads' | 'article_telegram' | 'article_seo' | null;
type DesignStyle = 'minimalism' | 'neon' | 'business' | null;
type AspectRatio = '1:1' | '4:5' | '9:16' | '16:9' | '3:4' | '21:9' | null;

interface WizardState {
    step: number; // 1: Source + Input, 2: Format, 3: Design + Type, 4: Production
    source: SourceType;

    // Step 1: Source-specific inputs
    linkUrl: string;
    uploadedFiles: File[];
    productName: string;
    mainDescription: string;
    additionalInstructions: string;

    // Step 2: Format selection
    aspectRatio: AspectRatio;

    // Step 3: Design and Type
    description: string;
    category: ContentCategory;
    designStyle: DesignStyle;

    // Carousel specifics
    carouselCount: string;
    carouselFormat: 'story' | 'feed';

    // Generation state
    isEnhancing: boolean;
    isGenerating: boolean;
}

const INITIAL_STATE: WizardState = {
    step: 1,
    source: null,

    // Step 1
    linkUrl: '',
    uploadedFiles: [],
    productName: '',
    mainDescription: '',
    additionalInstructions: '',

    // Step 2
    aspectRatio: null,

    // Step 3
    description: '',
    category: null,
    designStyle: 'minimalism',
    carouselCount: '7',
    carouselFormat: 'feed',

    // Generation
    isEnhancing: false,
    isGenerating: false,
};

export const ContentFactoryWizard = () => {
    const [state, setState] = useState<WizardState>(INITIAL_STATE);

    // Ref to always hold latest description — avoids stale closures in setTimeout
    const descriptionRef = useRef(state.description);
    useEffect(() => {
        descriptionRef.current = state.description;
    }, [state.description]);

    const updateState = (updates: Partial<WizardState>) => {
        setState(prev => ({ ...prev, ...updates }));
    };

    const nextStep = () => updateState({ step: state.step + 1 });
    const prevStep = () => updateState({ step: state.step - 1 });

    // Magic Prompt Logic — reads description from ref to guarantee freshness
    const enhancePrompt = () => {
        const currentDescription = descriptionRef.current?.trim();
        if (!currentDescription) return;

        setState(prev => ({ ...prev, isEnhancing: true }));

        setTimeout(() => {
            const input = currentDescription.toLowerCase();
            let enhanced: string;

            if (input.includes('зубы') || input.includes('гигиена') || input.includes('стоматолог') || input.includes('чистк')) {
                enhanced = "Создай экспертную карусель из 7 слайдов о важности профессиональной гигиены зубов раз в полгода, используя тональность заботливого врача и факты о предотвращении кариеса. Включи слайд с 'до/после' описанием и четкий призыв к действию.";
            } else if (input.includes('продаж') || input.includes('скидк') || input.includes('акци')) {
                enhanced = `Разработай продающий контент на тему "${currentDescription}". Структура: боль аудитории → решение → социальное доказательство → ограниченное предложение → CTA. Тон: уверенный, профессиональный с элементами срочности.`;
            } else if (input.includes('отзыв') || input.includes('кейс') || input.includes('результат')) {
                enhanced = `Создай убедительный кейс/отзыв на тему "${currentDescription}". Формат: ситуация до → процесс работы → результат после → цифры и факты. Используй сторителлинг и эмоциональные триггеры доверия.`;
            } else {
                enhanced = `Разработай глубокую контент-стратегию на тему "${currentDescription}". Цель: максимизировать охват и доверие аудитории. Тон: экспертный, вдохновляющий. Добавь виральные крючки и структурированные блоки преимуществ.`;
            }

            setState(prev => ({ ...prev, description: enhanced, isEnhancing: false }));
            toast.success("Промпт превращен в экспертное ТЗ!", {
                icon: <Sparkles className="w-4 h-4 text-cyan-400" />
            });
        }, 1200);
    };

    // Handle Generation Initiation
    const handleGenerate = async () => {
        if (!state.description || !state.category) return;

        updateState({ isGenerating: true });

        // Prepare Payload
        const payload = {
            task_description: state.description,
            content_type: state.category,
            style: state.designStyle,
            format: state.carouselFormat,
            count: state.carouselCount,
            source: state.source,
            timestamp: new Date().toISOString()
        };

        console.log('🚀 [LAUNCH]: ПЕРЕДАЧА В РАБОТУ...', payload);

        // Simulation of Webhook call
        setTimeout(() => {
            updateState({ isGenerating: false, step: 3 });
        }, 2000);
    };

    // STEP 1: SOURCE SELECTION + INPUT
    const renderStep1 = () => {
        // If no source selected, show source selection cards
        if (!state.source) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-6xl mx-auto px-4 animate-in fade-in zoom-in duration-500">
                    <div className="text-center mb-16 space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold uppercase tracking-widest mb-4">
                            <Sparkles className="w-3 h-3" />
                            Готов к работе
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2 drop-shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                            Источник <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Контента</span>
                        </h1>
                        <p className="text-lg text-white/50 font-light max-w-md mx-auto">
                            Выберите способ создания: по ссылке, по фото или по описанию
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                        <SourceCard
                            icon={<LinkIcon className="w-10 h-10" />}
                            title="По ссылке"
                            description="Вставьте URL"
                            color="cyan"
                            active={false}
                            onClick={() => updateState({ source: 'link' })}
                        />
                        <SourceCard
                            icon={<ImageIcon className="w-10 h-10" />}
                            title="По фото"
                            description="Из изображений"
                            color="fuchsia"
                            active={false}
                            onClick={() => updateState({ source: 'photo' })}
                        />
                        <SourceCard
                            icon={<VideoIcon className="w-10 h-10" />}
                            title="По видео"
                            description="Из видеофайла"
                            color="violet"
                            active={false}
                            onClick={() => updateState({ source: 'video' })}
                        />
                        <SourceCard
                            icon={<FileText className="w-10 h-10" />}
                            title="По описанию"
                            description="Текстовый запрос"
                            color="emerald"
                            active={false}
                            onClick={() => updateState({ source: 'description' })}
                        />
                    </div>
                </div>
            );
        }

        // Source selected - show corresponding input form
        return (
            <div className="max-w-4xl mx-auto h-full flex flex-col animate-in slide-in-from-right-10 duration-500 px-4">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => updateState({ source: null })}
                            className="text-white/30 hover:text-white hover:bg-white/5 mr-4 rounded-xl"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </Button>
                        <div>
                            <h2 className="text-3xl font-black text-white tracking-tight">
                                Источник <span className="text-cyan-400">контента</span>
                            </h2>
                            <p className="text-white/40 text-sm">
                                {state.source === 'link' && 'Вставьте ссылку на товар/статью/видео'}
                                {state.source === 'photo' && 'Загрузите изображения для анализа'}
                                {state.source === 'video' && 'Загрузите видео для обработки'}
                                {state.source === 'description' && 'Опишите что нужно создать'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pb-28">
                    {/* Link Source */}
                    {state.source === 'link' && (
                        <>
                            <div className="space-y-3">
                                <Label className="text-sm font-bold text-white/70 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <LinkIcon className="w-4 h-4 text-cyan-400" />
                                    Ссылка на товар/статью/видео
                                </Label>
                                <Input
                                    placeholder="https://..."
                                    value={state.linkUrl}
                                    onChange={(e) => updateState({ linkUrl: e.target.value })}
                                    className="bg-[#050505]/80 border-white/5 text-white p-4 focus:border-cyan-500/30 transition-all rounded-xl"
                                />
                                <div className="flex flex-wrap gap-2 mt-3">
                                    <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">Wildberries</Badge>
                                    <Badge variant="outline" className="bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20">Kaspi.kz</Badge>
                                    <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">Instagram</Badge>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-sm font-bold text-white/70 uppercase tracking-[0.2em]">
                                    Дополнительные инструкции (Текст или Голос)
                                </Label>
                                <Textarea
                                    placeholder="Добавьте детали: акцент на преимуществах, яркие цвета, строгий стиль..."
                                    value={state.additionalInstructions}
                                    onChange={(e) => updateState({ additionalInstructions: e.target.value })}
                                    className="min-h-[120px] bg-[#050505]/80 border-white/5 text-white p-4 focus:border-cyan-500/30 transition-all resize-none rounded-xl"
                                />
                                <Button variant="ghost" size="sm" className="text-fuchsia-400 hover:text-fuchsia-300 hover:bg-fuchsia-500/10">
                                    <Mic className="w-4 h-4 mr-2" />
                                    Записать голосом
                                </Button>
                            </div>
                        </>
                    )}

                    {/* Photo Source */}
                    {state.source === 'photo' && (
                        <>
                            <div className="space-y-3">
                                <Label className="text-sm font-bold text-white/70 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <ImageIcon className="w-4 h-4 text-fuchsia-400" />
                                    Загрузите изображения (до 14 файлов)
                                </Label>
                                <div className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center hover:border-fuchsia-500/30 transition-all cursor-pointer bg-[#050505]/40">
                                    <ImageIcon className="w-12 h-12 text-white/20 mx-auto mb-4" />
                                    <p className="text-white/40 mb-2">Перетащите файлы <span className="text-fuchsia-400">Ctrl+V</span> или нажмите</p>
                                    <p className="text-[10px] text-white/20 uppercase tracking-widest">PNG, JPG, WEBP до 10МБ каждый</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-sm font-bold text-white/70 uppercase tracking-[0.2em]">
                                    Название товара
                                </Label>
                                <Input
                                    placeholder="Например: Увлажнитель воздуха, Кроссовки Nike..."
                                    value={state.productName}
                                    onChange={(e) => updateState({ productName: e.target.value })}
                                    className="bg-[#050505]/80 border-white/5 text-white p-4 focus:border-fuchsia-500/30 transition-all rounded-xl"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-sm font-bold text-white/70 uppercase tracking-[0.2em]">
                                    Дополнительные инструкции
                                </Label>
                                <Textarea
                                    placeholder="Добавьте детали: акцент на преимуществах, яркие цвета, строгий стиль..."
                                    value={state.additionalInstructions}
                                    onChange={(e) => updateState({ additionalInstructions: e.target.value })}
                                    className="min-h-[120px] bg-[#050505]/80 border-white/5 text-white p-4 focus:border-fuchsia-500/30 transition-all resize-none rounded-xl"
                                />
                            </div>
                        </>
                    )}

                    {/* Video Source */}
                    {state.source === 'video' && (
                        <>
                            <div className="space-y-3">
                                <Label className="text-sm font-bold text-white/70 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <VideoIcon className="w-4 h-4 text-violet-400" />
                                    Загрузите видео
                                </Label>
                                <div className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center hover:border-violet-500/30 transition-all cursor-pointer bg-[#050505]/40">
                                    <VideoIcon className="w-12 h-12 text-white/20 mx-auto mb-4" />
                                    <p className="text-white/40 mb-2">Перетащите файл или нажмите</p>
                                    <p className="text-[10px] text-white/20 uppercase tracking-widest">MP4, MOV, WEBM до 100МБ</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-sm font-bold text-white/70 uppercase tracking-[0.2em]">
                                    Название товара
                                </Label>
                                <Input
                                    placeholder="Например: Увлажнитель воздуха, Кроссовки Nike..."
                                    value={state.productName}
                                    onChange={(e) => updateState({ productName: e.target.value })}
                                    className="bg-[#050505]/80 border-white/5 text-white p-4 focus:border-violet-500/30 transition-all rounded-xl"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-sm font-bold text-white/70 uppercase tracking-[0.2em]">
                                    Дополнительные инструкции
                                </Label>
                                <Textarea
                                    placeholder="Добавьте детали: акцент на преимуществах, яркие цвета, строгий стиль..."
                                    value={state.additionalInstructions}
                                    onChange={(e) => updateState({ additionalInstructions: e.target.value })}
                                    className="min-h-[120px] bg-[#050505]/80 border-white/5 text-white p-4 focus:border-violet-500/30 transition-all resize-none rounded-xl"
                                />
                            </div>
                        </>
                    )}

                    {/* Description Source */}
                    {state.source === 'description' && (
                        <>
                            <div className="space-y-3">
                                <Label className="text-sm font-bold text-white/70 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <FileText className="w-4 h-4 text-emerald-400" />
                                    Главное описание
                                </Label>
                                <Textarea
                                    placeholder="Основная идея дизайна или текст поста..."
                                    value={state.mainDescription}
                                    onChange={(e) => updateState({ mainDescription: e.target.value })}
                                    className="min-h-[200px] bg-[#050505]/80 border-white/5 text-white p-6 focus:border-emerald-500/30 transition-all resize-none rounded-xl leading-relaxed text-base"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-sm font-bold text-white/70 uppercase tracking-[0.2em]">
                                    Название товара
                                </Label>
                                <Input
                                    placeholder="Например: Увлажнитель воздуха, Кроссовки Nike..."
                                    value={state.productName}
                                    onChange={(e) => updateState({ productName: e.target.value })}
                                    className="bg-[#050505]/80 border-white/5 text-white p-4 focus:border-emerald-500/30 transition-all rounded-xl"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-sm font-bold text-white/70 uppercase tracking-[0.2em]">
                                    Дополнительные инструкции (Текст или Голос)
                                </Label>
                                <Textarea
                                    placeholder="Добавьте детали: акцент на преимуществах, яркие цвета, строгий стиль..."
                                    value={state.additionalInstructions}
                                    onChange={(e) => updateState({ additionalInstructions: e.target.value })}
                                    className="min-h-[120px] bg-[#050505]/80 border-white/5 text-white p-4 focus:border-emerald-500/30 transition-all resize-none rounded-xl"
                                />
                                <Button variant="ghost" size="sm" className="text-fuchsia-400 hover:text-fuchsia-300 hover:bg-fuchsia-500/10">
                                    <Mic className="w-4 h-4 mr-2" />
                                    Записать голосом
                                </Button>
                            </div>
                        </>
                    )}
                </div>

                {/* Continue Button */}
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A] to-transparent pointer-events-none">
                    <div className="max-w-4xl mx-auto pointer-events-auto">
                        <Button
                            onClick={nextStep}
                            disabled={
                                (state.source === 'link' && !state.linkUrl) ||
                                (state.source === 'photo' && !state.productName) ||
                                (state.source === 'video' && !state.productName) ||
                                (state.source === 'description' && !state.mainDescription)
                            }
                            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-lg py-7 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.3)] hover:shadow-[0_0_60px_rgba(6,182,212,0.5)] transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Продолжить
                            <ArrowRight className="w-6 h-6 ml-3" />
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    // STEP 2: FORMAT SELECTION
    const renderStep2 = () => (
        <div className="max-w-6xl mx-auto h-full flex flex-col animate-in slide-in-from-right-10 duration-500 px-4">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                    <Button variant="ghost" size="icon" onClick={prevStep} className="text-white/30 hover:text-white hover:bg-white/5 mr-4 rounded-xl">
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tight">Настройки <span className="text-cyan-400">формата</span></h2>
                        <p className="text-white/40 text-sm">Настройки можно пропустить, если подходят базовые</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Шаг 2 из 3</div>
                </div>
            </div>

            <div className="space-y-8 flex-1 overflow-y-auto custom-scrollbar pb-28">
                {/* Aspect Ratio Selection */}
                <div className="space-y-6">
                    <Label className="text-sm font-bold text-white/70 uppercase tracking-[0.2em] flex items-center gap-3">
                        <Layout className="w-4 h-4 text-purple-400" />
                        Соотношение сторон
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {[
                            { ratio: '1:1' as AspectRatio, label: 'Квадрат', icon: '□' },
                            { ratio: '4:5' as AspectRatio, label: 'Portrait', icon: '▯' },
                            { ratio: '9:16' as AspectRatio, label: 'Stories / Reels', icon: '▯' },
                            { ratio: '16:9' as AspectRatio, label: 'YouTube', icon: '▭' },
                            { ratio: '3:4' as AspectRatio, label: 'Базовый', icon: '▯' },
                            { ratio: '21:9' as AspectRatio, label: 'Ultrawide', icon: '▬' },
                        ].map(({ ratio, label, icon }) => (
                            <div
                                key={ratio}
                                onClick={() => updateState({ aspectRatio: ratio })}
                                className={cn(
                                    "relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 group hover:scale-105",
                                    state.aspectRatio === ratio
                                        ? "border-fuchsia-500 bg-fuchsia-500/10 shadow-[0_0_30px_rgba(217,70,239,0.3)]"
                                        : "border-white/5 bg-white/[0.02] hover:border-white/20"
                                )}
                            >
                                <div className="text-center space-y-3">
                                    <div className={cn(
                                        "text-5xl font-black transition-colors",
                                        state.aspectRatio === ratio ? "text-fuchsia-400" : "text-white/20 group-hover:text-white/40"
                                    )}>
                                        {icon}
                                    </div>
                                    <div className="space-y-1">
                                        <div className={cn(
                                            "text-xl font-black transition-colors",
                                            state.aspectRatio === ratio ? "text-white" : "text-white/60"
                                        )}>
                                            {ratio}
                                        </div>
                                        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                                            {label}
                                        </div>
                                    </div>
                                </div>
                                {state.aspectRatio === ratio && (
                                    <div className="absolute top-2 right-2 p-1.5 bg-fuchsia-500 rounded-full shadow-lg">
                                        <Check className="w-3 h-3 text-black" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Continue Button */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A] to-transparent pointer-events-none">
                <div className="max-w-6xl mx-auto pointer-events-auto">
                    <Button
                        onClick={nextStep}
                        disabled={!state.aspectRatio}
                        className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-black text-lg py-7 rounded-2xl shadow-[0_0_40px_rgba(217,70,239,0.3)] hover:shadow-[0_0_60px_rgba(217,70,239,0.5)] transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        Продолжить
                        <ArrowRight className="w-6 h-6 ml-3" />
                    </Button>
                </div>
            </div>
        </div>
    );

    // STEP 3: DESIGN & TYPE CONFIGURATION
    const renderStep3 = () => (
        <div className="max-w-6xl mx-auto h-full flex flex-col animate-in slide-in-from-right-10 duration-500">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                    <Button variant="ghost" size="icon" onClick={prevStep} className="text-white/30 hover:text-white hover:bg-white/5 mr-4 rounded-xl">
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tight">Настройки <span className="text-cyan-400">контента</span></h2>
                        <p className="text-white/40 text-sm">Заполните пару полей и нажмите «Сгенерировать»</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden">
                                <span className="text-[10px] text-white/20">{i}</span>
                            </div>
                        ))}
                    </div>
                    <div className="h-px w-12 bg-white/10" />
                    <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Шаг 2 из 3</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 pb-28 overflow-y-auto custom-scrollbar pr-2">

                {/* Left Column: Inputs */}
                <div className="lg:col-span-7 space-y-10">
                    {/* Description Section */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <Label className="text-sm font-bold text-white/70 uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_cyan]" />
                                Опишите задачу
                            </Label>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={enhancePrompt}
                                disabled={state.isEnhancing || !state.description}
                                className={cn(
                                    "text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all rounded-lg font-bold text-[10px] uppercase tracking-widest",
                                    state.isEnhancing && "animate-pulse"
                                )}
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                {state.isEnhancing ? "Улучшаю..." : "Улучшить текст"}
                            </Button>
                        </div>

                        <div className="relative group overflow-hidden rounded-2xl">
                            <div className={cn(
                                "absolute -inset-0.5 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-10 group-focus-within:opacity-40 transition duration-500 blur-md",
                                state.isEnhancing && "opacity-100 animate-pulse"
                            )} />
                            <Textarea
                                placeholder="Например: Сделай серию сторис о профессиональной чистке зубов для клиники в Москве..."
                                className="relative min-h-[160px] bg-[#050505]/80 border-white/5 text-white p-6 focus:border-cyan-500/30 transition-all resize-none rounded-2xl leading-relaxed text-base backdrop-blur-xl"
                                value={state.description}
                                onChange={(e) => updateState({ description: e.target.value })}
                            />

                            <div className="absolute bottom-4 right-4 text-[10px] text-white/15 select-none">
                                {state.description?.length || 0} символов
                            </div>
                        </div>
                    </div>

                    {/* Type Selection */}
                    <div className="space-y-6">
                        <Label className="text-sm font-bold text-white/70 uppercase tracking-[0.2em] flex items-center gap-3 px-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_purple]" />
                            Тип контента
                        </Label>

                        <div className="grid grid-cols-2 gap-4">
                            <TypeSelectionCard
                                icon={<Layers className="w-5 h-5" />}
                                title="Карусель"
                                description="Масштабируемый пост"
                                active={state.category === 'carousel'}
                                onClick={() => updateState({ category: 'carousel' })}
                                color="cyan"
                            />
                            <TypeSelectionCard
                                icon={<Clapperboard className="w-5 h-5" />}
                                title="Аватар Видео"
                                description="AI-спикер и сценарий"
                                active={state.category === 'avatar_video'}
                                onClick={() => updateState({ category: 'avatar_video' })}
                                color="purple"
                            />
                            <TypeSelectionCard
                                icon={<TrendingUp className="w-5 h-5" />}
                                title="Виральный Reels"
                                description="Монтаж и триггеры"
                                active={state.category === 'viral_video'}
                                onClick={() => updateState({ category: 'viral_video' })}
                                color="pink"
                            />
                            <TypeSelectionCard
                                icon={<MessageSquare className="w-5 h-5" />}
                                title="Статья / Пост"
                                description="Telegram, SEO, Threads"
                                active={state.category?.startsWith('article')}
                                onClick={() => updateState({ category: 'article_telegram' })}
                                color="blue"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: Parameters */}
                <div className="lg:col-span-5 flex flex-col">
                    <div className="bg-white/[0.03] rounded-3xl p-8 border border-white/5 backdrop-blur-2xl relative overflow-hidden flex-1 flex flex-col shadow-2xl">
                        <h3 className="text-sm font-bold text-white uppercase tracking-[0.3em] border-b border-white/5 pb-6 mb-8 flex items-center gap-3">
                            <Cpu className="w-4 h-4 text-cyan-400" />
                            Настройки
                        </h3>

                        <div className="space-y-10 flex-1">
                            {/* Style Selection - Working Interactivity */}
                            <div className="space-y-4">
                                <Label className="text-xs font-bold text-white/40 uppercase tracking-widest">Стиль</Label>
                                <div className="grid grid-cols-3 gap-3">
                                    <VisualTemplateOption
                                        label="Простой"
                                        color="bg-zinc-900"
                                        active={state.designStyle === 'minimalism'}
                                        onClick={() => updateState({ designStyle: 'minimalism' })}
                                    />
                                    <VisualTemplateOption
                                        label="Яркий"
                                        color="bg-purple-900/60"
                                        active={state.designStyle === 'neon'}
                                        onClick={() => updateState({ designStyle: 'neon' })}
                                    />
                                    <VisualTemplateOption
                                        label="Деловой"
                                        color="bg-blue-900/60"
                                        active={state.designStyle === 'business'}
                                        onClick={() => updateState({ designStyle: 'business' })}
                                    />
                                </div>
                            </div>

                            {/* Carousel Specifics */}
                            {state.category === 'carousel' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="space-y-8 px-1"
                                >
                                    <div className="space-y-4">
                                        <Label className="text-xs font-bold text-white/40 uppercase tracking-widest">Объем контента</Label>
                                        <Select value={state.carouselCount} onValueChange={(v) => updateState({ carouselCount: v })}>
                                            <SelectTrigger className="bg-white/5 border-white/10 h-10 rounded-xl focus:ring-cyan-500/50">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0a0a0a] border-white/10 text-white">
                                                <SelectItem value="3">⚡️ 3 карточки (Экспресс)</SelectItem>
                                                <SelectItem value="5">🔥 5 карточек (Стандарт)</SelectItem>
                                                <SelectItem value="7">💎 7 карточек (Прогрев)</SelectItem>
                                                <SelectItem value="10">📚 10 карточек (Полный гайд)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-xs font-bold text-white/40 uppercase tracking-widest">Формат вывода</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                className={cn(
                                                    "h-12 rounded-xl border text-[11px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3",
                                                    state.carouselFormat === 'feed'
                                                        ? "bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                                                        : "bg-white/5 border-white/5 text-white/30 hover:bg-white/10"
                                                )}
                                                onClick={() => updateState({ carouselFormat: 'feed' })}
                                            >
                                                <Layout className="w-4 h-4" />
                                                Квадрат 1:1
                                            </button>
                                            <button
                                                className={cn(
                                                    "h-12 rounded-xl border text-[11px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3",
                                                    state.carouselFormat === 'story'
                                                        ? "bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                                                        : "bg-white/5 border-white/5 text-white/30 hover:bg-white/10"
                                                )}
                                                onClick={() => updateState({ carouselFormat: 'story' })}
                                            >
                                                <div className="w-3 h-4 border-2 border-current rounded-sm" />
                                                Stories 9:16
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {(!state.category || state.category !== 'carousel') && (
                                <div className="flex-1 flex flex-col items-center justify-center text-white/10 space-y-4">
                                    <Palette className="w-16 h-16 opacity-50" />
                                    <p className="text-[10px] text-center font-bold uppercase tracking-widest leading-relaxed">
                                        Сначала выберите<br />тип контента слева
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky actions: всегда видимые кнопки */}
            <div className="sticky bottom-0 pt-4 pb-2 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
                    <Button
                        variant="ghost"
                        onClick={prevStep}
                        className="h-12 rounded-xl text-white/50 hover:text-white hover:bg-white/5"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Назад
                    </Button>
                    <Button
                        onClick={nextStep}
                        disabled={!state.description || !state.category}
                        className={cn(
                            "h-12 px-6 rounded-xl font-bold",
                            state.description && state.category
                                ? "bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-[0_0_30px_rgba(6,182,212,0.25)] hover:shadow-[0_0_45px_rgba(6,182,212,0.35)]"
                                : "bg-white/5 border border-white/10 text-white/20"
                        )}
                    >
                        {state.isGenerating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                                Готовлю...
                            </>
                        ) : (
                            <>
                                <Rocket className="w-4 h-4 mr-2" />
                                Сгенерировать
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full min-h-[calc(100vh-8rem)] bg-[#050505] text-white p-6 relative overflow-hidden font-sans">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-purple-500/5 rounded-full blur-[150px] pointer-events-none" />

            {state.step === 1 && renderStep1()}
            {state.step === 2 && renderStep2()}
            {state.step === 3 && renderStep3()}
            {state.step === 4 && <ProductionFloor onCancel={() => updateState({ step: 1, source: null })} />}
        </div>
    );
};

// -- SUB COMPONENTS --

// Enhanced Production Floor
const ProductionFloor = ({ onCancel }: { onCancel: () => void }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);

    const steps = [
        { label: "Запуск", icon: <Cpu />, detail: "Начинаю работу..." },
        { label: "Разбор", icon: <DnaIcon />, detail: "Понимаю задачу..." },
        { label: "План", icon: <Terminal />, detail: "Собираю структуру..." },
        { label: "Оформление", icon: <ImageIcon />, detail: "Подбираю подачу..." },
        { label: "Готово", icon: <CheckCircle2 />, detail: "Финальные штрихи..." }
    ];

    useEffect(() => {
        let timer: NodeJS.Timeout;
        const runNextStep = (index: number) => {
            if (index < steps.length) {
                setCurrentStep(index);
                setLogs(prev => [...prev, `Шаг: ${steps[index].label}`]);
                timer = setTimeout(() => runNextStep(index + 1), 2000 + Math.random() * 1500);
            } else {
                setLogs(prev => [...prev, "Готово: контент создан."]);
                toast.success("Контент успешно сгенерирован!", {
                    description: "Вы можете найти его в ленте публикаций",
                    icon: <Rocket className="w-5 h-5 text-emerald-400" />
                });
            }
        };

        runNextStep(0);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="max-w-5xl mx-auto min-h-[70vh] flex flex-col items-center justify-center animate-in fade-in duration-700">
            <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-[0.3em] mb-6">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    СОЗДАНИЕ КОНТЕНТА
                </div>
                <h2 className="text-5xl font-black text-white tracking-tighter mb-4">ВАШ КОНТЕНТ <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">ГОТОВИТСЯ</span></h2>
                <p className="text-white/30 text-lg font-light">Алгоритмы MarkVision создают пост по вашим параметрам</p>
            </div>

            <div className="grid grid-cols-5 gap-4 w-full mb-20 relative">
                {/* Connecting Path Background */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-white/5 -translate-y-1/2" />

                {steps.map((step, i) => (
                    <div key={i} className="relative z-10 flex flex-col items-center text-center group">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.2 }}
                            className={cn(
                                "w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-700",
                                i < currentStep ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]" :
                                    i === currentStep ? "bg-cyan-500/30 border-2 border-cyan-400 text-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.4)] scale-110" :
                                        "bg-white/5 border border-white/5 text-white/20"
                            )}
                        >
                            {React.cloneElement(step.icon as React.ReactElement, { className: "w-8 h-8" })}

                            {/* Scanning Animation for current step */}
                            {i === currentStep && (
                                <div className="absolute inset-0 rounded-2xl border-2 border-cyan-400 animate-ping opacity-20" />
                            )}
                        </motion.div>
                        <div className="mt-4 space-y-1">
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest",
                                i <= currentStep ? "text-white" : "text-white/20"
                            )}>{step.label}</span>
                            <p className={cn(
                                "text-[9px] leading-tight px-4 transition-opacity duration-500",
                                i === currentStep ? "opacity-100 text-cyan-500/70" : "opacity-0"
                            )}>{step.detail}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Production Console */}
            <div className="w-full max-w-2xl bg-black/80 border border-white/5 rounded-3xl p-8 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Terminal className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-bold text-white/40 uppercase tracking-[0.2em]">Логи процесса</span>
                    </div>
                    <div className="px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 text-[10px] font-mono">
                        {Math.round((currentStep + 1 / steps.length) * 100)}% ГОТОВО
                    </div>
                </div>

                <div className="space-y-3 h-40 overflow-y-auto font-mono text-xs custom-scrollbar">
                    {logs.map((log, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 border-l-2 border-cyan-500/20 pl-4 py-1"
                        >
                            <span className="text-cyan-500/40">{`0${i + 1}`}</span>
                            <span className={cn(
                                i === logs.length - 1 ? "text-white font-bold" : "text-white/40"
                            )}>{log}</span>
                        </motion.div>
                    ))}
                    {currentStep < steps.length && (
                        <div className="flex items-center gap-3 pl-4">
                            <span className="text-cyan-400 animate-pulse">_</span>
                        </div>
                    )}
                </div>
            </div>

            <Button
                variant="ghost"
                onClick={onCancel}
                className="mt-12 text-white/20 hover:text-white/60 hover:bg-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest"
            >
                [ ABORT OPERATION ]
            </Button>
        </div>
    );
};

const VisualTemplateOption = ({ label, color, active, onClick }: { label: string, color: string, active: boolean, onClick: () => void }) => (
    <div
        onClick={onClick}
        className={cn(
            "aspect-[4/5] rounded-xl border-2 cursor-pointer relative overflow-hidden group transition-all duration-500",
            active
                ? "border-cyan-500 shadow-[0_0_25px_rgba(6,182,212,0.3)] scale-105"
                : "border-white/5 opacity-40 hover:opacity-100 hover:border-white/20"
        )}
    >
        <div className={cn("absolute inset-0 transition-opacity", color)} />
        {/* Mock UI stripes */}
        <div className="absolute inset-x-3 top-3 space-y-1">
            <div className="h-1 w-full bg-white/20 rounded-full" />
            <div className="h-1 w-2/3 bg-white/10 rounded-full" />
        </div>
        <div className="absolute bottom-3 inset-x-3 h-4 bg-white/5 rounded-lg flex items-center justify-center">
            <div className="w-4 h-0.5 bg-white/20 rounded-full" />
        </div>

        {active && (
            <div className="absolute top-1 right-1 p-1 bg-cyan-500 rounded-full shadow-lg z-20">
                <Check className="w-2 h-2 text-black" />
            </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
        <div className="absolute bottom-0 inset-x-0 p-2 text-center">
            <span className="text-[10px] font-black uppercase text-white tracking-widest">{label}</span>
        </div>
    </div>
);

const SourceCard = ({ icon, title, description, color, active, onClick }: any) => {
    const colorSchemes: Record<string, { glow: string, gradient: string, border: string, text: string }> = {
        cyan: {
            glow: "shadow-[0_0_60px_rgba(6,182,212,0.5),0_0_100px_rgba(6,182,212,0.25)]",
            gradient: "from-cyan-500/40 via-blue-500/40 to-cyan-500/40",
            border: "border-cyan-500/60",
            text: "text-cyan-400"
        },
        emerald: {
            glow: "shadow-[0_0_60px_rgba(16,185,129,0.5),0_0_100px_rgba(16,185,129,0.25)]",
            gradient: "from-emerald-500/40 via-green-500/40 to-emerald-500/40",
            border: "border-emerald-500/60",
            text: "text-emerald-400"
        },
        violet: {
            glow: "shadow-[0_0_60px_rgba(139,92,246,0.5),0_0_100px_rgba(139,92,246,0.25)]",
            gradient: "from-violet-500/40 via-purple-500/40 to-violet-500/40",
            border: "border-violet-500/60",
            text: "text-violet-400"
        },
        fuchsia: {
            glow: "shadow-[0_0_60px_rgba(217,70,239,0.5),0_0_100px_rgba(217,70,239,0.25)]",
            gradient: "from-fuchsia-500/40 via-pink-500/40 to-fuchsia-500/40",
            border: "border-fuchsia-500/60",
            text: "text-fuchsia-400"
        },
    };

    const scheme = colorSchemes[color] || colorSchemes.cyan;

    return (
        <div
            role="button"
            data-active={active}
            onClick={onClick}
            className={cn(
                "group relative flex flex-col items-center justify-center p-8 rounded-[2.5rem] border-2 bg-[#050505]/70 backdrop-blur-3xl transition-all duration-700 cursor-pointer overflow-hidden",
                "hover:scale-[1.10] hover:-translate-y-3",
                active ? "scale-[1.10] -translate-y-3" : "",
                "h-[380px]",
                scheme.border
            )}
            style={{
                transformStyle: 'preserve-3d',
                perspective: '1000px'
            }}
        >
            {/* Animated Gradient Border Glow */}
            <div className={cn(
                "absolute -inset-1 rounded-[2.6rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-r blur-lg animate-spin-slow",
                scheme.gradient,
                active && "opacity-100"
            )} />

            {/* Orbital Ring Effect */}
            <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700",
                active && "opacity-100"
            )}>
                <div className={cn(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full border-2 border-dashed animate-spin-slow",
                    scheme.border
                )} />
                <div className={cn(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-dashed opacity-50",
                    scheme.border
                )}
                    style={{ animationDuration: '15s', animationDirection: 'reverse' }}
                />
            </div>

            {/* Reactor Core Icon Container with Mega Glow */}
            <div className={cn(
                "mb-8 p-8 rounded-full bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#0A0A0A] border-2 transition-all duration-700 relative z-10",
                "group-hover:scale-[1.35] group-hover:rotate-12",
                active ? "scale-[1.35] rotate-12" : "",
                scheme.border,
                scheme.glow
            )}>
                {/* Pulsing Inner Mega Glow */}
                <div className={cn(
                    "absolute inset-0 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse bg-gradient-to-br",
                    scheme.gradient,
                    active && "opacity-100"
                )} />

                {/* Icon with Color */}
                <div className={cn(
                    "relative z-10 transition-all duration-500",
                    active ? scheme.text : `text-white/50 group-hover:${scheme.text}`
                )}>
                    {icon}
                </div>
            </div>

            {/* Title with Mega Glow */}
            <h3 className={cn(
                "text-3xl font-black mb-4 tracking-tight z-10 transition-all duration-500",
                "group-hover:text-white group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.7)]",
                active ? "text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.7)]" : "text-white/80"
            )}>
                {title}
            </h3>

            {/* Description */}
            <p className={cn(
                "text-[12px] font-bold text-center uppercase tracking-[0.25em] z-10 transition-all duration-500",
                "group-hover:text-white/90",
                active ? "text-white/90" : "text-white/30"
            )}>
                {description}
            </p>

            {/* Animated Background Mega Gradient */}
            <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none bg-gradient-to-b rounded-[2.5rem]",
                scheme.gradient,
                active && "opacity-100"
            )} />

            {/* Shimmer Effect */}
            <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none overflow-hidden rounded-[2.5rem]",
                active && "opacity-100"
            )}>
                <div className="absolute -inset-full top-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-shimmer" />
            </div>

            {/* Selection Indicator with Mega Pulse */}
            <div className={cn(
                "absolute top-6 right-6 p-3 rounded-full bg-white text-black transform scale-0 transition-all duration-500 shadow-2xl z-20",
                "animate-pulse",
                active && "scale-110",
                active && scheme.glow
            )}>
                <Check className="w-6 h-6" />
            </div>

            {/* Corner Accents with Glow */}
            <div className={cn(
                "absolute top-4 left-4 w-10 h-10 border-l-2 border-t-2 rounded-tl-2xl opacity-0 group-hover:opacity-80 transition-opacity duration-500",
                scheme.border,
                active && "opacity-80"
            )} />
            <div className={cn(
                "absolute bottom-4 right-4 w-10 h-10 border-r-2 border-b-2 rounded-br-2xl opacity-0 group-hover:opacity-80 transition-opacity duration-500",
                scheme.border,
                active && "opacity-80"
            )} />
            <div className={cn(
                "absolute top-4 right-4 w-10 h-10 border-r-2 border-t-2 rounded-tr-2xl opacity-0 group-hover:opacity-80 transition-opacity duration-500",
                scheme.border,
                active && "opacity-80"
            )} />
            <div className={cn(
                "absolute bottom-4 left-4 w-10 h-10 border-l-2 border-b-2 rounded-bl-2xl opacity-0 group-hover:opacity-80 transition-opacity duration-500",
                scheme.border,
                active && "opacity-80"
            )} />
        </div>
    );
};

const TypeSelectionCard = ({ icon, title, description, active, onClick, color }: any) => {
    const accents: Record<string, string> = {
        cyan: "text-cyan-400 group-hover:bg-cyan-500/20",
        purple: "text-purple-400 group-hover:bg-purple-500/20",
        violet: "text-violet-400 group-hover:bg-violet-500/20",
        fuchsia: "text-fuchsia-400 group-hover:bg-fuchsia-500/20",
        pink: "text-pink-400 group-hover:bg-pink-500/20",
        blue: "text-blue-400 group-hover:bg-blue-500/20",
    };

    return (
        <div
            onClick={onClick}
            className={cn(
                "flex items-center gap-4 p-5 rounded-[1.25rem] border transition-all duration-500 relative overflow-hidden group",
                active
                    ? "bg-white/[0.08] border-cyan-500/40 shadow-[0_0_20px_rgba(34,211,238,0.1)]"
                    : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10"
            )}
        >
            <div className={cn(
                "p-3 rounded-xl transition-all duration-500",
                active ? "bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]" : "bg-white/5 text-white/30 group-hover:text-white/80",
                !active && accents[color]
            )}>
                {icon}
            </div>
            <div className="relative z-10">
                <h4 className={cn("text-xs font-black uppercase tracking-widest", active ? "text-white" : "text-white/50 group-hover:text-white/80")}>{title}</h4>
                <p className="text-[10px] text-white/20 font-bold uppercase tracking-tight">{description}</p>
            </div>

            {active && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-500 animate-in zoom-in duration-300">
                    <CheckCircle2 className="w-5 h-5" />
                </div>
            )}
        </div>
    );
}
