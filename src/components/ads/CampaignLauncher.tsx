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
    const [accounts, setAccounts] = useState<{ id: string; name: string; adAccountId: string }[]>([]);
    const [loadingAccounts, setLoadingAccounts] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        const fetchAccounts = async () => {
            if (!projectId) return;
            setLoadingAccounts(true);
            try {
                const { data, error } = await supabase
                    .from('clients_config')
                    .select('ad_account_id, client_name')
                    .eq('project_id', projectId);

                if (error) throw error;

                setAccounts((data || []).map(d => ({
                    id: d.ad_account_id,
                    name: d.client_name || 'Без названия',
                    adAccountId: d.ad_account_id
                })));
            } catch (err) {
                console.error('Error fetching accounts:', err);
                toast.error('Не удалось загрузить рекламные аккаунты');
            } finally {
                setLoadingAccounts(false);
            }
        };

        if (isOpen) {
            fetchAccounts();
        }
    }, [projectId, isOpen]);

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

            const selectedAccount = accounts.find(a => a.id === selectedAccountId);
            const payload = {
                projectId,
                accountId: selectedAccountId,
                accountName: selectedAccount?.name,
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
                    <SheetHeader className="p-10 pb-6 border-b border-slate-100 bg-white/40 backdrop-blur-md">
                        <div className="flex items-center gap-6">
                            <motion.div
                                whileHover={{ scale: 1.05, rotate: 5 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_8px_30px_rgb(16,185,129,0.12)]"
                            >
                                <Rocket className="w-10 h-10 text-emerald-600" />
                            </motion.div>
                            <div className="flex flex-col gap-1.5">
                                <SheetTitle className="text-3xl font-extrabold tracking-tight text-slate-900">Запуск кампании</SheetTitle>
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600/80">Система готова к запуску</span>
                                </div>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
                        <form id="campaign-launch-form" onSubmit={handleSubmit} className="space-y-10">
                            {/* Account Selection */}
                            <div className="space-y-4">
                                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                    <Globe className="w-3.5 h-3.5 text-primary" /> Рекламный аккаунт
                                </Label>
                                <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                                    <SelectTrigger className="bg-white/50 border-slate-200/60 h-16 rounded-2xl transition-all hover:bg-white hover:border-primary/30 focus:ring-primary/10 text-foreground font-semibold shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                                        <SelectValue placeholder={loadingAccounts ? "Загрузка..." : "Выберите аккаунт для запуска"} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200 rounded-2xl shadow-2xl backdrop-blur-xl">
                                        {accounts.length === 0 && !loadingAccounts ? (
                                            <SelectItem value="none" disabled className="py-4 text-center text-muted-foreground">Аккаунты не найдены</SelectItem>
                                        ) : (
                                            accounts.map((acc) => (
                                                <SelectItem key={acc.id} value={acc.id} className="py-4 font-bold uppercase text-[10px] tracking-widest cursor-pointer hover:bg-primary/5">
                                                    {acc.name} <span className="ml-2 opacity-40 font-normal">({acc.adAccountId})</span>
                                                </SelectItem>
                                            ))
                                        )}
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
                                    <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                        <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Дневной бюджет ($)
                                    </Label>
                                    <div className="relative group/budget">
                                        <Input
                                            type="number"
                                            placeholder="50"
                                            value={budget}
                                            onChange={(e) => setBudget(e.target.value)}
                                            className="bg-white border-slate-200/60 h-16 rounded-2xl text-xl font-bold text-slate-900 pl-12 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all shadow-[0_2px_15px_rgba(0,0,0,0.02)]"
                                            min="5"
                                        />
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-emerald-500/40 text-lg transition-colors group-focus-within/budget:text-emerald-500">$</span>
                                    </div>
                                </div>
                            </div>

                            {/* Geography */}
                            <div className="space-y-4">
                                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-primary" /> География (Город)
                                </Label>
                                <Select value={city} onValueChange={setCity}>
                                    <SelectTrigger className="bg-white/50 border-slate-200/60 h-16 rounded-2xl text-foreground font-semibold shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200 rounded-2xl shadow-2xl">
                                        <SelectItem value="Алматы" className="py-4 font-bold uppercase text-[10px] tracking-widest">Алматы (Almaty)</SelectItem>
                                        <SelectItem value="Астана" className="py-4 font-bold uppercase text-[10px] tracking-widest">Астана (Astana)</SelectItem>
                                        <SelectItem value="Павлодар" className="py-4 font-bold uppercase text-[10px] tracking-widest">Павлодар (Pavlodar)</SelectItem>
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
                                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                    <Upload className="w-3.5 h-3.5 text-emerald-500" /> Рекламный креатив
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

                    <div className="p-10 border-t border-slate-100 bg-white/40 backdrop-blur-md">
                        <Button
                            form="campaign-launch-form"
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-24 rounded-3xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-[0_20px_50px_rgba(16,185,129,0.2)] transition-all relative overflow-hidden group border-0"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />

                            {isSubmitting ? (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="flex items-center gap-4">
                                        <Loader2 className="w-8 h-8 animate-spin" />
                                        <span className="text-2xl font-black uppercase tracking-tight">
                                            {uploadProgress < 100 ? `СИНХРОНИЗАЦИЯ...` : 'ЗАПУСК...'}
                                        </span>
                                    </div>
                                    <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-white"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-8">
                                    <motion.div
                                        animate={{ y: [0, -5, 0] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                    >
                                        <Rocket className="w-10 h-10" />
                                    </motion.div>
                                    <div className="flex flex-col items-start">
                                        <span className="text-2xl font-black uppercase tracking-tight leading-none">🚀 ЗАПУСТИТЬ РЕКЛАМУ</span>
                                        <span className="text-xs font-bold uppercase tracking-widest opacity-70 mt-1">ОТПРАВИТЬ НА ПРОВЕРКУ</span>
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
