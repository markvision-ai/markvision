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
            <DialogContent className="max-w-2xl bg-background border-border sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl text-foreground">
                        <FlaskConical className="w-5 h-5 text-primary" />
                        Создать A/B тест
                    </DialogTitle>
                </DialogHeader>

                {/* Progress Steps */}
                <div className="flex items-center justify-between px-2 mb-6 relative">
                    <div className="absolute left-0 top-1/2 -content-[''] w-full h-0.5 bg-white/10 -z-10" />
                    {STEPS.map((s, i) => (
                        <div key={s.id} className="flex flex-col items-center gap-2 bg-black px-2 z-10">
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2",
                                i <= step ? "bg-primary border-primary text-black" : "bg-black border-white/20 text-muted-foreground"
                            )}>
                                {i + 1}
                            </div>
                            <span className={cn("text-[10px] uppercase font-bold tracking-wider", i <= step ? "text-primary" : "text-muted-foreground")}>{s.title}</span>
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
                                            "p-4 rounded-xl border-2 transition-all text-left flex flex-col gap-3 group hover:scale-[1.02]",
                                            isSelected
                                                ? "border-primary bg-primary/10 shadow-sm"
                                                : "border-border bg-card hover:bg-accent hover:border-border"
                                        )}
                                    >
                                        <div className={cn("p-2 rounded-lg w-fit transition-colors", isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground group-hover:bg-muted/80")}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-foreground text-base mb-1">{cat.label}</div>
                                            <div className="text-xs text-muted-foreground leading-relaxed">{cat.description}</div>
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
                                <Label className="text-foreground">Название теста</Label>
                                <Input
                                    value={formData.name}
                                    onChange={e => updateField('name', e.target.value)}
                                    placeholder="Например: Тест заголовка на главной"
                                    className="bg-background border-input text-foreground focus:border-primary/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-foreground">Гипотеза</Label>
                                <Textarea
                                    value={formData.hypothesis}
                                    onChange={e => updateField('hypothesis', e.target.value)}
                                    placeholder="Если мы изменим X, то метрика Y увеличится, потому что Z..."
                                    className="bg-background border-input text-foreground focus:border-primary/50 min-h-[100px]"
                                />
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-primary" />
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
                                <div className="space-y-4 p-4 rounded-xl border border-border bg-card">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded bg-blue-500/10 text-blue-500 flex items-center justify-center text-xs font-bold border border-blue-500/20">A</div>
                                        <h4 className="font-bold text-foreground">Контроль</h4>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-xs uppercase text-muted-foreground">Название</Label>
                                        <Input
                                            value={formData.variant_a_name}
                                            onChange={e => updateField('variant_a_name', e.target.value)}
                                            className="bg-background border-input text-foreground h-9"
                                        />
                                        {formData.test_category === 'page' && (
                                            <>
                                                <Label className="text-xs uppercase text-muted-foreground">Заголовок</Label>
                                                <Input
                                                    value={formData.variant_a_title}
                                                    onChange={e => updateField('variant_a_title', e.target.value)}
                                                    className="bg-background border-input text-foreground h-9"
                                                />
                                            </>
                                        )}
                                        {(formData.test_category === 'creative' || formData.test_category === 'audience') && (
                                            <>
                                                <Label className="text-xs uppercase text-muted-foreground">Facebook ID</Label>
                                                <Input
                                                    value={formData.test_category === 'creative' ? formData.facebook_ad_a_id : formData.facebook_adset_a_id}
                                                    onChange={e => updateField(formData.test_category === 'creative' ? 'facebook_ad_a_id' : 'facebook_adset_a_id', e.target.value)}
                                                    placeholder="123456..."
                                                    className="bg-background border-input text-foreground h-9 font-mono"
                                                />
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Variant B */}
                                <div className="space-y-4 p-4 rounded-xl border border-border bg-card">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded bg-purple-500/10 text-purple-500 flex items-center justify-center text-xs font-bold border border-purple-500/20">B</div>
                                        <h4 className="font-bold text-foreground">Вариант</h4>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-xs uppercase text-muted-foreground">Название</Label>
                                        <Input
                                            value={formData.variant_b_name}
                                            onChange={e => updateField('variant_b_name', e.target.value)}
                                            className="bg-background border-input text-foreground h-9"
                                        />
                                        {formData.test_category === 'page' && (
                                            <>
                                                <Label className="text-xs uppercase text-muted-foreground">Заголовок</Label>
                                                <Input
                                                    value={formData.variant_b_title}
                                                    onChange={e => updateField('variant_b_title', e.target.value)}
                                                    className="bg-background border-input text-foreground h-9"
                                                />
                                            </>
                                        )}
                                        {(formData.test_category === 'creative' || formData.test_category === 'audience') && (
                                            <>
                                                <Label className="text-xs uppercase text-muted-foreground">Facebook ID</Label>
                                                <Input
                                                    value={formData.test_category === 'creative' ? formData.facebook_ad_b_id : formData.facebook_adset_b_id}
                                                    onChange={e => updateField(formData.test_category === 'creative' ? 'facebook_ad_b_id' : 'facebook_adset_b_id', e.target.value)}
                                                    placeholder="123456..."
                                                    className="bg-background border-input text-foreground h-9 font-mono"
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
                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex flex-col gap-4">
                                <h4 className="flex items-center gap-2 font-bold text-foreground">
                                    <Scale className="w-4 h-4 text-primary" /> Правила автоматизации
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs text-muted-foreground mb-1.5 block">Порог достоверности</Label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                value={formData.auto_winner_threshold}
                                                onChange={e => updateField('auto_winner_threshold', e.target.value)}
                                                className="bg-black/20 border-white/10 text-white pr-8"
                                            />
                                            <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground mb-1.5 block">Мин. размер выборки</Label>
                                        <Input
                                            type="number"
                                            value={formData.min_sample_size}
                                            onChange={e => updateField('min_sample_size', e.target.value)}
                                            className="bg-background border-input text-foreground"
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

                <DialogFooter className="border-t border-border pt-4">
                    {step > 0 && (
                        <Button variant="outline" onClick={handleBack} className="mr-auto border-border text-foreground hover:bg-accent">
                            <ChevronLeft className="w-4 h-4 mr-1" /> Назад
                        </Button>
                    )}
                    {step < STEPS.length - 1 ? (
                        <Button onClick={handleNext}>
                            Далее <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={loading} variant="default">
                            {loading ? "Создание..." : "Запустить тест"}
                        </Button>
                    )}
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
};
