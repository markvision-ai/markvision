
import { useState, useEffect } from 'react';
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
    Code2
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

interface WizardState {
    step: number;
    source: SourceType;
    description: string;
    category: ContentCategory;
    // Carousel specifics
    carouselCount: string;
    carouselFormat: 'story' | 'feed';
    carouselDesign: 'template' | 'custom';
    // Video specifics
    videoScript: string;
    // General
    linkUrl: string;
    isEnhancing: boolean;
}

const INITIAL_STATE: WizardState = {
    step: 1,
    source: null,
    description: '',
    category: null,
    carouselCount: '7',
    carouselFormat: 'feed',
    carouselDesign: 'template',
    videoScript: '',
    linkUrl: '',
    isEnhancing: false,
};

export const ContentFactoryWizard = () => {
    const [state, setState] = useState<WizardState>(INITIAL_STATE);

    const updateState = (updates: Partial<WizardState>) => {
        setState(prev => ({ ...prev, ...updates }));
    };

    const nextStep = () => updateState({ step: state.step + 1 });
    const prevStep = () => updateState({ step: state.step - 1 });

    // Magic Prompt Logic
    const enhancePrompt = () => {
        if (!state.description) return;
        updateState({ isEnhancing: true });

        // Simulate AI delay
        setTimeout(() => {
            const enhanced = `${state.description}\n\n[AI Optimization]:\n- Focus: Educational & Engaging\n- Tone: Professional yet accessible\n- Call to Action: Book a consultation\n- Key Elements: Visual proof, patient testimonials, clear benefits list.`;
            updateState({ description: enhanced, isEnhancing: false });
            toast.success("Промпт улучшен нейросетью!");
        }, 1500);
    };

    // STEP 1: SOURCE SELECTION
    const renderStep1 = () => (
        <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-6xl mx-auto px-4 animate-in fade-in zoom-in duration-500">
            <div className="text-center mb-16 space-y-4">
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                    Источник контента
                </h1>
                <p className="text-xl text-white/60 font-light">
                    Выберите способ создания
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                <SourceCard
                    icon={<LinkIcon className="w-10 h-10" />}
                    title="По ссылке"
                    description="Вставьте URL"
                    color="pink"
                    active={state.source === 'link'}
                    onClick={() => updateState({ source: 'link', step: 2 })}
                />
                <SourceCard
                    icon={<ImageIcon className="w-10 h-10" />}
                    title="По фото"
                    description="Из изображений"
                    color="fuchsia"
                    active={state.source === 'photo'}
                    onClick={() => updateState({ source: 'photo', step: 2 })}
                />
                <SourceCard
                    icon={<VideoIcon className="w-10 h-10" />}
                    title="По видео"
                    description="Из видеофайла"
                    color="violet"
                    active={state.source === 'video'}
                    onClick={() => updateState({ source: 'video', step: 2 })}
                />
                <SourceCard
                    icon={<FileText className="w-10 h-10" />}
                    title="По описанию"
                    description="Текстовый запрос"
                    color="purple"
                    active={state.source === 'description'}
                    onClick={() => updateState({ source: 'description', step: 2 })}
                />
            </div>

            <div className="w-full max-w-3xl mt-12 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                <Label className="text-white/70 mb-2 block">Быстрый старт</Label>
                <div className="flex gap-3">
                    <Input
                        placeholder="Вставьте ссылку на товар, статью или видео..."
                        className="bg-black/40 border-white/10 text-white h-12"
                    />
                    <Button size="lg" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                        <Sparkles className="w-5 h-5 mr-2" />
                        Магия
                    </Button>
                </div>
            </div>
        </div>
    );

    // STEP 2: CONFIGURATION
    const renderStep2 = () => (
        <div className="max-w-6xl mx-auto h-full flex flex-col animate-in slide-in-from-right-10 duration-500">
            <div className="flex items-center mb-8">
                <Button variant="ghost" size="icon" onClick={prevStep} className="text-white/50 hover:text-white mr-4">
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <div>
                    <h2 className="text-3xl font-bold text-white">Настройка генерации</h2>
                    <p className="text-white/50">Уточните детали для нейросети</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 pb-20">

                {/* Left Column: Inputs */}
                <div className="lg:col-span-7 space-y-8">
                    {/* Description Section */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Label className="text-lg font-semibold text-white flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-purple-400" />
                                Опишите задачу
                            </Label>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={enhancePrompt}
                                disabled={state.isEnhancing}
                                className={cn(
                                    "text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 transition-all",
                                    state.isEnhancing && "animate-pulse"
                                )}
                            >
                                <Wand2 className="w-4 h-4 mr-2" />
                                {state.isEnhancing ? "Улучшаем..." : "Magic Prompt"}
                            </Button>
                        </div>

                        <div className="relative group">
                            <div className={cn(
                                "absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 blur",
                                state.isEnhancing && "opacity-100 duration-200"
                            )} />
                            <Textarea
                                placeholder="Пример: Сделай серию сторис для стоматологии..."
                                className="relative min-h-[150px] bg-black/80 border-white/10 text-lg p-4 focus:border-purple-500/50 transition-colors resize-none rounded-xl leading-relaxed"
                                value={state.description}
                                onChange={(e) => updateState({ description: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button variant="ghost" size="sm" className="text-white/50 hover:text-white hover:bg-white/5">
                                <Mic className="w-4 h-4 mr-2" />
                                Голосовой ввод
                            </Button>
                        </div>
                    </div>

                    {/* Type Selection */}
                    <div className="space-y-4">
                        <Label className="text-lg font-semibold text-white flex items-center gap-2">
                            <Layers className="w-5 h-5 text-purple-400" />
                            Выберите тип контента
                        </Label>

                        <div className="grid grid-cols-2 gap-4">
                            <TypeSelectionCard
                                icon={<Instagram className="w-6 h-6" />}
                                title="Карусель"
                                description="Посты для ленты / сторис"
                                active={state.category === 'carousel'}
                                onClick={() => updateState({ category: 'carousel' })}
                                color="purple"
                            />
                            <TypeSelectionCard
                                icon={<Clapperboard className="w-6 h-6" />}
                                title="Аватар Видео"
                                description="Спикер + сценарий"
                                active={state.category === 'avatar_video'}
                                onClick={() => updateState({ category: 'avatar_video' })}
                                color="pink"
                            />
                            <TypeSelectionCard
                                icon={<Sparkles className="w-6 h-6" />}
                                title="Виральный Reels"
                                description="Нарезка + субтитры"
                                active={state.category === 'viral_video'}
                                onClick={() => updateState({ category: 'viral_video' })}
                                color="fuchsia"
                            />
                            <TypeSelectionCard
                                icon={<FileText className="w-6 h-6" />}
                                title="Статья / Пост"
                                description="Telegram, SEO, Threads"
                                active={state.category?.startsWith('article')}
                                onClick={() => updateState({ category: 'article_telegram' })}
                                color="violet"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: Parameters */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10 h-fit backdrop-blur-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Cpu className="w-24 h-24 rotate-12" />
                        </div>

                        <h3 className="text-xl font-semibold text-white border-b border-white/10 pb-4 mb-6 relative z-10">
                            Параметры генерации
                        </h3>

                        {/* Carousel Config */}
                        {state.category === 'carousel' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 relative z-10">

                                <div className="space-y-3">
                                    <Label>Дизайн Стиль</Label>
                                    <div className="grid grid-cols-3 gap-3">
                                        <VisualTemplateOption
                                            label="Минимализм"
                                            color="bg-zinc-800"
                                            active={state.carouselDesign === 'template'} // Simplified for demo
                                            onClick={() => updateState({ carouselDesign: 'template' })}
                                        />
                                        <VisualTemplateOption
                                            label="Неон"
                                            color="bg-purple-900"
                                            active={false}
                                            onClick={() => { }}
                                        />
                                        <VisualTemplateOption
                                            label="Бизнес"
                                            color="bg-blue-900"
                                            active={false}
                                            onClick={() => { }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label>Количество карточек</Label>
                                    <Select value={state.carouselCount} onValueChange={(v) => updateState({ carouselCount: v })}>
                                        <SelectTrigger className="bg-black/40 border-white/10 h-10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="3">⚡️ 3 карточки (Быстро)</SelectItem>
                                            <SelectItem value="5">🔥 5 карточек (Стандарт)</SelectItem>
                                            <SelectItem value="7">💎 7 карточек (Прогрев)</SelectItem>
                                            <SelectItem value="10">📚 10 карточек (Гайд)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3">
                                    <Label>Формат</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div
                                            className={cn(
                                                "cursor-pointer p-3 rounded-lg border text-center transition-all flex items-center justify-center gap-2",
                                                state.carouselFormat === 'feed' ? "bg-purple-500/20 border-purple-500 text-white" : "bg-black/20 border-white/10 text-white/50 hover:bg-white/5"
                                            )}
                                            onClick={() => updateState({ carouselFormat: 'feed' })}
                                        >
                                            <div className="w-4 h-4 border border-current rounded-sm" />
                                            Пост (1:1)
                                        </div>
                                        <div
                                            className={cn(
                                                "cursor-pointer p-3 rounded-lg border text-center transition-all flex items-center justify-center gap-2",
                                                state.carouselFormat === 'story' ? "bg-purple-500/20 border-purple-500 text-white" : "bg-black/20 border-white/10 text-white/50 hover:bg-white/5"
                                            )}
                                            onClick={() => updateState({ carouselFormat: 'story' })}
                                        >
                                            <div className="w-3 h-5 border border-current rounded-sm" />
                                            Stories (9:16)
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(!state.category || state.category !== 'carousel') && (
                            <div className="text-center py-12 text-white/30">
                                <Palette className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p className="text-sm">Выберите тип контента слева,<br />чтобы настроить параметры</p>
                            </div>
                        )}
                    </div>

                    <Button
                        className="w-full mt-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white py-7 text-lg font-bold rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] hover:scale-[1.02] transition-all"
                        disabled={!state.description || !state.category}
                        onClick={() => updateState({ step: 3 })}
                    >
                        <Sparkles className="w-6 h-6 mr-3 animate-pulse" />
                        ЗАПУСТИТЬ КОНВЕЙЕР
                    </Button>
                </div>
            </div>
        </div>
    );

    // STEP 3: GENERATION LOG
    const renderStep3 = () => (
        <GenerationLog onCancel={() => updateState({ step: 1 })} />
    );

    return (
        <div className="w-full min-h-[calc(100vh-8rem)] bg-gradient-to-br from-gray-950 via-[#0a0514] to-[#120524] text-white p-6 relative overflow-hidden font-sans">
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[128px] pointer-events-none animate-pulse-slow" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-fuchsia-600/5 rounded-full blur-[128px] pointer-events-none" />

            {state.step === 1 && renderStep1()}
            {state.step === 2 && renderStep2()}
            {state.step === 3 && renderStep3()}
        </div>
    );
};

// -- SUB COMPONENTS --

// Generation Log Component
const GenerationLog = ({ onCancel }: { onCancel: () => void }) => {
    const [logs, setLogs] = useState<string[]>([]);
    const [progress, setProgress] = useState(0);

    const steps = [
        { text: "Инициализация нейроядра...", delay: 500 },
        { text: "Анализ семантического контекста...", delay: 1500 },
        { text: "Генерация сценарного плана (3 варианта)...", delay: 3000 },
        { text: "Рендеринг визуальных ассетов...", delay: 5000 },
        { text: "Финализация и упаковка...", delay: 7000 },
        { text: "ГОТОВО", delay: 8500 },
    ];

    useEffect(() => {
        let timeouts: NodeJS.Timeout[] = [];

        steps.forEach((step, index) => {
            const t = setTimeout(() => {
                setLogs(prev => [...prev, step.text]);
                setProgress(((index + 1) / steps.length) * 100);
            }, step.delay);
            timeouts.push(t);
        });

        return () => timeouts.forEach(clearTimeout);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto w-full animate-in zoom-in duration-500">

            {/* Central Viz */}
            <div className="relative w-48 h-48 mb-12 flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full animate-spin-slow" />
                <div className="absolute inset-4 border-2 border-fuchsia-500/20 rounded-full animate-reverse-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 bg-purple-500/10 rounded-full blur-xl animate-pulse" />
                    <Cpu className="w-16 h-16 text-purple-400" />
                </div>
                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-full text-center">
                    <span className="text-4xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                        {Math.round(progress)}%
                    </span>
                </div>
            </div>

            {/* Terminal Log */}
            <div className="w-full bg-black/60 border border-white/10 rounded-xl p-6 font-mono text-sm shadow-2xl backdrop-blur-md">
                <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-4 text-white/40">
                    <Terminal className="w-4 h-4" />
                    <span>SYSTEM_LOG_OUTPUT</span>
                </div>
                <div className="space-y-2 h-48 overflow-y-auto">
                    {logs.map((log, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2"
                        >
                            <span className="text-purple-500">[{new Date().toLocaleTimeString().split(' ')[0]}]</span>
                            <span className={i === logs.length - 1 ? "text-white font-bold" : "text-white/70"}>
                                {i === logs.length - 1 && i !== steps.length - 1 && <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />}
                                {log}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>

            <Button variant="outline" className="mt-8 border-white/10 hover:bg-white/5 text-white/50" onClick={onCancel}>
                Отмена операции
            </Button>
        </div>
    );
}

const VisualTemplateOption = ({ label, color, active, onClick }: any) => (
    <div
        onClick={onClick}
        className={cn(
            "aspect-[3/4] rounded-lg border cursor-pointer relative overflow-hidden group transition-all",
            active ? "border-purple-500 ring-1 ring-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]" : "border-white/10 hover:border-white/30"
        )}
    >
        <div className={cn("absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity", color)} />
        <div className="absolute inset-x-2 top-2 h-2 bg-white/20 rounded-full" />
        <div className="absolute inset-x-2 top-6 h-2 bg-white/10 rounded-full w-2/3" />
        <div className="absolute bottom-0 inset-x-0 p-2 bg-black/60 backdrop-blur-sm text-center">
            <span className="text-xs font-medium text-white">{label}</span>
        </div>
    </div>
);

const SourceCard = ({ icon, title, description, color, active, onClick }: any) => {
    const colors: Record<string, string> = {
        pink: "group-hover:text-pink-400 group-data-[active=true]:text-pink-400 border-pink-500/30",
        purple: "group-hover:text-purple-400 group-data-[active=true]:text-purple-400 border-purple-500/30",
        violet: "group-hover:text-violet-400 group-data-[active=true]:text-violet-400 border-violet-500/30",
        fuchsia: "group-hover:text-fuchsia-400 group-data-[active=true]:text-fuchsia-400 border-fuchsia-500/30",
    };

    return (
        <div
            role="button"
            data-active={active}
            onClick={onClick}
            className={cn(
                "group relative flex flex-col items-center justify-center p-8 rounded-3xl border border-white/5 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] cursor-pointer hover:bg-white/10",
                active ? "bg-white/10 border-white/20 ring-1 ring-white/30 shadow-[0_0_30px_rgba(255,255,255,0.05)]" : "",
                "h-[280px]"
            )}
        >
            <div className={cn(
                "mb-6 p-5 rounded-2xl bg-black/40 transition-colors shadow-inner",
                colors[color] || "text-white"
            )}>
                {icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-sm text-white/50 text-center">{description}</p>

            <div className={cn(
                "absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-gradient-to-b from-transparent to-white/5",
                active && "opacity-100"
            )} />
        </div>
    );
};

const TypeSelectionCard = ({ icon, title, description, active, onClick, color }: any) => {
    const borderColors: Record<string, string> = {
        pink: "border-pink-500/50",
        purple: "border-purple-500/50",
        violet: "border-violet-500/50",
        fuchsia: "border-fuchsia-500/50",
    };

    return (
        <div
            onClick={onClick}
            className={cn(
                "flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all relative overflow-hidden group",
                active
                    ? cn("bg-purple-500/20", borderColors[color] || "border-purple-500/50")
                    : "bg-black/20 border-white/5 hover:bg-white/5 hover:border-white/10"
            )}
        >
            <div className={cn(
                "p-3 rounded-lg transition-colors",
                active ? "bg-white/20 text-white" : "bg-white/5 text-white/60 group-hover:text-white"
            )}>
                {icon}
            </div>
            <div className="relative z-10">
                <h4 className={cn("font-medium", active ? "text-white" : "text-white/80")}>{title}</h4>
                <p className="text-xs text-white/40">{description}</p>
            </div>

            {active && <div className="absolute right-2 top-2 text-purple-400">
                <CheckCircle2 className="w-5 h-5" />
            </div>}
        </div>
    );
}
