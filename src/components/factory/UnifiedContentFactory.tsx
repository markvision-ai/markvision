import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles,
    Rocket,
    Type,
    Link as LinkIcon,
    Image as ImageIcon,
    Video as VideoIcon,
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
    Palette,
    UploadCloud,
    ArrowRight,
    ArrowLeft,
    Check,
    Loader2,
    Mic,
    FileText,
    Clapperboard,
    MessageSquare,
    TrendingUp,
    Cpu,
    Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface UnifiedContentFactoryProps {
    projectId: string;
}

type SourceType = 'description' | 'link' | 'photo' | 'video';
type ContentFormat = 'insta-carousel' | 'fb-target' | 'neuro-photo' | 'reels-cover' | 'instagram-stories';

const FORMATS = [
    { id: 'insta-carousel', label: 'Instagram Carousel', icon: Layers, description: 'Масштабируемый пост из карточек' },
    { id: 'neuro-photo', label: 'Нейрофото', icon: Camera, description: 'Фотореалистичные AI-изображения' },
    { id: 'reels-cover', label: 'Обложка Reels', icon: PlaySquare, description: 'Виральный заголовок и дизайн' },
    { id: 'fb-target', label: 'Facebook Target', icon: Facebook, description: 'Конверсионный креатив для рекламы' },
    { id: 'instagram-stories', label: 'Instagram Stories', icon: Instagram, description: 'Вертикальный вовлекающий контент' },
] as const;

