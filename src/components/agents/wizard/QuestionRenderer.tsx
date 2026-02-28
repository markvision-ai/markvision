import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { X } from 'lucide-react';
import { Question } from '@/lib/agents/agentTypes';
import { cn } from '@/lib/utils';

interface QuestionRendererProps {
    question: Question;
    value: any;
    onChange: (value: any) => void;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
    question,
    value,
    onChange,
}) => {
    const [tagInput, setTagInput] = React.useState('');

    const handleTagAdd = (tag: string) => {
        if (!tag.trim()) return;
        const currentTags = value || [];
        onChange([...currentTags, tag.trim()]);
        setTagInput('');
    };

    const handleTagRemove = (index: number) => {
        const currentTags = value || [];
        onChange(currentTags.filter((_: any, i: number) => i !== index));
    };

    return (
        <div className="space-y-4 bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl p-8">
            <div className="space-y-2">
                <Label className="text-lg font-bold text-white flex items-center gap-2">
                    {question.label}
                    {question.required && <span className="text-red-400">*</span>}
                </Label>
                {question.description && (
                    <p className="text-sm text-slate-500">{question.description}</p>
                )}
            </div>

            {/* Textarea */}
            {question.type === 'textarea' && (
                <Textarea
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={question.placeholder}
                    className="min-h-[200px] bg-[#050505]/80 border-white/5 text-white p-6 focus:border-cyan-500/30 transition-all resize-none rounded-xl leading-relaxed text-base"
                />
            )}

            {/* Multiselect */}
            {question.type === 'multiselect' && (
                <div className="space-y-3">
                    {question.options?.map((option) => (
                        <div
                            key={option.value}
                            className={cn(
                                'flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                                value?.includes(option.value)
                                    ? 'border-cyan-500 bg-cyan-500/10'
                                    : 'border-white/5 bg-white/[0.02] hover:border-white/20'
                            )}
                            onClick={() => {
                                const currentValues = value || [];
                                if (currentValues.includes(option.value)) {
                                    onChange(currentValues.filter((v: string) => v !== option.value));
                                } else {
                                    onChange([...currentValues, option.value]);
                                }
                            }}
                        >
                            <Checkbox
                                checked={value?.includes(option.value)}
                                className="border-white/20"
                            />
                            <span className="text-white font-medium">{option.label}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Select */}
            {question.type === 'select' && (
                <Select value={value} onValueChange={onChange}>
                    <SelectTrigger className="bg-[#050505]/80 border-slate-200 h-12 rounded-xl text-white focus:ring-cyan-500/50">
                        <SelectValue placeholder="Выберите вариант..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0a] border-slate-200 text-white">
                        {question.options?.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            {/* Tags */}
            {question.type === 'tags' && (
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <Input
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleTagAdd(tagInput);
                                }
                            }}
                            placeholder={question.placeholder}
                            className="bg-[#050505]/80 border-white/5 text-white focus:border-cyan-500/30 rounded-xl"
                        />
                        <button
                            onClick={() => handleTagAdd(tagInput)}
                            className="px-6 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-xl hover:bg-cyan-500/20 transition-all font-bold"
                        >
                            Добавить
                        </button>
                    </div>
                    {value && value.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {value.map((tag: string, index: number) => (
                                <Badge
                                    key={index}
                                    variant="outline"
                                    className="bg-white/5 text-white border-slate-200 px-3 py-1 flex items-center gap-2"
                                >
                                    {tag}
                                    <X
                                        className="w-3 h-3 cursor-pointer hover:text-red-400"
                                        onClick={() => handleTagRemove(index)}
                                    />
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Inputs (multiple fields) */}
            {question.type === 'inputs' && (
                <div className="space-y-4">
                    {question.fields?.map((field) => (
                        <div key={field.key} className="space-y-2">
                            <Label className="text-sm text-slate-600">{field.label}</Label>
                            <Input
                                value={value?.[field.key] || ''}
                                onChange={(e) =>
                                    onChange({ ...value, [field.key]: e.target.value })
                                }
                                placeholder={field.placeholder}
                                className="bg-[#050505]/80 border-white/5 text-white focus:border-cyan-500/30 rounded-xl"
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Schedule */}
            {question.type === 'schedule' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5">
                        <div>
                            <div className="text-white font-medium">Работает 24/7</div>
                            <div className="text-sm text-slate-500">Агент отвечает круглосуточно</div>
                        </div>
                        <Switch
                            checked={value?.is24_7 || false}
                            onCheckedChange={(checked) =>
                                onChange({ ...value, is24_7: checked })
                            }
                        />
                    </div>

                    {!value?.is24_7 && (
                        <div className="space-y-3">
                            <Label className="text-sm text-slate-600">Рабочие часы</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-xs text-slate-500">Начало</Label>
                                    <Input
                                        type="time"
                                        value={value?.workingHours?.start || '09:00'}
                                        onChange={(e) =>
                                            onChange({
                                                ...value,
                                                workingHours: {
                                                    ...value?.workingHours,
                                                    start: e.target.value,
                                                },
                                            })
                                        }
                                        className="bg-[#050505]/80 border-white/5 text-white focus:border-cyan-500/30 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-slate-500">Конец</Label>
                                    <Input
                                        type="time"
                                        value={value?.workingHours?.end || '18:00'}
                                        onChange={(e) =>
                                            onChange({
                                                ...value,
                                                workingHours: {
                                                    ...value?.workingHours,
                                                    end: e.target.value,
                                                },
                                            })
                                        }
                                        className="bg-[#050505]/80 border-white/5 text-white focus:border-cyan-500/30 rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
