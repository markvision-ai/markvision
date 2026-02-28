import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Instagram,
    Youtube,
    Globe,
    Send,
    Layout,
    FileVideo,
    FileImage,
    Calendar,
    Clock,
    ArrowRight,
    ArrowLeft,
    Check,
    ChevronRight,
    Sparkles,
    Zap,
    Cpu,
    UploadCloud,
    X,
    Loader2,
    Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PostCreatorWizardProps {
    onClose: () => void;
    onSuccess: () => void;
}

type Step = 'protocol' | 'payload' | 'temporal';

const platforms = [
    { id: 'instagram', name: 'Инстаграм', icon: Instagram, color: 'text-pink-500', glow: 'shadow-pink-500/20' },
    { id: 'tiktok', name: 'ТикТок', icon: ({ className }: any) => <div className={cn("font-bold text-xs px-1 text-foreground", className)}>TT</div>, color: 'text-slate-800', glow: 'shadow-slate-500/20' },
    { id: 'youtube', name: 'Ютуб', icon: Youtube, color: 'text-red-500', glow: 'shadow-red-500/20' },
    { id: 'threads', name: 'Тредс', icon: ({ className }: any) => <div className={cn("font-bold text-lg text-foreground", className)}>@</div>, color: 'text-slate-800', glow: 'shadow-slate-500/20' },
    { id: 'telegram', name: 'Телеграм', icon: Send, color: 'text-sky-500', glow: 'shadow-sky-500/20' },
    { id: 'site', name: 'Сайт', icon: Globe, color: 'text-blue-500', glow: 'shadow-blue-500/20' },
];

const contentTypes = [
    { id: 'post', name: 'Пост', icon: Layout },
    { id: 'reels', name: 'Reels / Shorts', icon: FileVideo },
    { id: 'stories', name: 'Stories', icon: Send },
];

