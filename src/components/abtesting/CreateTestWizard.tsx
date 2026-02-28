import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FlaskConical, Globe, Video, Type, Users, ChevronRight, ChevronLeft, Sparkles, Scale, Target } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming cn utility exists

interface CreateTestWizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: any) => Promise<void>;
}

const STEPS = [
    { id: 'type', title: 'Тип теста' },
    { id: 'details', title: 'Детали' },
    { id: 'variants', title: 'Варианты' },
    { id: 'settings', title: 'Настройки' }
];

const TEST_CATEGORIES = [
    { value: 'page', label: 'Страница', icon: Globe, description: 'Тестирование элементов страницы' },
    { value: 'creative', label: 'Креатив', icon: Video, description: 'Сравнение объявлений Facebook Ads' },
    { value: 'copy', label: 'Текст', icon: Type, description: 'Тестирование текстов объявлений' },
    { value: 'audience', label: 'Аудитория', icon: Users, description: 'Сравнение таргетингов' },
];

export const CreateTestWizard: React.FC<CreateTestWizardProps> = ({ open, onOpenChange, onSubmit }) => {
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        hypothesis: '',
        test_category: 'page',
        page_path: '',
        variant_a_name: 'Контроль',
        variant_b_name: 'Вариант Б',
        variant_a_title: '',
        variant_b_title: '',
        variant_a_text: '',
        variant_b_text: '',
        facebook_ad_a_id: '',
        facebook_ad_b_id: '',
        facebook_adset_a_id: '',
        facebook_adset_b_id: '',
        min_sample_size: 1000,
        auto_winner_threshold: 95,
        traffic_allocation: 50
    });

    const handleNext = () => {
        if (step < STEPS.length - 1) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 0) setStep(step - 1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await onSubmit(formData);
            onOpenChange(false);
            setStep(0);
            setFormData({ // Reset form
                name: '',
                description: '',
                hypothesis: '',
                test_category: 'page',
                page_path: '',
                variant_a_name: 'Контроль',
                variant_b_name: 'Вариант Б',
                variant_a_title: '',
                variant_b_title: '',
                variant_a_text: '',
                variant_b_text: '',
                facebook_ad_a_id: '',
                facebook_ad_b_id: '',
                facebook_adset_a_id: '',
                facebook_adset_b_id: '',
                min_sample_size: 1000,
                auto_winner_threshold: 95,
                traffic_allocation: 50
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-[#020617]/95 backdrop-blur-2xl shadow-interstellar border border-white/10 sm:max-w-[700px] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl text-foreground font-black uppercase tracking-tight">
                        <FlaskConical className="w-5 h-5 text-blue-400" />
                        Создать A/B тест
                    </DialogTitle>
                </DialogHeader>

                {/* Progress Steps */}
                <div className="flex items-center justify-between px-2 mb-8 relative">
                    <div className="absolute left-0 top-4 w-full h-[1px] bg-white/5 -z-10" />
                    {STEPS.map((s, i) => (
                        <div key={s.id} className="flex flex-col items-center gap-2 bg-transparent px-2 z-10">
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all border",
                                i <= step ? "bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]" : "bg-[#020617] border-white/10 text-muted-foreground"
                            )}>
                                {i + 1}
                            </div>
                            <span className={cn("text-[8px] uppercase font-black tracking-widest", i <= step ? "text-blue-400" : "text-muted-foreground opacity-40")}>{s.title}</span>
                        </div>
                    ))}
                </div>

                <div className="py-2 min-h-[300px]">
                    {/* STEP 1: TYPE */}
                    {step === 0 && (
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            {TEST_CATEGORIES.map((cat) => {
                                const Icon = cat.icon;
                                const isSelected = formData.test_category === cat.value;
                                return (
                                    <button
                                        key={cat.value}
                                        onClick={() => updateField('test_category', cat.value)}
                                        className={cn(
                                            "p-5 rounded-2xl border transition-all text-left flex flex-col gap-4 group hover:scale-[1.02] duration-300",
                                            isSelected
                                                ? "border-blue-500/50 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                                                : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                                        )}
                                    >
                                        <div className={cn("p-2.5 rounded-xl w-fit transition-colors", isSelected ? "bg-blue-600 text-white" : "bg-white/5 text-foreground group-hover:bg-white/10")}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-black text-foreground text-sm uppercase tracking-tight mb-1">{cat.label}</div>
                                            <div className="text-[10px] text-muted-foreground font-medium leading-relaxed opacity-60">{cat.description}</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* STEP 2: DETAILS */}
                    {step === 1 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Название теста</Label>
                                <Input
                                    value={formData.name}
                                    onChange={e => updateField('name', e.target.value)}
                                    placeholder="Например: Тест заголовка на главной"
                                    className="bg-white/5 border-white/10 text-foreground focus:ring-1 focus:ring-blue-500/30 h-12 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Гипотеза</Label>
                                <Textarea
                                    value={formData.hypothesis}
                                    onChange={e => updateField('hypothesis', e.target.value)}
                                    placeholder="Если мы изменим X, то метрика Y увеличится, потому что Z..."
                                    className="bg-white/5 border-white/10 text-foreground focus:ring-1 focus:ring-blue-500/30 min-h-[120px] rounded-xl"
                                />
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2 opacity-40 px-1">
                                    <Sparkles className="w-3 h-3 text-blue-400" />
                                    Четкая гипотеза повышает качество теста
                                </p>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: VARIANTS */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-2 gap-6">
                                {/* Variant A */}
                                <div className="space-y-4 p-5 rounded-2xl border border-white/10 bg-white/5 shadow-inner">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-black border border-blue-500/20 shadow-sm">A</div>
                                        <h4 className="font-black text-foreground uppercase text-xs tracking-widest">Контроль</h4>
                                    </div>
                                    <div className="space-y-4">
                                        <Label className="text-[9px] uppercase text-muted-foreground font-black tracking-widest px-1">Название</Label>
                                        <Input
                                            value={formData.variant_a_name}
                                            onChange={e => updateField('variant_a_name', e.target.value)}
                                            className="bg-white/5 border-white/10 text-foreground h-11 rounded-lg"
                                        />
                                        {formData.test_category === 'page' && (
                                            <>
                                                <Label className="text-[9px] uppercase text-muted-foreground font-black tracking-widest px-1">Заголовок</Label>
                                                <Input
                                                    value={formData.variant_a_title}
                                                    onChange={e => updateField('variant_a_title', e.target.value)}
                                                    className="bg-white/5 border-white/10 text-foreground h-11 rounded-lg"
                                                />
                                            </>
                                        )}
                                        {(formData.test_category === 'creative' || formData.test_category === 'audience') && (
                                            <>
                                                <Label className="text-[9px] uppercase text-muted-foreground font-black tracking-widest px-1">Facebook ID</Label>
                                                <Input
                                                    value={formData.test_category === 'creative' ? formData.facebook_ad_a_id : formData.facebook_adset_a_id}
                                                    onChange={e => updateField(formData.test_category === 'creative' ? 'facebook_ad_a_id' : 'facebook_adset_a_id', e.target.value)}
                                                    placeholder="123456..."
                                                    className="bg-white/5 border-white/10 text-foreground h-11 rounded-lg font-mono text-[10px]"
                                                />
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Variant B */}
                                <div className="space-y-4 p-5 rounded-2xl border border-white/10 bg-white/5 shadow-inner">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center text-xs font-black border border-purple-500/20 shadow-sm">B</div>
                                        <h4 className="font-black text-foreground uppercase text-xs tracking-widest">Вариант</h4>
                                    </div>
                                    <div className="space-y-4">
                                        <Label className="text-[9px] uppercase text-muted-foreground font-black tracking-widest px-1">Название</Label>
                                        <Input
                                            value={formData.variant_b_name}
                                            onChange={e => updateField('variant_b_name', e.target.value)}
                                            className="bg-white/5 border-white/10 text-foreground h-11 rounded-lg"
                                        />
                                        {formData.test_category === 'page' && (
                                            <>
                                                <Label className="text-[9px] uppercase text-muted-foreground font-black tracking-widest px-1">Заголовок</Label>
                                                <Input
                                                    value={formData.variant_b_title}
                                                    onChange={e => updateField('variant_b_title', e.target.value)}
                                                    className="bg-white/5 border-white/10 text-foreground h-11 rounded-lg"
                                                />
                                            </>
                                        )}
                                        {(formData.test_category === 'creative' || formData.test_category === 'audience') && (
                                            <>
                                                <Label className="text-[9px] uppercase text-muted-foreground font-black tracking-widest px-1">Facebook ID</Label>
                                                <Input
                                                    value={formData.test_category === 'creative' ? formData.facebook_ad_b_id : formData.facebook_adset_b_id}
                                                    onChange={e => updateField(formData.test_category === 'creative' ? 'facebook_ad_b_id' : 'facebook_adset_b_id', e.target.value)}
                                                    placeholder="123456..."
                                                    className="bg-white/5 border-white/10 text-foreground h-11 rounded-lg font-mono text-[10px]"
                                                />
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: SETTINGS */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex flex-col gap-6 shadow-inner">
                                <h4 className="flex items-center gap-2 font-black text-foreground uppercase tracking-tight text-sm">
                                    <Scale className="w-5 h-5 text-blue-400" /> Правила автоматизации
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1.5 block opacity-60">Порог достоверности</Label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                value={formData.auto_winner_threshold}
                                                onChange={e => updateField('auto_winner_threshold', e.target.value)}
                                                className="bg-white/5 border-white/10 text-foreground pr-8 h-11 rounded-lg"
                                            />
                                            <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-black">%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1.5 block opacity-60">Мин. размер выборки</Label>
                                        <Input
                                            type="number"
                                            value={formData.min_sample_size}
                                            onChange={e => updateField('min_sample_size', e.target.value)}
                                            className="bg-white/5 border-white/10 text-foreground h-11 rounded-lg"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-primary/80 bg-primary/10 p-2 rounded-lg">
                                    <Target className="w-3.5 h-3.5" />
                                    Авто-остановка проигрышного варианта при достижении {formData.auto_winner_threshold}% достоверности
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                <DialogFooter className="border-t border-white/5 pt-6 pb-2">
                    {step > 0 && (
                        <Button variant="outline" onClick={handleBack} className="mr-auto border-white/10 text-foreground hover:bg-white/5 rounded-xl px-6 py-5 font-black uppercase text-[10px] tracking-widest h-auto">
                            <ChevronLeft className="w-4 h-4 mr-2" /> Назад
                        </Button>
                    )}
                    {step < STEPS.length - 1 ? (
                        <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 py-5 font-black uppercase text-[10px] tracking-widest h-auto shadow-lg shadow-blue-500/20">
                            Далее <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 py-5 font-black uppercase text-[10px] tracking-widest h-auto shadow-lg shadow-blue-500/20">
                            {loading ? "Создание..." : "Запустить тест"}
                        </Button>
                    )}
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
};
