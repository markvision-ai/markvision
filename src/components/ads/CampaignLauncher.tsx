import { useState, useRef, useEffect } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useAgencyAnalytics } from '@/hooks/useAgencyAnalytics';
import { toast } from 'sonner';
import { Upload, X, Loader2, Rocket, Globe, MapPin, Target, DollarSign, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface CampaignLauncherProps {
    projectId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export const CampaignLauncher = ({ projectId, isOpen, onClose }: CampaignLauncherProps) => {
    const { metrics: accounts } = useAgencyAnalytics(projectId, {});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Form State
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');
    const [objective, setObjective] = useState<string>('whatsapp');
    const [budget, setBudget] = useState<string>('');
    const [city, setCity] = useState<string>('Алматы');
    const [startTime, setStartTime] = useState<string>('now');
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };

    const clearFile = () => {
        setFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedAccountId || !budget || !file) {
            toast.error('Пожалуйста, заполните все обязательные поля и загрузите креатив');
            return;
        }

        setIsSubmitting(true);
        setUploadProgress(10);

        try {
            // 1. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${projectId}/${fileName}`;

            setUploadProgress(30);
            const { error: uploadError, data } = await supabase.storage
                .from('ad-creatives')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            setUploadProgress(60);

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('ad-creatives')
                .getPublicUrl(filePath);

            setUploadProgress(80);

            // 3. Send to n8n Webhook
            const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
            if (!webhookUrl) throw new Error('VITE_N8N_WEBHOOK_URL is not defined');

            const payload = {
                projectId,
                accountId: selectedAccountId,
                accountName: accounts.find(a => a.accountId === selectedAccountId)?.accountName,
                objective,
                budget: Number(budget),
                city,
                startTime: startTime === 'now' ? 'immediately' : 'midnight',
                mediaUrl: publicUrl,
                timestamp: new Date().toISOString()
            };

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to send data to webhook');

            setUploadProgress(100);
            toast.success('Креатив отправлен на проверку. Кампания скоро будет запущена!');
            onClose();

            // Reset form
            setSelectedAccountId('');
            setBudget('');
            clearFile();

        } catch (error: any) {
            console.error('Campaign launch error:', error);
            toast.error(`Ошибка при запуске: ${error.message}`);
        } finally {
            setIsSubmitting(false);
            setUploadProgress(0);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-xl p-0 border-l border-border bg-card shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Decorative Header Background */}
                <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

                <div className="relative z-10 flex flex-col h-full">
                    <SheetHeader className="p-8 pb-4 border-b border-border bg-muted/30">
                        <div className="flex items-center gap-6">
                            <motion.div
                                initial={{ rotate: -20, scale: 0.8 }}
                                animate={{ rotate: 0, scale: 1 }}
                                className="w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm"
                            >
                                <Rocket className="w-8 h-8 text-primary" />
                            </motion.div>
                            <div className="flex flex-col gap-1">
                                <SheetTitle className="text-2xl font-bold tracking-tight text-foreground">Запуск кампании</SheetTitle>
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Система готова к запуску</span>
                                </div>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                        <form id="campaign-launch-form" onSubmit={handleSubmit} className="space-y-8">
                            {/* Account Selection */}
                            <div className="space-y-4">
                                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                    <Globe className="w-3.5 h-3.5 text-primary" /> Рекламный аккаунт
                                </Label>
                                <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                                    <SelectTrigger className="bg-muted border-border h-14 rounded-[1.5rem] transition-all hover:bg-muted/80 focus:ring-primary/20 text-foreground font-medium shadow-sm">
                                        <SelectValue placeholder="Выберите аккаунт для запуска" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border rounded-2xl shadow-xl">
                                        {accounts.map((acc) => (
                                            <SelectItem key={acc.accountId} value={acc.accountId} className="py-4 font-bold uppercase text-[10px] tracking-widest cursor-pointer">
                                                {acc.accountName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                {/* Objective */}
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                        <Target className="w-3.5 h-3.5 text-primary" /> Цель кампании
                                    </Label>
                                    <Select value={objective} onValueChange={setObjective}>
                                        <SelectTrigger className="bg-muted border-border h-14 rounded-[1.5rem] text-foreground font-medium shadow-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-border rounded-2xl shadow-xl">
                                            <SelectItem value="whatsapp" className="py-4 font-bold uppercase text-[10px] tracking-widest text-emerald-600">💬 Telegram/WA Директ</SelectItem>
                                            <SelectItem value="traffic" className="py-4 font-bold uppercase text-[10px] tracking-widest text-blue-600">🔗 Трафик на сайт</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Budget */}
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                        <DollarSign className="w-3.5 h-3.5 text-primary" /> Дневной бюджет (₸)
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            placeholder="5 000"
                                            value={budget}
                                            onChange={(e) => setBudget(e.target.value)}
                                            className="bg-muted border-border h-14 rounded-[1.5rem] text-xl font-bold text-foreground pl-10 focus:ring-primary/20 pr-4 shadow-sm"
                                            min="500"
                                        />
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-50" />
                                    </div>
                                </div>
                            </div>

                            {/* Geography */}
                            <div className="space-y-4">
                                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-primary" /> География (Город)
                                </Label>
                                <Select value={city} onValueChange={setCity}>
                                    <SelectTrigger className="bg-muted border-border h-14 rounded-[1.5rem] text-foreground font-medium shadow-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border rounded-2xl shadow-xl">
                                        <SelectItem value="Алматы" className="py-4 font-bold uppercase text-[10px] tracking-widest">Алматы</SelectItem>
                                        <SelectItem value="Астана" className="py-4 font-bold uppercase text-[10px] tracking-widest">Астана</SelectItem>
                                        <SelectItem value="Шымкент" className="py-4 font-bold uppercase text-[10px] tracking-widest">Шымкент</SelectItem>
                                        <SelectItem value="Караганда" className="py-4 font-bold uppercase text-[10px] tracking-widest">Караганда</SelectItem>
                                        <SelectItem value="Весь Казахстан" className="py-4 font-bold uppercase text-[10px] tracking-widest text-primary">Весь Казахстан</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Start Time */}
                            <div className="space-y-4">
                                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5 text-primary" /> Расписание запуска
                                </Label>
                                <RadioGroup value={startTime} onValueChange={setStartTime} className="grid grid-cols-2 gap-4">
                                    <div
                                        onClick={() => setStartTime('now')}
                                        className={cn(
                                            "flex items-center space-x-3 px-6 py-5 rounded-[1.5rem] border transition-all cursor-pointer group shadow-sm",
                                            startTime === 'now' ? "bg-primary/5 border-primary/30" : "bg-muted/50 border-border hover:bg-muted"
                                        )}
                                    >
                                        <RadioGroupItem value="now" id="now" className="border-primary" />
                                        <div className="flex flex-col">
                                            <Label htmlFor="now" className="font-bold text-[10px] uppercase tracking-widest text-foreground cursor-pointer group-hover:text-primary transition-colors">Сразу</Label>
                                            <span className="text-[8px] uppercase tracking-widest text-muted-foreground">В течение часа</span>
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => setStartTime('midnight')}
                                        className={cn(
                                            "flex items-center space-x-3 px-6 py-5 rounded-[1.5rem] border transition-all cursor-pointer group shadow-sm",
                                            startTime === 'midnight' ? "bg-primary/5 border-primary/30" : "bg-muted/50 border-border hover:bg-muted"
                                        )}
                                    >
                                        <RadioGroupItem value="midnight" id="midnight" className="border-primary" />
                                        <div className="flex flex-col">
                                            <Label htmlFor="midnight" className="font-bold text-[10px] uppercase tracking-widest text-foreground cursor-pointer group-hover:text-primary transition-colors">Завтра</Label>
                                            <span className="text-[8px] uppercase tracking-widest text-muted-foreground">В 00:00 завтра</span>
                                        </div>
                                    </div>
                                </RadioGroup>
                            </div>

                            {/* Creative Uploader */}
                            <div className="space-y-4">
                                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                    <Upload className="w-3.5 h-3.5 text-primary" /> Рекламный креатив
                                </Label>

                                <AnimatePresence mode="wait">
                                    {!file ? (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            onClick={() => fileInputRef.current?.click()}
                                            className="group relative overflow-hidden border-2 border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 cursor-pointer rounded-[2rem] p-12 transition-all flex flex-col items-center justify-center gap-4 bg-white/[0.01] shadow-inner"
                                        >
                                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="w-20 h-20 rounded-[2rem] bg-muted border border-border flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                                <Upload className="w-10 h-10 text-primary animate-bounce" />
                                            </div>
                                            <div className="text-center relative z-10">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-foreground">Загрузить файл</p>
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-2">MP4 / JPG / PNG (До 50МБ)</p>
                                            </div>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="video/*,image/*"
                                                onChange={handleFileChange}
                                            />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="relative rounded-[2rem] overflow-hidden border border-border aspect-video bg-black flex items-center justify-center shadow-xl group"
                                        >
                                            {file.type.startsWith('image/') ? (
                                                <img src={previewUrl!} alt="Preview" className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105" />
                                            ) : (
                                                <video src={previewUrl!} className="w-full h-full object-contain" controls />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <motion.button
                                                whileHover={{ scale: 1.1, rotate: 90 }}
                                                whileTap={{ scale: 0.9 }}
                                                type="button"
                                                onClick={clearFile}
                                                className="absolute top-4 right-4 w-10 h-10 rounded-2xl bg-red-500 text-white flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.5)] z-20"
                                            >
                                                <X className="w-5 h-5" />
                                            </motion.button>
                                            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-white truncate drop-shadow-md">{file.name}</p>
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-white bg-black/40 px-2 py-1 rounded backdrop-blur-md">Готово</span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </form>
                    </div>

                    <div className="p-8 border-t border-border bg-muted/30">
                        <Button
                            form="campaign-launch-form"
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-20 rounded-[2rem] bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />

                            {isSubmitting ? (
                                <div className="flex flex-col items-center gap-1">
                                    <div className="flex items-center gap-3">
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        <span className="text-xl font-bold uppercase tracking-tight">
                                            {uploadProgress < 100 ? `Синхронизация...` : 'Запуск кампании...'}
                                        </span>
                                    </div>
                                    <div className="w-32 h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
                                        <motion.div
                                            className="h-full bg-white"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-6">
                                    <Rocket className="w-8 h-8 group-hover:animate-bounce" />
                                    <div className="flex flex-col items-start translate-y-0.5">
                                        <span className="text-xl font-bold uppercase tracking-tight leading-none">🚀 ЗАПУСТИТЬ РЕКЛАМУ</span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Отправить на проверку</span>
                                    </div>
                                </div>
                            )}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};