export const PostCreatorWizard = ({ onClose, onSuccess }: PostCreatorWizardProps) => {
    const [step, setStep] = useState<Step>('protocol');
    const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const [media, setMedia] = useState<File | null>(null);
    const [scheduledAt, setScheduledAt] = useState('');
    const [posting, setPosting] = useState(false);

    const handleNext = () => {
        if (step === 'protocol' && selectedPlatform && selectedType) setStep('payload');
        else if (step === 'payload' && (caption || media)) setStep('temporal');
    };

    const handleBack = () => {
        if (step === 'payload') setStep('protocol');
        else if (step === 'temporal') setStep('payload');
    };

    const handleSubmit = async () => {
        setPosting(true);
        // Simulate API call
        setTimeout(() => {
            setPosting(false);
            toast.success("Контент успешно запланирован!");
            onSuccess();
            onClose();
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-md" onClick={onClose} />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-4xl bg-white/10 border border-white/80 rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-3xl relative z-10 flex flex-col md:flex-row h-[85vh] md:h-auto md:min-h-[600px]"
            >
                {/* Sidebar Status */}
                <div className="w-full md:w-64 bg-white/5/50 border-r border-slate-100 p-8 flex flex-col gap-8">
                    <div className="space-y-1">
                        <h2 className="text-xl font-black text-foreground uppercase tracking-tighter italic">Создание</h2>
                        <div className="h-0.5 w-12 bg-primary" />
                    </div>

                    <div className="space-y-6">
                        {[
                            { id: 'protocol', label: 'Каналы', icon: Cpu },
                            { id: 'payload', label: 'Контент', icon: Zap },
                            { id: 'temporal', label: 'Время', icon: Clock },
                        ].map((s, idx) => {
                            const isActive = step === s.id;
                            const isCompleted = (step === 'payload' && idx === 0) || (step === 'temporal' && idx < 2);

                            return (
                                <div key={s.id} className="flex items-center gap-4 group">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-500 shadow-sm",
                                        isActive ? "bg-primary text-primary-foreground border-primary scale-110 shadow-md" :
                                            isCompleted ? "bg-blue-500/10 border-blue-500/20 text-blue-500" :
                                                "bg-white border-slate-200 text-muted-foreground"
                                    )}>
                                        {isCompleted ? <Check className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={cn(
                                            "text-[10px] uppercase tracking-[0.2em] font-bold",
                                            isActive ? "text-primary" : isCompleted ? "text-blue-500" : "text-muted-foreground/50"
                                        )}>Шаг 0{idx + 1}</span>
                                        <span className={cn(
                                            "text-sm font-bold tracking-tight",
                                            isActive ? "text-foreground" : "text-muted-foreground"
                                        )}>{s.label}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-auto hidden md:block">
                        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-2">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest">
                                <Sparkles className="w-3 h-3" />
                                ИИ-Помощник
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                ИИ готов оптимизировать ваш контент для максимального охвата и вовлеченности.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col min-h-0 bg-white">
                    <div className="p-8 flex justify-between items-center border-b border-slate-100">
                        <h3 className="text-lg font-bold text-foreground uppercase tracking-wider flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            {step === 'protocol' ? 'Выберите площадку' : step === 'payload' ? 'Подготовьте контент' : 'Настройка времени'}
                        </h3>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10 text-muted-foreground hover:text-foreground">
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="flex-1 p-8 overflow-y-auto overflow-x-hidden custom-scrollbar">
                        <AnimatePresence mode="wait">
                            {step === 'protocol' && (
                                <motion.div
                                    key="protocol"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-10"
                                >
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] font-mono">Выберите канал</label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                            {platforms.map((p) => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => setSelectedPlatform(p.id)}
                                                    className={cn(
                                                        "p-6 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-4 group relative overflow-hidden",
                                                        selectedPlatform === p.id
                                                            ? "bg-primary/5 border-primary shadow-sm"
                                                            : "bg-white border-slate-200 hover:bg-white/5 hover:border-slate-300"
                                                    )}
                                                >
                                                    {selectedPlatform === p.id && (
                                                        <div className="absolute -right-2 -top-2 w-12 h-12 bg-primary/10 blur-xl rounded-full" />
                                                    )}
                                                    <p.icon className={cn("w-8 h-8 transition-all duration-500 group-hover:scale-110", p.color, selectedPlatform === p.id ? "drop-shadow-[0_0_10px_currentColor]" : "grayscale opacity-50")} />
                                                    <span className={cn(
                                                        "text-xs font-bold uppercase tracking-widest",
                                                        selectedPlatform === p.id ? "text-foreground" : "text-muted-foreground"
                                                    )}>{p.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] font-mono">Формат публикации</label>
                                        <div className="flex flex-wrap gap-4">
                                            {contentTypes.map((t) => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => setSelectedType(t.id)}
                                                    className={cn(
                                                        "px-6 py-4 rounded-xl border transition-all duration-300 flex items-center gap-3 group shadow-sm",
                                                        selectedType === t.id
                                                            ? "bg-primary text-primary-foreground border-primary shadow-md"
                                                            : "bg-white border-slate-200 hover:bg-white/5 text-muted-foreground hover:text-foreground"
                                                    )}
                                                >
                                                    <t.icon className="w-5 h-5" />
                                                    <span className="text-xs font-bold uppercase tracking-wider">{t.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 'payload' && (
                                <motion.div
                                    key="payload"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] font-mono">Медиафайлы</label>
                                        <div className="relative group">
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 blur transition duration-500" />
                                            <div className="relative h-48 rounded-2xl border-2 border-dashed border-slate-300/50 bg-white/5 flex flex-col items-center justify-center p-8 transition-all group-hover:bg-white/10/50 group-hover:border-primary/50 shadow-sm">
                                                <UploadCloud className="w-12 h-12 text-primary/60 mb-4 animate-bounce" />
                                                <p className="text-sm font-bold text-foreground mb-2">Перетяните файлы сюда</p>
                                                <p className="text-xs text-muted-foreground">Поддерживаются MP4, MOV, PNG, JPG (Макс 50МБ)</p>
                                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setMedia(e.target.files?.[0] || null)} />
                                            </div>
                                        </div>
                                        {media && (
                                            <div className="flex items-center justify-between p-4 bg-white border border-slate-200 shadow-sm rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                                        {media.type.includes('video') ? <FileVideo className="w-4 h-4" /> : <FileImage className="w-4 h-4" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-foreground truncate max-w-[200px]">{media.name}</p>
                                                        <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">{(media.size / 1024 / 1024).toFixed(2)} MB</p>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon" onClick={() => setMedia(null)} className="h-8 w-8 text-muted-foreground hover:text-red-500">
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] font-mono">Текст публикации</label>
                                        <div className="relative group">
                                            <div className="absolute -inset-0.5 bg-primary/5 rounded-2xl opacity-0 group-focus-within:opacity-100 blur transition duration-300" />
                                            <Textarea
                                                value={caption}
                                                onChange={(e) => setCaption(e.target.value)}
                                                placeholder="Введите текст вашего сообщения..."
                                                className="relative min-h-[150px] bg-white border-slate-200 focus:border-primary/50 shadow-sm rounded-2xl text-foreground placeholder:text-muted-foreground/50 resize-none transition-all p-6"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 'temporal' && (
                                <motion.div
                                    key="temporal"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-12 py-10"
                                >
                                    <div className="text-center space-y-4">
                                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border border-primary/20 text-primary mb-2 shadow-sm">
                                            <Clock className="w-10 h-10" />
                                        </div>
                                        <h4 className="text-2xl font-black text-foreground uppercase tracking-tighter">Выбор времени</h4>
                                        <p className="text-muted-foreground max-w-sm mx-auto text-sm font-light leading-relaxed">
                                            Выберите точное время для выхода публикации в эфир.
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-center gap-6">
                                        <div className="w-full max-w-sm space-y-4">
                                            <div className="relative group">
                                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                                <Input
                                                    type="datetime-local"
                                                    value={scheduledAt}
                                                    onChange={(e) => setScheduledAt(e.target.value)}
                                                    className="h-14 pl-12 bg-white border-slate-200 focus:border-primary focus:ring-primary/20 rounded-xl text-foreground font-mono shadow-sm"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2 px-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Прямая синхронизация активна</span>
                                            </div>
                                        </div>

                                        <div className="h-px w-full max-w-[100px] bg-white/20" />

                                        <Button
                                            className="bg-white hover:bg-white/5 text-foreground border border-slate-200 shadow-sm h-12 px-8 rounded-xl font-bold uppercase tracking-widest text-[10px]"
                                            onClick={() => setScheduledAt(new Date().toISOString().slice(0, 16))}
                                        >
                                            Опубликовать сейчас
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="p-8 border-t border-slate-100 flex items-center justify-between bg-white/5/80 backdrop-blur-sm">
                        <Button
                            variant="ghost"
                            onClick={step === 'protocol' ? onClose : handleBack}
                            className="h-12 px-6 rounded-xl text-muted-foreground hover:text-foreground"
                        >
                            {step === 'protocol' ? 'Отмена' : (
                                <>
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Назад
                                </>
                            )}
                        </Button>

                        <div className="flex items-center gap-4">
                            <Button
                                onClick={step === 'temporal' ? handleSubmit : handleNext}
                                disabled={
                                    (step === 'protocol' && (!selectedPlatform || !selectedType)) ||
                                    (step === 'payload' && !caption && !media) ||
                                    posting
                                }
                                className={cn(
                                    "h-14 px-10 rounded-2xl font-black uppercase tracking-widest transition-all duration-500 group relative overflow-hidden shadow-sm",
                                    posting ? "bg-primary/50 text-primary-foreground cursor-wait" : "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] active:scale-95"
                                )}
                            >
                                <span className="relative z-10 flex items-center">
                                    {posting ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : step === 'temporal' ? <Check className="w-5 h-5 mr-2" /> : <ChevronRight className="w-5 h-5 mr-1" />}
                                    {posting ? 'Загрузка...' : step === 'temporal' ? 'Запланировать' : 'Далее'}
                                </span>
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
