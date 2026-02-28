import React, { useState, useRef } from 'react';
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
    Palette,
    UploadCloud
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { supabase } from '@/integrations/supabase/client';

interface ContentFactoryFormProps {
    projectId: string;
}

type SourceType = 'description' | 'link' | 'photo';
type ContentFormat = 'insta-carousel' | 'fb-target' | 'neuro-photo' | 'reels-cover' | 'instagram-stories';

const FORMATS = [
    { id: 'insta-carousel', label: 'Instagram Carousel', icon: Layers },
    { id: 'fb-target', label: 'Facebook Target', icon: Facebook },
    { id: 'neuro-photo', label: 'Нейрофото', icon: Camera },
    { id: 'reels-cover', label: 'Обложка Reels', icon: PlaySquare },
    { id: 'instagram-stories', label: 'Instagram Stories', icon: Instagram },
] as const;

export const ContentFactoryForm: React.FC<ContentFactoryFormProps> = ({ projectId }) => {
    const [sourceType, setSourceType] = useState<SourceType>('description');
    const [format, setFormat] = useState<ContentFormat>('insta-carousel');
    const [mainText, setMainText] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [fileUrl, setFileUrl] = useState('');
    const [magicGenerationNeeded, setMagicGenerationNeeded] = useState(false);
    const [visualInstructions, setVisualInstructions] = useState('');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [designTemplateId, setDesignTemplateId] = useState('template_1');

    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

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
            toast.success('Фото успешно загружено!', {
                icon: <CheckCircle2 className="w-5 h-5 text-blue-500" />
            });
        } catch (error: any) {
            console.error('Upload Error:', error);
            toast.error('Ошибка загрузки', {
                description: error.message || 'Не удалось загрузить изображение.',
                icon: <AlertCircle className="w-5 h-5 text-red-500" />
            });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        const file = e.dataTransfer.files?.[0];
        if (!file || !file.type.startsWith('image/')) {
            toast.error('Пожалуйста, загрузите изображение');
            return;
        }

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
            toast.success('Фото успешно загружено!', {
                icon: <CheckCircle2 className="w-5 h-5 text-blue-500" />
            });
        } catch (error: any) {
            console.error('Upload Error:', error);
            toast.error('Ошибка загрузки', {
                description: error.message || 'Не удалось загрузить изображение.',
                icon: <AlertCircle className="w-5 h-5 text-red-500" />
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
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
        if (sourceType === 'photo' && !fileUrl) {
            toast.error('Пожалуйста, загрузите изображение');
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
                icon: <CheckCircle2 className="w-5 h-5 text-blue-500" />
            });

            // Clear form
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

    return (
        <div className="relative min-h-full w-full bg-[#020617] font-sans text-white p-4 sm:p-8 pt-24 overflow-y-auto">
            {/* Ambient Background Glow for Super-Level Premium Feel */}
            <div className="absolute top-[-10%] left-[20%] w-[60%] h-[400px] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none z-0" />
            <div className="absolute bottom-[-20%] right-[10%] w-[50%] h-[400px] bg-primary/10 blur-[150px] rounded-full pointer-events-none z-0" />

            <div className="relative z-10 max-w-[1200px] mx-auto space-y-8 pb-32">
                {/* Header Section */}
                <div className="flex flex-col space-y-4 pb-8">
                    <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 shadow-interstellar backdrop-blur-md w-fit">
                        <Rocket className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Контент-Завод 3.0</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white">
                        Пульт управления <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">AI</span>
                    </h1>
                    <p className="text-white/40 max-w-2xl text-xl leading-relaxed font-medium">
                        Спроектируйте ваш следующий виральный пост. Выберите формат, настройте дизайн и отправьте задачу на наш автоматизированный AI-завод.
                    </p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Main Content Area */}
                    <div className="xl:col-span-8 space-y-8">

                        {/* Block A: Source */}
                        <section className="bg-card/40 backdrop-blur-3xl rounded-[2.5rem] p-8 md:p-10 border border-white/10 flex flex-col gap-8 shadow-interstellar transition-all hover:bg-white/[0.03]">
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 shadow-lg">
                                    <Type className="w-6 h-6 text-primary" />
                                </div>
                                <h2 className="text-2xl font-black text-white tracking-tighter uppercase tracking-[0.05em]">1. Источник контента</h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                {(['description', 'link', 'photo'] as const).map((type) => {
                                    const active = sourceType === type;
                                    return (
                                        <button
                                            key={type}
                                            onClick={() => setSourceType(type)}
                                            className={cn(
                                                "relative flex flex-col items-center justify-center p-8 rounded-[2rem] transition-all duration-500 gap-5 group outline-none overflow-hidden",
                                                active
                                                    ? "border border-primary/50 shadow-[0_0_30px_rgba(249,115,22,0.15)] bg-primary/10"
                                                    : "border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20"
                                            )}
                                        >
                                            <div className={cn(
                                                "p-5 rounded-full transition-all duration-500 border",
                                                active ? "bg-primary text-white border-primary/50 shadow-lg shadow-primary/20 scale-110" : "bg-white/5 text-white/40 border-white/10 group-hover:text-white group-hover:bg-white/10"
                                            )}>
                                                {type === 'description' && <Type className="w-8 h-8 stroke-[1.5]" />}
                                                {type === 'link' && <LinkIcon className="w-8 h-8 stroke-[1.5]" />}
                                                {type === 'photo' && <ImageIcon className="w-8 h-8 stroke-[1.5]" />}
                                            </div>
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500",
                                                active ? "text-white" : "text-white/40 group-hover:text-white/80"
                                            )}>
                                                {type === 'description' ? 'По описанию' : type === 'link' ? 'По ссылке' : 'По фото'}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Block B: Format */}
                        <section className="bg-card/40 backdrop-blur-3xl rounded-[2.5rem] p-8 md:p-10 border border-white/10 flex flex-col gap-8 shadow-interstellar transition-all hover:bg-white/[0.03]">
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 shadow-lg">
                                    <Layout className="w-6 h-6 text-secondary" />
                                </div>
                                <h2 className="text-2xl font-black text-white tracking-tighter uppercase tracking-[0.05em]">2. Выбор формата</h2>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
                                {FORMATS.map((f) => {
                                    const Icon = f.icon;
                                    const active = format === f.id;
                                    return (
                                        <button
                                            key={f.id}
                                            onClick={() => setFormat(f.id)}
                                            className={cn(
                                                "relative flex flex-col items-center justify-center p-6 rounded-[1.5rem] transition-all duration-500 text-center gap-5 group outline-none",
                                                active
                                                    ? "border border-secondary/50 shadow-[0_0_30px_rgba(59,130,246,0.15)] bg-secondary/10"
                                                    : "border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20"
                                            )}
                                        >
                                            <div className={cn(
                                                "p-4 rounded-[1.2rem] transition-all duration-500",
                                                active ? "bg-secondary text-white scale-110 shadow-lg shadow-secondary/20" : "bg-white/5 border border-white/10 group-hover:scale-105"
                                            )}>
                                                <Icon className={cn("w-7 h-7 stroke-[1.5]", active ? "text-white" : "text-white/40 group-hover:text-white/80")} />
                                            </div>
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-[0.15em] leading-tight",
                                                active ? "text-white" : "text-white/40 group-hover:text-white/80"
                                            )}>
                                                {f.label}
                                            </span>
                                            {active && (
                                                <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-secondary flex items-center justify-center shadow-lg border-4 border-[#020617]">
                                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Block C: Content (Dynamic) */}
                        <section className="bg-card/40 backdrop-blur-3xl rounded-[2.5rem] p-8 md:p-10 border border-white/10 flex flex-col gap-8 shadow-interstellar transition-all hover:bg-white/[0.03]">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-5 border-b border-white/5 pb-8">
                                <div className="flex items-center gap-5">
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 shadow-lg">
                                        <Wand2 className="w-6 h-6 text-sky-400" />
                                    </div>
                                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase tracking-[0.05em]">3. Сценарий и Текст</h2>
                                </div>

                                {sourceType === 'description' && (
                                    <button
                                        onClick={() => setMagicGenerationNeeded(!magicGenerationNeeded)}
                                        className={cn(
                                            "relative overflow-hidden flex items-center gap-3 px-8 py-4 rounded-full transition-all duration-500 font-black text-[10px] uppercase tracking-[0.2em] outline-none shadow-lg",
                                            magicGenerationNeeded
                                                ? "border border-primary/50 bg-primary/20 text-primary shadow-primary/20"
                                                : "border border-white/10 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 hover:shadow-xl"
                                        )}
                                    >
                                        {magicGenerationNeeded && (
                                            <div className="absolute inset-0 bg-primary/10 opacity-50 animate-pulse pointer-events-none" />
                                        )}
                                        <Sparkles className={cn("w-5 h-5 z-10", magicGenerationNeeded ? "text-primary animate-pulse" : "text-white/40 group-hover:text-white/80")} />
                                        <span className="z-10">{magicGenerationNeeded ? "Магия AI Активна" : "Магия AI ✨"}</span>
                                    </button>
                                )}
                            </div>

                            <div className="relative group">
                                {sourceType === 'description' && (
                                    <Textarea
                                        placeholder={magicGenerationNeeded
                                            ? "✨ Напишите краткую суть в 2-3 словах, остальное блестяще додумает AI..."
                                            : "📝 Введите подробное описание, текст поста или сценарий вашего контента..."
                                        }
                                        value={mainText}
                                        onChange={(e) => setMainText(e.target.value)}
                                        className={cn(
                                            "min-h-[250px] p-8 text-lg leading-relaxed resize-none rounded-[1.5rem] transition-all duration-500 text-white outline-none shadow-inner",
                                            magicGenerationNeeded
                                                ? "bg-primary/5 border-primary/20 focus-visible:ring-primary/20 focus-visible:border-primary/50 placeholder:text-primary/30"
                                                : "bg-white/[0.03] border-white/10 focus-visible:ring-secondary/20 focus-visible:border-secondary/50 placeholder:text-white/10"
                                        )}
                                    />
                                )}

                                {sourceType === 'link' && (
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                            <LinkIcon className="h-6 w-6 text-white/20" />
                                        </div>
                                        <Input
                                            type="url"
                                            placeholder="Вставьте ссылку на пост, статью или сайт..."
                                            value={linkUrl}
                                            onChange={(e) => setLinkUrl(e.target.value)}
                                            className={cn(
                                                "pl-16 h-20 text-lg rounded-[1.5rem] transition-all duration-500 text-white outline-none shadow-inner",
                                                "bg-white/[0.03] border-white/10 focus-visible:ring-primary/20 focus-visible:border-primary/50 placeholder:text-white/10"
                                            )}
                                        />
                                    </div>
                                )}

                                {sourceType === 'photo' && (
                                    <div
                                        className={cn(
                                            "relative flex flex-col items-center justify-center p-16 lg:p-24 border-2 border-dashed rounded-[2.5rem] transition-all duration-500 cursor-pointer overflow-hidden group",
                                            fileUrl
                                                ? "border-primary/50 bg-primary/5"
                                                : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/30"
                                        )}
                                        onClick={() => fileInputRef.current?.click()}
                                        onDrop={handleDrop}
                                        onDragOver={handleDragOver}
                                    >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                            accept="image/*"
                                            className="hidden"
                                        />

                                        {isUploading ? (
                                            <div className="flex flex-col items-center gap-6">
                                                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                                                <p className="text-primary font-black uppercase tracking-widest text-xs">Загрузка в облако...</p>
                                            </div>
                                        ) : fileUrl ? (
                                            <div className="flex flex-col items-center gap-6 z-10 w-full">
                                                <div className="relative w-full max-w-md rounded-[2rem] overflow-hidden border border-white/20 shadow-2xl">
                                                    <img src={fileUrl} alt="Uploaded preview" className="w-full h-auto object-cover" />
                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity backdrop-blur-[4px]">
                                                        <span className="text-white font-black uppercase tracking-widest text-xs bg-white/10 px-6 py-3 rounded-full border border-white/20 shadow-lg">Заменить фото</span>
                                                    </div>
                                                </div>
                                                <p className="text-primary font-black uppercase tracking-widest text-[10px] flex items-center gap-3">
                                                    <CheckCircle2 className="w-6 h-6" /> Фото успешно загружено
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-8 z-10">
                                                <div className="p-8 bg-white/5 rounded-full border border-white/10 shadow-xl group-hover:scale-110 group-hover:bg-primary/10 group-hover:border-primary/30 transition-all duration-500">
                                                    <UploadCloud className="w-12 h-12 text-white/20 group-hover:text-primary transition-colors" />
                                                </div>
                                                <div className="text-center space-y-3">
                                                    <p className="text-2xl font-black text-white tracking-tighter uppercase tracking-[0.05em]">Перетащите фото сюда</p>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">или нажмите для загрузки (PNG, JPG)</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar Settings Area */}
                    <div className="xl:col-span-4 space-y-6">
                        <div className="bg-card/40 backdrop-blur-3xl rounded-[2.5rem] p-8 md:p-10 shadow-interstellar border border-white/10 flex flex-col gap-10 sticky top-10">
                            <div className="flex items-center gap-5 pb-8 border-b border-white/5">
                                <div className="p-4 bg-secondary/10 rounded-2xl border border-secondary/20 shadow-lg">
                                    <Settings2 className="w-6 h-6 text-secondary" />
                                </div>
                                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">
                                    Параметры дизайна
                                </h3>
                            </div>

                            {/* Aspect Ratio */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2 ml-2">
                                    Пропорции
                                </label>
                                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                                    <SelectTrigger className="bg-white/5 border-white/10 h-16 rounded-2xl text-white font-black uppercase tracking-widest text-[10px] focus:ring-secondary/20 focus:border-secondary/50 hover:bg-white/10 transition-all duration-300">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-white/10 shadow-interstellar bg-[#0f172a] text-white overflow-hidden">
                                        <SelectItem value="1:1" className="cursor-pointer font-black uppercase tracking-widest text-[9px] py-4 rounded-xl mx-2 my-1 focus:bg-white/10 focus:text-white transition-all">1:1 (Квадратный)</SelectItem>
                                        <SelectItem value="9:16" className="cursor-pointer font-black uppercase tracking-widest text-[9px] py-4 rounded-xl mx-2 my-1 focus:bg-white/10 focus:text-white transition-all">9:16 (Stories/Reels)</SelectItem>
                                        <SelectItem value="4:5" className="cursor-pointer font-black uppercase tracking-widest text-[9px] py-4 rounded-xl mx-2 my-1 focus:bg-white/10 focus:text-white transition-all">4:5 (Портретный)</SelectItem>
                                        <SelectItem value="16:9" className="cursor-pointer font-black uppercase tracking-widest text-[9px] py-4 rounded-xl mx-2 my-1 focus:bg-white/10 focus:text-white transition-all">16:9 (Горизонтальный)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Design Template */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">
                                    Шаблон стиля
                                </label>
                                <div className="grid grid-cols-1 gap-4">
                                    {[
                                        { id: 'template_1', label: 'Минимализм (Clean)', color: 'bg-white/80 border-white/20' },
                                        { id: 'template_2', label: 'Премиум Голд', color: 'bg-gradient-to-br from-amber-200 to-amber-500 border-amber-300/50' },
                                        { id: 'template_3', label: '3D Футуризм', color: 'bg-gradient-to-br from-secondary to-indigo-600 border-white/20' },
                                    ].map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setDesignTemplateId(t.id)}
                                            className={cn(
                                                "flex items-center gap-5 p-5 rounded-2xl transition-all duration-500 outline-none backdrop-blur-md",
                                                designTemplateId === t.id
                                                    ? "bg-secondary/20 border border-secondary/50 shadow-[0_0_30px_rgba(59,130,246,0.15)]"
                                                    : "bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.06]"
                                            )}
                                        >
                                            <div className={cn("w-7 h-7 rounded-lg border shadow-lg", t.color)} />
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-[0.1em]",
                                                designTemplateId === t.id ? "text-white" : "text-white/40"
                                            )}>{t.label}</span>
                                            {designTemplateId === t.id && (
                                                <CheckCircle2 className="w-5 h-5 ml-auto text-secondary animate-in zoom-in duration-300" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Visual Instructions */}
                            <div className="space-y-4 pt-2">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2 ml-2">
                                    <Palette className="w-4 h-4 text-secondary" /> Доп. инструкции
                                </label>
                                <Textarea
                                    placeholder="Опишите желаемый фон, цвета или специфичные элементы дизайна..."
                                    value={visualInstructions}
                                    onChange={(e) => setVisualInstructions(e.target.value)}
                                    className="bg-white/[0.03] border border-white/10 text-white p-6 focus-visible:ring-secondary/20 focus-visible:border-secondary/50 transition-all duration-500 resize-none rounded-2xl text-[11px] font-black uppercase tracking-widest min-h-[140px] placeholder:text-white/5 shadow-inner"
                                />
                            </div>

                            {/* Main CTA */}
                            <div className="pt-10 space-y-6 border-t border-white/5">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    className={cn(
                                        "relative overflow-hidden w-full h-20 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 group shadow-interstellar text-white border-none cursor-pointer",
                                        isLoading
                                            ? "bg-white/10 cursor-not-allowed text-white/20 shadow-none"
                                            : "bg-gradient-to-r from-primary to-secondary shadow-primary/30 hover:shadow-primary/50 hover:brightness-110 hover:-translate-y-1"
                                    )}
                                >
                                    {/* Subtle shine effect on hover */}
                                    {!isLoading && (
                                        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" />
                                    )}

                                    {isLoading ? (
                                        <div className="flex items-center justify-center gap-4">
                                            <Loader2 className="w-6 h-6 animate-spin text-white/40" />
                                            <span>Обработка...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-4 z-10 relative">
                                            <span className="drop-shadow-lg font-black tracking-[0.2em]">Запустить конвейер</span>
                                            <Rocket className="w-6 h-6 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform duration-500 drop-shadow-lg" />
                                        </div>
                                    )}
                                </Button>

                                <div className="flex items-center justify-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_15px_rgba(249,115,22,0.6)] animate-pulse" />
                                    <p className="text-[9px] text-white/30 uppercase tracking-[0.3em] font-black">
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
