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
            <SheetContent className="sm:max-w-xl overflow-y-auto bg-background/95 backdrop-blur-xl border-l border-white/10 shadow-2xl">
                <SheetHeader className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                            <Rocket className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <SheetTitle className="text-2xl font-bold">Запуск новой кампании</SheetTitle>
                            <SheetDescription>
                                Заполните параметры, чтобы отправить креатив в систему запуска.
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Account Selection */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Globe className="w-3.5 h-3.5" /> Выбор кабинета
                        </Label>
                        <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                            <SelectTrigger className="bg-muted/50 border-border/50 h-12 rounded-xl focus:ring-primary/20">
                                <SelectValue placeholder="Выберите рекламный кабинет" />
                            </SelectTrigger>
                            <SelectContent>
                                {accounts.map((acc) => (
                                    <SelectItem key={acc.accountId} value={acc.accountId}>
                                        {acc.accountName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Objective */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Target className="w-3.5 h-3.5" /> Цель кампании
                            </Label>
                            <Select value={objective} onValueChange={setObjective}>
                                <SelectTrigger className="bg-muted/50 border-border/50 h-12 rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="whatsapp">💬 WhatsApp Сообщения</SelectItem>
                                    <SelectItem value="traffic">🔗 Трафик на сайт</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Budget */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <DollarSign className="w-3.5 h-3.5" /> Дневной бюджет (₸)
                            </Label>
                            <Input
                                type="number"
                                placeholder="Напр. 5000"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                className="bg-muted/50 border-border/50 h-12 rounded-xl"
                                min="500"
                            />
                        </div>
                    </div>

                    {/* Geography */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5" /> География / Город
                        </Label>
                        <Select value={city} onValueChange={setCity}>
                            <SelectTrigger className="bg-muted/50 border-border/50 h-12 rounded-xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Алматы">Алматы</SelectItem>
                                <SelectItem value="Астана">Астана</SelectItem>
                                <SelectItem value="Шымкент">Шымкент</SelectItem>
                                <SelectItem value="Караганда">Караганда</SelectItem>
                                <SelectItem value="Весь Казахстан">Весь Казахстан</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Start Time */}
                    <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" /> Время старта
                        </Label>
                        <RadioGroup value={startTime} onValueChange={setStartTime} className="flex gap-4">
                            <div className="flex items-center space-x-2 bg-muted/30 px-4 py-3 rounded-xl border border-border/30 hover:bg-muted/50 transition-colors flex-1">
                                <RadioGroupItem value="now" id="now" />
                                <Label htmlFor="now" className="cursor-pointer">Сейчас</Label>
                            </div>
                            <div className="flex items-center space-x-2 bg-muted/30 px-4 py-3 rounded-xl border border-border/30 hover:bg-muted/50 transition-colors flex-1">
                                <RadioGroupItem value="midnight" id="midnight" />
                                <Label htmlFor="midnight" className="cursor-pointer">С 00:00 завтра</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Creative Uploader */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Upload className="w-3.5 h-3.5" /> Креатив (Фото или Видео)
                        </Label>

                        <AnimatePresence mode="wait">
                            {!file ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer rounded-2xl p-8 transition-all flex flex-col items-center justify-center gap-3"
                                >
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Upload className="w-6 h-6 text-primary" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-semibold">Выберите файл или перетащите</p>
                                        <p className="text-xs text-muted-foreground mt-1">MP4, JPG или PNG (до 50MB)</p>
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
                                    className="relative rounded-2xl overflow-hidden border border-border aspect-video bg-muted flex items-center justify-center"
                                >
                                    {file.type.startsWith('image/') ? (
                                        <img src={previewUrl!} alt="Preview" className="w-full h-full object-contain" />
                                    ) : (
                                        <video src={previewUrl!} className="w-full h-full object-contain" controls />
                                    )}
                                    <button
                                        type="button"
                                        onClick={clearFile}
                                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                        <p className="text-xs text-white truncate font-medium">{file.name}</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <SheetFooter className="mt-8">
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-14 rounded-xl text-lg font-bold gap-3 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {uploadProgress < 100 ? `Загрузка... ${uploadProgress}%` : 'Отправка...'}
                                </>
                            ) : (
                                <>
                                    <Rocket className="w-5 h-5" />
                                    🚀 Отправить рекламный креатив
                                </>
                            )}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
};
