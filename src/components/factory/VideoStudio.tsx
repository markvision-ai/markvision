import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Film, Send, RefreshCw, AlertCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { KIE_VIDEO_MODELS, type KieTaskState } from '@/services/kieVideoService';
import {
    buildVideoPrompt,
    createFromBrief,
    PLATFORM_PRESETS,
    type ContentBrief,
    type Platform,
} from '@/services/videoContentPipeline';
import { useKieVideoTasks } from '@/hooks/useKieVideoTasks';

interface VideoStudioProps {
    projectId?: string | null;
}

const PLATFORM_LABELS: Record<Platform, string> = {
    reels: 'Reels',
    stories: 'Stories',
    tiktok: 'TikTok',
    feed: 'Лента',
    'youtube-shorts': 'YouTube Shorts',
};

const STATE_LABELS: Record<KieTaskState, string> = {
    pending: 'В очереди',
    running: 'Генерируется',
    success: 'Готово',
    failed: 'Ошибка',
};

const STATE_STYLES: Record<KieTaskState, string> = {
    pending: 'bg-white/10 text-white/60',
    running: 'bg-amber-500/20 text-amber-300',
    success: 'bg-emerald-500/20 text-emerald-300',
    failed: 'bg-red-500/20 text-red-300',
};

const EMPTY_BRIEF: Omit<ContentBrief, 'projectId'> = {
    product: '',
    audience: '',
    hook: '',
    cta: '',
    platform: 'reels',
    mood: '',
    voiceLine: '',
};

const fieldClass =
    'bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-primary/50';

