
import * as React from 'react';
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

interface WizardState {
    step: number;
    source: SourceType;
    description: string;
    category: ContentCategory;
    designStyle: DesignStyle;
    // Carousel specifics
    carouselCount: string;
    carouselFormat: 'story' | 'feed';
    // General
    linkUrl: string;
    isEnhancing: boolean;
    isGenerating: boolean;
}

const INITIAL_STATE: WizardState = {
    step: 1,
    source: null,
    description: '',
    category: null,
    designStyle: 'minimalism',
    carouselCount: '7',
    carouselFormat: 'feed',
    linkUrl: '',
    isEnhancing: false,
    isGenerating: false,
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
        const currentDescription = state.description;
        if (!currentDescription) {
            console.log("[DEBUG]: No description to enhance");
            return;
        }

        console.log("[DEBUG]: Enhancing prompt for:", currentDescription);
        updateState({ isEnhancing: true });

        // Simulate AI delay
        setTimeout(() => {
            const input = currentDescription.toLowerCase();
            let enhanced = currentDescription;

            // Simple "Magic" transformation
            if (input.includes('зубы') || input.includes('гигиена')) {
                enhanced = "Создай экспертную карусель из 7 слайдов о важности профессиональной гигиены зубов раз в полгода, используя тональность заботливого врача и факты о предотвращении кариеса. Включи слайд с 'до/после' описанием и четкий призыв к действию.";
            } else if (input.length < 30) {
                enhanced = `Разработай глубокую контент-стратегию на тему "${currentDescription}". Цель: максимизировать охват и доверие аудитории. Тон: экспертный, вдохновляющий. Добавь виральные крючки и структурированные блоки преимуществ.`;
            }

            console.log("[DEBUG]: Enhanced prompt to:", enhanced);
            updateState({ description: enhanced, isEnhancing: false });
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

        console.log('🚀 [LAUNCH]: ТРАНСЛЯЦИЯ В ПРОИЗВОДСТВО...', payload);

        // Simulation of Webhook call
        setTimeout(() => {
            updateState({ isGenerating: false, step: 3 });
        }, 2000);
    };

    // STEP 1: SOURCE SELECTION
    const renderStep1 = () => (
        <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-6xl mx-auto px-4 animate-in fade-in zoom-in duration-500">
            <div className="text-center mb-16 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold uppercase tracking-widest mb-4">
                    <Cpu className="w-3 h-3" />
                    System.Init()
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2 drop-shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                    Источник <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Контента</span>
                </h1>
                <p className="text-lg text-white/50 font-light max-w-md mx-auto">
                    Выберите базис, на котором нейросеть выстроит ваш виральный проект.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                <SourceCard
                    icon={<LinkIcon className="w-10 h-10" />}
                    title="По ссылке"
                    description="Вставьте URL"
                    color="cyan"
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
                    color="emerald"
                    active={state.source === 'description'}
                    onClick={() => updateState({ source: 'description', step: 2 })}
                />
            </div>
        </div>
    );

    // STEP 2: CONFIGURATION
    const renderStep2 = () => (
        <div className="max-w-6xl mx-auto h-full flex flex-col animate-in slide-in-from-right-10 duration-500">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                    <Button variant="ghost" size="icon" onClick={prevStep} className="text-white/30 hover:text-white hover:bg-white/5 mr-4 rounded-xl">
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tight">Параметры <span className="text-cyan-400">Синтеза</span></h2>
                        <p className="text-white/40 text-sm font-mono uppercase tracking-widest">Configuring neural pathways</p>
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
                    <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Production Ready</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 pb-20 overflow-y-auto custom-scrollbar pr-2">

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
                                {state.isEnhancing ? "ОБРАБОТКА..." : "MAGIC PROMPT"}
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

                            {/* Visual Decor */}
                            <div className="absolute bottom-4 right-4 text-[10px] font-mono text-white/10 select-none">
                                SECURE_INPUT_NODE_84
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
                        {/* Decorative background grid */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />

                        <h3 className="text-sm font-bold text-white uppercase tracking-[0.3em] border-b border-white/5 pb-6 mb-8 flex items-center gap-3">
                            <Cpu className="w-4 h-4 text-cyan-400" />
                            Параметры генерации
                        </h3>

                        <div className="space-y-10 flex-1">
                            {/* Style Selection - Working Interactivity */}
                            <div className="space-y-4">
                                <Label className="text-xs font-bold text-white/40 uppercase tracking-widest">Визуальный Код</Label>
                                <div className="grid grid-cols-3 gap-3">
                                    <VisualTemplateOption
                                        label="Минимализм"
                                        color="bg-zinc-900"
                                        active={state.designStyle === 'minimalism'}
                                        onClick={() => updateState({ designStyle: 'minimalism' })}
                                    />
                                    <VisualTemplateOption
                                        label="Неон"
                                        color="bg-purple-900/60"
                                        active={state.designStyle === 'neon'}
                                        onClick={() => updateState({ designStyle: 'neon' })}
                                    />
                                    <VisualTemplateOption
                                        label="Бизнес"
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
                                        Интерфейс настройки<br />ожидает выбора типа
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* BIG LAUNCH BUTTON */}
                        <div className="mt-10 pt-8 border-t border-white/5">
                            <Button
                                onClick={handleGenerate}
                                disabled={!state.description || !state.category || state.isGenerating}
                                className={cn(
                                    "w-full h-16 text-lg font-black uppercase tracking-[0.2em] rounded-2xl transition-all duration-500 flex items-center justify-center gap-4 group/btn",
                                    state.description && state.category
                                        ? "interstellar-button-shimmer bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-[0_0_40px_rgba(6,182,212,0.3)] hover:shadow-[0_0_60px_rgba(6,182,212,0.5)] scale-100 active:scale-[0.98]"
                                        : "bg-white/5 border border-white/5 text-white/20 grayscale pointer-events-none"
                                )}
                            >
                                {state.isGenerating ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        <span>[MARK]: СОБИРАЮ СВЯЗИ...</span>
                                    </>
                                ) : (
                                    <>
                                        <Rocket className="w-6 h-6 group-hover/btn:-translate-y-1 group-hover/btn:translate-x-1 transition-transform duration-500" />
                                        <span>ЗАПУСТИТЬ ГЕНЕРАЦИЮ</span>
                                    </>
                                )}
                            </Button>
                            <div className="mt-4 flex items-center justify-center gap-2">
                                <ShieldCheck className="w-3 h-3 text-emerald-500/50" />
                                <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest leading-none">Neural Protocol v.5.0.2 Secured</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // STEP 3: PRODUCTION FLOOR (Enhanced)
    const renderStep3 = () => (
        <ProductionFloor onCancel={() => updateState({ step: 1 })} />
    );

    return (
        <div className="w-full min-h-[calc(100vh-8rem)] bg-[#050505] text-white p-6 relative overflow-hidden font-sans">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-purple-500/5 rounded-full blur-[150px] pointer-events-none" />

            {state.step === 1 && renderStep1()}
            {state.step === 2 && renderStep2()}
            {state.step === 3 && renderStep3()}
        </div>
    );
};

// -- SUB COMPONENTS --

// Enhanced Production Floor
const ProductionFloor = ({ onCancel }: { onCancel: () => void }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);

    const steps = [
        { label: "Neural Init", icon: <Cpu />, detail: "Подключение к вычислительному ядру..." },
        { label: "semantic Scan", icon: <Dna />, detail: "Анализ семантических связей промпта..." },
        { label: "Script engine", icon: <Terminal />, detail: "Генерация сценарной структуры..." },
        { label: "Visual Synthesis", icon: <ImageIcon />, detail: "Синтез визуальных образов и макетов..." },
        { label: "Final assembly", icon: <CheckCircle2 />, detail: "Сборка финальных слоев контента..." }
    ];

    useEffect(() => {
        let timer: NodeJS.Timeout;
        const runNextStep = (index: number) => {
            if (index < steps.length) {
                setCurrentStep(index);
                setLogs(prev => [...prev, `[PROCESS]: ${steps[index].label.toUpperCase()} COMPLETED`]);
                timer = setTimeout(() => runNextStep(index + 1), 2000 + Math.random() * 1500);
            } else {
                setLogs(prev => [...prev, "[SYSTEM]: ПРОИЗВОДСТВО ЗАВЕРШЕНО. КОНТЕНТ ГОТОВ."]);
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
                    ЦЕХ ПРОИЗВОДСТВА
                </div>
                <h2 className="text-5xl font-black text-white tracking-tighter mb-4">ИНДУСТРИАЛЬНЫЙ <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">СИНТЕЗ</span></h2>
                <p className="text-white/30 text-lg font-light">Ваша идея проходит через 5 этапов нейронной обработки</p>
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
                        <span className="text-xs font-bold text-white/40 uppercase tracking-[0.2em]">Neural Logs</span>
                    </div>
                    <div className="px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 text-[10px] font-mono">
                        {Math.round((currentStep + 1 / steps.length) * 100)}% LOAD
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
    const colors: Record<string, string> = {
        cyan: "group-hover:text-cyan-400 group-data-[active=true]:text-cyan-400 border-cyan-500/30",
        emerald: "group-hover:text-emerald-400 group-data-[active=true]:text-emerald-400 border-emerald-500/30",
        violet: "group-hover:text-violet-400 group-data-[active=true]:text-violet-400 border-violet-500/30",
        fuchsia: "group-hover:text-fuchsia-400 group-data-[active=true]:text-fuchsia-400 border-fuchsia-500/30",
    };

    return (
        <div
            role="button"
            data-active={active}
            onClick={onClick}
            className={cn(
                "group relative flex flex-col items-center justify-center p-8 rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl transition-all duration-500 hover:scale-[1.05] cursor-pointer hover:bg-white/[0.05]",
                active ? "bg-white/[0.08] border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.03)]" : "",
                "h-[320px]"
            )}
        >
            <div className={cn(
                "mb-8 p-6 rounded-3xl bg-black/40 transition-colors shadow-2xl relative z-10",
                colors[color] || "text-white text-cyan-400"
            )}>
                {icon}
            </div>
            <h3 className="text-2xl font-black text-white mb-2 tracking-tight z-10">{title}</h3>
            <p className="text-[11px] font-bold text-white/30 text-center uppercase tracking-widest z-10">{description}</p>

            <div className={cn(
                "absolute inset-0 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-gradient-to-b from-transparent to-white/5",
                active && "opacity-100"
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