export const UnifiedContentFactory: React.FC<UnifiedContentFactoryProps> = ({ projectId }) => {
    // Wizard Steps: 1: Source, 2: Format, 3: Refine & Style
    const [step, setStep] = useState(1);

    // Form State
    const [sourceType, setSourceType] = useState<SourceType | null>(null);
    const [format, setFormat] = useState<ContentFormat>('insta-carousel');
    const [mainText, setMainText] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [fileUrl, setFileUrl] = useState('');
    const [magicGenerationNeeded, setMagicGenerationNeeded] = useState(false);
    const [visualInstructions, setVisualInstructions] = useState('');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [designTemplateId, setDesignTemplateId] = useState('template_1');

    // UI States
    const [isLoading, setIsLoading] = useState(false);
    const [isMagicLoading, setIsMagicLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await uploadToSupabase(file);
    };

    const uploadToSupabase = async (file: File) => {
        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${crypto.randomUUID()}.${fileExt}`;
            const filePath = `${projectId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('ad-creatives')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('ad-creatives')
                .getPublicUrl(filePath);

            setFileUrl(data.publicUrl);
            toast.success('Файл успешно загружен!', {
                icon: <CheckCircle2 className="w-5 h-5 text-blue-500" />
            });
        } catch (error: any) {
            console.error('Upload Error:', error);
            toast.error('Ошибка загрузки', {
                description: error.message || 'Не удалось загрузить файл.',
                icon: <AlertCircle className="w-5 h-5 text-red-500" />
            });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleMagicAI = async () => {
        if (!mainText) {
            toast.error('Сначала введите описание или идею');
            return;
        }

        setIsMagicLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('improve-content-task', {
                body: { text: mainText, format: format }
            });

            if (error) throw error;

            if (data?.success && data.text) {
                setMainText(data.text);
                setMagicGenerationNeeded(true);
                toast.success('Магия AI сработала!', {
                    description: 'Ваш текст преобразован в детальное ТЗ.',
                    icon: <Sparkles className="w-5 h-5 text-primary" />
                });
            } else {
                throw new Error('Не удалось получить ответ от AI');
            }
        } catch (error: any) {
            console.error('Magic AI error:', error);
            toast.error('Ошибка Магии AI', {
                description: error.message || 'Не удалось улучшить текст.'
            });
        } finally {
            setIsMagicLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (sourceType === 'description' && !mainText && !magicGenerationNeeded) {
            toast.error('Введите описание или активируйте Магию AI');
            return;
        }
        if (sourceType === 'link' && !linkUrl) {
            toast.error('Пожалуйста, вставьте ссылку');
            return;
        }
        if ((sourceType === 'photo' || sourceType === 'video') && !fileUrl) {
            toast.error('Пожалуйста, загрузите файл');
            return;
        }

        setIsLoading(true);

        const payload = {
            project_id: projectId,
            source_type: sourceType,
            format: format,
            main_text: sourceType === 'description' ? mainText : sourceType === 'link' ? linkUrl : fileUrl,
            magic_generation_needed: sourceType === 'description' ? magicGenerationNeeded : false,
            visual_instructions: visualInstructions,
            aspect_ratio: aspectRatio,
            design_template_id: designTemplateId,
        };

        try {
            const { data: responseData, error: functionError } = await supabase.functions.invoke('trigger-n8n-content', {
                body: payload,
            });

            if (functionError) throw functionError;

            toast.success('Задание отправлено на Контент-Завод!', {
                description: 'Генерация займет 1-2 минуты. Вы получите уведомление по готовности.',
                icon: <CheckCircle2 className="w-5 h-5 text-blue-500" />
            });

            // Reset and go to step 1
            setStep(1);
            setSourceType(null);
            setMainText('');
            setLinkUrl('');
            setFileUrl('');
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

    // Render Source Selection (Step 1)
    const renderStep1 = () => (
        <div className="space-y-12 animate-in fade-in zoom-in duration-500 max-w-5xl mx-auto">
            <div className="text-center space-y-4">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Шаг 1: Выбор источника
                </Badge>
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">С чего начнем <span className="text-primary italic">генерацию?</span></h2>
                <p className="text-white/40 text-lg max-w-xl mx-auto font-medium">Выберите способ создания контента. AI проанализирует входящие данные и создаст шедевр.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { id: 'description', label: 'Описание', icon: Type, color: 'primary', sub: 'Текст или идея' },
                    { id: 'link', label: 'Ссылка', icon: LinkIcon, color: 'blue', sub: 'WB / WB / Kaspi' },
                    { id: 'photo', label: 'Фото', icon: ImageIcon, color: 'secondary', sub: 'Продукт или референс' },
                    { id: 'video', label: 'Видео', icon: VideoIcon, color: 'purple', sub: 'Сырой материал' },
                ].map((item) => (
                    <button
                        key={item.id}
                        onClick={() => {
                            setSourceType(item.id as SourceType);
                            nextStep();
                        }}
                        className="group relative flex flex-col items-center justify-center p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 hover:border-primary/30 transition-all duration-500 hover:bg-white/[0.06] hover:-translate-y-2 shadow-interstellar"
                    >
                        <div className={cn(
                            "p-6 rounded-2xl mb-6 transition-all duration-500 border",
                            "bg-white/5 border-white/10 text-white/40 group-hover:bg-primary group-hover:text-white group-hover:border-primary/50 group-hover:shadow-lg group-hover:shadow-primary/20"
                        )}>
                            <item.icon className="w-10 h-10 stroke-[1.5]" />
                        </div>
                        <span className="text-xl font-bold text-white mb-2">{item.label}</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 group-hover:text-white/40">{item.sub}</span>
                    </button>
                ))}
            </div>
        </div>
    );

    // Render Format & Inputs (Step 2)
    const renderStep2 = () => (
        <div className="space-y-10 animate-in slide-in-from-right-10 duration-500 max-w-6xl mx-auto">
            <div className="flex items-center gap-6 mb-12">
                <Button variant="ghost" size="icon" onClick={prevStep} className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10">
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase tracking-[0.05em]">
                        {sourceType === 'description' && '2. Настройка описания'}
                        {sourceType === 'link' && '2. Параметры по ссылке'}
                        {sourceType === 'photo' && '2. Загрузка фото'}
                        {sourceType === 'video' && '2. Загрузка видео'}
                    </h2>
                    <p className="text-white/30 text-sm font-medium uppercase tracking-widest mt-1">Выберите формат и введите данные</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                {/* Left: Format Selection */}
                <div className="xl:col-span-12 space-y-6">
                    <Label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2 flex items-center gap-3">
                        <Layout className="w-4 h-4 text-secondary" /> Выберите формат контента
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {FORMATS.map((f) => {
                            const active = format === f.id;
                            return (
                                <button
                                    key={f.id}
                                    onClick={() => setFormat(f.id)}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-6 rounded-[2rem] transition-all duration-500 text-center gap-4 group relative overflow-hidden",
                                        active
                                            ? "bg-secondary/10 border border-secondary/50 shadow-interstellar shadow-secondary/10"
                                            : "bg-white/[0.03] border border-white/5 hover:border-white/20 hover:bg-white/[0.06]"
                                    )}
                                >
                                    <div className={cn(
                                        "p-4 rounded-xl transition-all duration-500",
                                        active ? "bg-secondary text-white scale-110" : "bg-white/5 text-white/20 group-hover:text-white/40"
                                    )}>
                                        <f.icon className="w-6 h-6 stroke-[1.5]" />
                                    </div>
                                    <div className="space-y-1">
                                        <span className={cn("text-[9px] font-black uppercase tracking-widest block", active ? "text-white" : "text-white/40")}>{f.label}</span>
                                        <span className="text-[8px] font-medium text-white/20 group-hover:text-white/30 transition-opacity whitespace-nowrap">{f.description}</span>
                                    </div>
                                    {active && (
                                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-secondary flex items-center justify-center shadow-lg border-2 border-[#020617]">
                                            <Check className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right: Data Input */}
                <div className="xl:col-span-12 space-y-8">
                    <section className="bg-card/40 backdrop-blur-3xl rounded-[2.5rem] p-10 border border-white/10 shadow-interstellar">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-5 border-b border-white/5 pb-10 mb-10">
                            <h3 className="text-2xl font-black text-white tracking-tighter uppercase tracking-[0.05em] flex items-center gap-4">
                                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                    <Sparkles className="w-5 h-5 text-primary" />
                                </div>
                                Ввод данных
                            </h3>

                            {sourceType === 'description' && (
                                <Button
                                    onClick={handleMagicAI}
                                    disabled={isMagicLoading || !mainText}
                                    className={cn(
                                        "rounded-full h-14 px-10 transition-all duration-500 font-black text-[10px] uppercase tracking-[0.2em] shadow-lg",
                                        magicGenerationNeeded
                                            ? "bg-primary/20 text-primary border border-primary/50"
                                            : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10 border border-white/10"
                                    )}
                                >
                                    {isMagicLoading ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <Wand2 className="w-5 h-5 mr-3" />}
                                    {isMagicLoading ? "Магия..." : magicGenerationNeeded ? "Магия AI Активна" : "Магия AI ✨"}
                                </Button>
                            )}
                        </div>

                        {sourceType === 'description' && (
                            <Textarea
                                placeholder={magicGenerationNeeded ? "✨ Опишите идею кратко, я доработаю..." : "📝 Введите подробное описание или сценарий..."}
                                value={mainText}
                                onChange={(e) => setMainText(e.target.value)}
                                className={cn(
                                    "min-h-[250px] p-8 text-lg rounded-[1.5rem] transition-all duration-500 text-white border-0 shadow-inner",
                                    magicGenerationNeeded ? "bg-primary/5 placeholder:text-primary/20" : "bg-white/[0.03] placeholder:text-white/10"
                                )}
                            />
                        )}

                        {sourceType === 'link' && (
                            <div className="relative">
                                <LinkIcon className="absolute left-8 top-1/2 -translate-y-1/2 w-8 h-8 text-white/10" />
                                <Input
                                    placeholder="Вставьте ссылку на товар (Kaspi, WB, Instagram)..."
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    className="h-24 pl-20 text-xl rounded-[1.5rem] bg-white/[0.03] border-white/10 text-white placeholder:text-white/10 font-medium"
                                />
                            </div>
                        )}

                        {(sourceType === 'photo' || sourceType === 'video') && (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                    "relative h-[350px] flex flex-col items-center justify-center border-2 border-dashed rounded-[3rem] transition-all duration-500 cursor-pointer overflow-hidden",
                                    fileUrl ? "bg-primary/5 border-primary/30 shadow-2xl" : "bg-white/[0.02] border-white/10 hover:bg-white/[0.05] hover:border-primary/20"
                                )}
                            >
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept={sourceType === 'photo' ? "image/*" : "video/*"} className="hidden" />

                                {isUploading ? (
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="relative">
                                            <Loader2 className="w-16 h-16 animate-spin text-primary" />
                                            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                                        </div>
                                        <p className="text-primary font-black uppercase tracking-widest text-[11px]">Загрузка в облако...</p>
                                    </div>
                                ) : fileUrl ? (
                                    <div className="relative w-full h-full flex items-center justify-center group p-8">
                                        <div className="relative max-h-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-white/20">
                                            {sourceType === 'photo' ? (
                                                <img src={fileUrl} className="w-full h-full object-contain" />
                                            ) : (
                                                <video src={fileUrl} className="w-full h-full object-contain" />
                                            )}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm flex items-center justify-center">
                                                <Button variant="ghost" className="rounded-full bg-white/10 text-white font-black uppercase tracking-widest text-[10px] px-8 h-12 border border-white/20">Сменить файл</Button>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-6 right-6 p-4 bg-primary rounded-full shadow-lg">
                                            <CheckCircle2 className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-10">
                                        <div className="p-10 rounded-full bg-white/5 border border-white/10 shadow-xl group-hover:scale-110 transition-transform">
                                            <UploadCloud className="w-16 h-16 text-white/20 group-hover:text-primary transition-colors" />
                                        </div>
                                        <div className="text-center space-y-3">
                                            <p className="text-2xl font-black text-white tracking-tighter uppercase tracking-[0.1em]">Загрузите ваш {sourceType === 'photo' ? 'снимок' : 'ролик'}</p>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Перетащите или нажмите (до 50МБ)</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                </div>
            </div>

            <div className="flex justify-end pt-12 border-t border-white/5">
                <Button
                    onClick={nextStep}
                    disabled={
                        (sourceType === 'description' && !mainText) ||
                        (sourceType === 'link' && !linkUrl) ||
                        ((sourceType === 'photo' || sourceType === 'video') && !fileUrl)
                    }
                    className="h-20 px-16 rounded-[1.8rem] bg-primary hover:bg-primary/90 text-white font-black text-lg uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-1"
                >
                    Перейти к стилю <ArrowRight className="w-6 h-6 ml-4" />
                </Button>
            </div>
        </div>
    );

    // Render Final Step (Step 3: Refine & Submit)
    const renderStep3 = () => (
        <div className="space-y-10 animate-in slide-in-from-right-10 duration-500 max-w-6xl mx-auto pb-40">
            <div className="flex items-center gap-6 mb-12">
                <Button variant="ghost" size="icon" onClick={prevStep} className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10">
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase tracking-[0.05em]">
                        Пульт <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Конвейера</span>
                    </h1>
                    <p className="text-white/30 text-sm font-medium uppercase tracking-widest mt-1">Финальные штрихи перед запуском AI</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                {/* Left: Additional Instructions */}
                <div className="xl:col-span-12 space-y-8">
                    <section className="bg-card/40 backdrop-blur-3xl rounded-[3rem] p-12 border border-white/10 shadow-interstellar relative overflow-hidden">
                        {/* Summary Badge */}
                        <div className="absolute top-10 right-10">
                            <Badge className="bg-white/5 border-white/10 text-white/40 font-black uppercase tracking-widest text-[9px] px-4 py-2 rounded-full">
                                {format} • {aspectRatio}
                            </Badge>
                        </div>

                        <div className="space-y-10">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-4 ml-4">
                                    <Palette className="w-4 h-4 text-primary" /> Настройте визуальный стиль
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                    {[
                                        { id: 'template_1', label: 'Чистый Минимализм', color: 'bg-white/10' },
                                        { id: 'template_2', label: 'Премиум Глянец', color: 'bg-gradient-to-br from-amber-400 to-amber-600' },
                                        { id: 'template_3', label: 'Футуристичный Неон', color: 'bg-gradient-to-br from-primary to-indigo-600' },
                                    ].map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setDesignTemplateId(t.id)}
                                            className={cn(
                                                "p-6 rounded-[2rem] border transition-all duration-500 text-left flex items-center gap-5 group relative overflow-hidden",
                                                designTemplateId === t.id
                                                    ? "bg-white/10 border-primary/50 shadow-lg shadow-primary/5"
                                                    : "bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/5"
                                            )}
                                        >
                                            <div className={cn("w-10 h-10 rounded-xl shadow-lg border border-white/20", t.color)} />
                                            <span className={cn("text-[10px] font-black uppercase tracking-widest transition-colors", designTemplateId === t.id ? "text-white" : "text-white/40")}>{t.label}</span>
                                            {designTemplateId === t.id && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(249,115,22,1)]" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-4 ml-4">
                                        <Target className="w-4 h-4 text-secondary" /> Пропорции холста
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { id: '1:1', label: 'Квадрат (Feed)', icon: <Layout className="w-4 h-4" /> },
                                            { id: '9:16', label: 'Вертикаль (Reels)', icon: <div className="w-3 h-5 border-2 border-current rounded-sm" /> },
                                            { id: '4:5', label: 'Портрет (Ads)', icon: <div className="w-4 h-5 border-2 border-current rounded-sm" /> },
                                            { id: '16:9', label: 'Горизонт (YouTube)', icon: <div className="w-5 h-3 border-2 border-current rounded-sm" /> },
                                        ].map((r) => (
                                            <button
                                                key={r.id}
                                                onClick={() => setAspectRatio(r.id)}
                                                className={cn(
                                                    "h-16 rounded-2xl border transition-all duration-500 uppercase flex items-center justify-center gap-4 font-black text-[9px] tracking-widest",
                                                    aspectRatio === r.id ? "bg-secondary text-white border-secondary shadow-lg shadow-secondary/10" : "bg-white/5 border-white/5 text-white/20 hover:bg-white/10"
                                                )}
                                            >
                                                {r.icon} {r.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-4 ml-4">
                                        <Settings2 className="w-4 h-4 text-white/60" /> Визуальные инструкции
                                    </label>
                                    <Textarea
                                        placeholder="Опишите фон, цвета или специфичные детали..."
                                        value={visualInstructions}
                                        onChange={(e) => setVisualInstructions(e.target.value)}
                                        className="min-h-[148px] p-6 rounded-3xl bg-white/[0.03] border-white/10 text-sm italic placeholder:text-white/5 shadow-inner leading-relaxed"
                                    />
                                </div>
                            </div>

                            <div className="pt-10 flex flex-col sm:flex-row gap-6 items-center">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    className={cn(
                                        "h-24 flex-1 w-full rounded-[2rem] text-xl font-black uppercase tracking-[0.2em] relative overflow-hidden transition-all duration-700",
                                        isLoading ? "bg-white/5 text-white/20" : "bg-gradient-to-r from-primary to-secondary text-white shadow-interstellar hover:shadow-primary/30 hover:-translate-y-2"
                                    )}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-6">
                                            <Loader2 className="w-10 h-10 animate-spin" />
                                            <span>Конвейер запущен...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-6">
                                            <Rocket className="w-10 h-10 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform duration-500" />
                                            <span>Запустить генерацию</span>
                                        </div>
                                    )}
                                </Button>
                                <div className="bg-white/5 border border-white/10 px-8 py-4 rounded-3xl text-center min-w-[200px]">
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-1">Расход</p>
                                    <p className="text-white font-black uppercase tracking-widest text-lg">1 Кредит</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10">
                <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl text-center space-y-3">
                    <CheckCircle2 className="w-12 h-12 text-blue-500 mx-auto opacity-40" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Контроль качества</p>
                    <p className="text-xs text-white/20">AI проверит каждый кадр на соответствие вашему стилю</p>
                </div>
                <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl text-center space-y-3">
                    <Rocket className="w-12 h-12 text-primary mx-auto opacity-40" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Скорость 180км/ч</p>
                    <p className="text-xs text-white/20">Результаты будут готовы в течение 2 минут</p>
                </div>
                <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl text-center space-y-3">
                    <Target className="w-12 h-12 text-secondary mx-auto opacity-40" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Pixel Perfect</p>
                    <p className="text-xs text-white/20">Оптимизация под каждую соцсеть автоматически</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen w-full bg-[#020617] relative overflow-x-hidden pt-36 pb-20">
            {/* Background Effects */}
            <div className="absolute top-0 inset-x-0 h-[1000px] bg-gradient-to-b from-primary/5 via-secondary/2 to-transparent pointer-events-none" />
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[100%] h-[600px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
            </div>
        </div>
    );
};