export const VideoStudio = ({ projectId }: VideoStudioProps) => {
    const [brief, setBrief] = useState(EMPTY_BRIEF);
    const [model, setModel] = useState(KIE_VIDEO_MODELS[0].slug);
    const [autoPublish, setAutoPublish] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const { tasks, loading, error, reload, prepend } = useKieVideoTasks();

    const selectedModel = KIE_VIDEO_MODELS.find((m) => m.slug === model);
    const needsImage = selectedModel?.kind === 'image-to-video';

    // Обязательный минимум: без этих четырёх полей промпт получается пустым.
    const ready = Boolean(brief.product && brief.audience && brief.hook && brief.cta);

    const preview = useMemo(
        () => (ready ? buildVideoPrompt({ ...brief, projectId: projectId ?? undefined }) : ''),
        [brief, ready, projectId],
    );

    const set = (key: keyof typeof EMPTY_BRIEF) => (value: string) =>
        setBrief((current) => ({ ...current, [key]: value }));

    const submit = async () => {
        if (!ready || submitting) return;

        setSubmitting(true);
        try {
            const task = await createFromBrief(
                { ...brief, projectId: projectId ?? undefined },
                { model, autoPublish },
            );

            prepend({
                task_id: task.taskId,
                model,
                prompt: preview,
                state: 'pending',
                stored_url: null,
                source_url: null,
                error: null,
                auto_publish: autoPublish,
                published_at: null,
                created_at: new Date().toISOString(),
            });

            toast.success('Задача поставлена', {
                description: task.callbackEnabled
                    ? 'Ролик появится в ленте сам, ждать не нужно'
                    : 'Колбэк не настроен — статус обновится при перезагрузке',
            });

            setBrief((current) => ({ ...EMPTY_BRIEF, platform: current.platform }));
        } catch (err) {
            toast.error('Не удалось поставить задачу', {
                description: err instanceof Error ? err.message : 'Неизвестная ошибка',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="h-full overflow-y-auto px-8 pt-28 pb-12 bg-[#020617]">
            <div className="mx-auto max-w-6xl grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">

                {/* Бриф */}
                <div className="rounded-3xl border border-white/10 bg-card/40 backdrop-blur-3xl p-8 space-y-5">
                    <div className="flex items-center gap-3">
                        <Film className="w-5 h-5 text-primary" />
                        <h2 className="font-black uppercase tracking-widest text-[11px] text-white">
                            Бриф на ролик
                        </h2>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-white/50 text-[10px] uppercase tracking-widest">Продукт</Label>
                        <Input
                            className={fieldClass}
                            placeholder="Ортопедические матрасы"
                            value={brief.product}
                            onChange={(e) => set('product')(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-white/50 text-[10px] uppercase tracking-widest">Аудитория</Label>
                        <Input
                            className={fieldClass}
                            placeholder="женщины 30-45, болит спина по утрам"
                            value={brief.audience}
                            onChange={(e) => set('audience')(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-white/50 text-[10px] uppercase tracking-widest">
                            Крючок первого кадра
                        </Label>
                        <Input
                            className={fieldClass}
                            placeholder="просыпаешься разбитой"
                            value={brief.hook}
                            onChange={(e) => set('hook')(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-white/50 text-[10px] uppercase tracking-widest">Призыв</Label>
                        <Input
                            className={fieldClass}
                            placeholder="запишись на подбор"
                            value={brief.cta}
                            onChange={(e) => set('cta')(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-white/50 text-[10px] uppercase tracking-widest">Площадка</Label>
                            <Select
                                value={brief.platform}
                                onValueChange={(value) => set('platform')(value as Platform)}
                            >
                                <SelectTrigger className={fieldClass}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {(Object.keys(PLATFORM_LABELS) as Platform[]).map((key) => (
                                        <SelectItem key={key} value={key}>
                                            {PLATFORM_LABELS[key]} · {PLATFORM_PRESETS[key].aspectRatio} ·{' '}
                                            {PLATFORM_PRESETS[key].durationSec}с
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-white/50 text-[10px] uppercase tracking-widest">Модель</Label>
                            <Select value={model} onValueChange={setModel}>
                                <SelectTrigger className={fieldClass}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {KIE_VIDEO_MODELS.map((m) => (
                                        <SelectItem key={m.slug} value={m.slug}>
                                            {m.label}
                                            {!m.verified && ' · не проверена'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-white/50 text-[10px] uppercase tracking-widest">
                            Настроение кадра
                        </Label>
                        <Input
                            className={fieldClass}
                            placeholder="тёплое утро, свет из окна"
                            value={brief.mood}
                            onChange={(e) => set('mood')(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-white/50 text-[10px] uppercase tracking-widest">
                            Реплика в кадре
                        </Label>
                        <Input
                            className={fieldClass}
                            placeholder="оставь пустым — будет без речи"
                            value={brief.voiceLine}
                            onChange={(e) => set('voiceLine')(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <div>
                            <div className="text-white text-xs font-bold">Сразу в публикацию</div>
                            <div className="text-white/40 text-[10px]">
                                Готовый ролик уйдёт в автопостинг без ручного шага
                            </div>
                        </div>
                        <Switch checked={autoPublish} onCheckedChange={setAutoPublish} />
                    </div>

                    {selectedModel && !selectedModel.verified && (
                        <div className="flex gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/50 text-[11px]">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>
                                Слаг {selectedModel.label} взят из документации и вживую не проверялся.
                                Если kie.ai ответит «модель не найдена» — сверьте название на kie.ai/market.
                            </span>
                        </div>
                    )}

                    {needsImage && (
                        <div className="flex gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200 text-[11px]">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>
                                {selectedModel?.label} оживляет готовый кадр. Из этой формы картинка не
                                передаётся — выберите текстовую модель или ставьте задачу из кода.
                            </span>
                        </div>
                    )}

                    <Button
                        onClick={submit}
                        disabled={!ready || submitting || needsImage}
                        className="w-full rounded-full h-12 bg-secondary hover:bg-secondary/90 text-white font-black uppercase tracking-widest text-[10px]"
                    >
                        {submitting ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4 mr-2" />
                        )}
                        Сгенерировать
                    </Button>
                </div>

                {/* Промпт и лента задач */}
                <div className="space-y-8">
                    <div className="rounded-3xl border border-white/10 bg-card/40 backdrop-blur-3xl p-8">
                        <h2 className="font-black uppercase tracking-widest text-[11px] text-white mb-4">
                            Промпт для модели
                        </h2>
                        <p className="text-white/60 text-[13px] leading-relaxed whitespace-pre-wrap">
                            {preview || 'Заполните продукт, аудиторию, крючок и призыв — промпт соберётся сам.'}
                        </p>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-card/40 backdrop-blur-3xl p-8">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="font-black uppercase tracking-widest text-[11px] text-white">
                                Задачи
                            </h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={reload}
                                className="text-white/40 hover:text-white h-8"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                            </Button>
                        </div>

                        {loading && <Loader2 className="w-5 h-5 animate-spin text-white/20" />}

                        {error && <p className="text-red-300 text-xs">{error}</p>}

                        {!loading && !error && tasks.length === 0 && (
                            <p className="text-white/30 text-xs">Пока пусто. Первая задача появится здесь.</p>
                        )}

                        <div className="space-y-3">
                            {tasks.map((task) => (
                                <div
                                    key={task.task_id}
                                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                                >
                                    <div className="flex items-center justify-between gap-3 mb-1.5">
                                        <Badge className={`${STATE_STYLES[task.state]} border-none text-[10px]`}>
                                            {STATE_LABELS[task.state]}
                                        </Badge>
                                        <span className="text-white/25 text-[10px]">{task.model}</span>
                                    </div>

                                    <p className="text-white/50 text-[11px] line-clamp-2">
                                        {task.prompt || task.task_id}
                                    </p>

                                    {task.error && (
                                        <p className="text-red-300/80 text-[11px] mt-1.5">{task.error}</p>
                                    )}

                                    {task.state === 'success' && (task.stored_url || task.source_url) && (
                                        <a
                                            href={task.stored_url || task.source_url || undefined}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 mt-2 text-primary text-[11px] hover:underline"
                                        >
                                            <Download className="w-3 h-3" />
                                            Открыть ролик
                                            {!task.stored_url && ' (временная ссылка)'}
                                        </a>
                                    )}

                                    {task.published_at && (
                                        <span className="block text-emerald-300/60 text-[10px] mt-1">
                                            Отправлено в публикацию
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
