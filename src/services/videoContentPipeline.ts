import {
    createVideoTask,
    KIE_VIDEO_MODELS,
    type CreateVideoParams,
    type KieVideoTask,
} from './kieVideoService';

/**
 * Автоматическое создание видеоконтента через kie.ai.
 *
 * Бриф → промпт → задача в kie.ai → (колбэк) → хранилище → автопостинг.
 * Здесь только первые два шага и постановка задач: дальше всё происходит
 * на стороне edge-функций, клиенту ждать не нужно.
 */

export type Platform = 'reels' | 'stories' | 'tiktok' | 'feed' | 'youtube-shorts';

interface PlatformPreset {
    aspectRatio: string;
    /** Сколько секунд просит площадка. Модель может округлить по-своему. */
    durationSec: number;
    /** Как строить кадр под площадку */
    framing: string;
}

export const PLATFORM_PRESETS: Record<Platform, PlatformPreset> = {
    reels: {
        aspectRatio: '9:16',
        durationSec: 8,
        framing: 'вертикальный кадр, ключевое действие в центре, верхние и нижние 15% свободны под интерфейс',
    },
    stories: {
        aspectRatio: '9:16',
        durationSec: 5,
        framing: 'вертикальный кадр, крупный план, одна мысль на весь ролик',
    },
    tiktok: {
        aspectRatio: '9:16',
        durationSec: 8,
        framing: 'вертикальный кадр, живая съёмка с рук, движение в первом же кадре',
    },
    feed: {
        aspectRatio: '1:1',
        durationSec: 6,
        framing: 'квадратный кадр, продукт занимает не меньше трети площади',
    },
    'youtube-shorts': {
        aspectRatio: '9:16',
        durationSec: 10,
        framing: 'вертикальный кадр, первые полторы секунды — визуальный крючок',
    },
};

export interface ContentBrief {
    /** Что рекламируем */
    product: string;
    /** Кому показываем */
    audience: string;
    /** Боль или желание, за которое цепляемся */
    hook: string;
    /** Куда ведём: «запишись на замер», «переходи в профиль» */
    cta: string;
    platform: Platform;
    /** Настроение кадра: «тёплое утро», «холодный премиум», «уличный репортаж» */
    mood?: string;
    /** Реплика в кадре, если ролик со звуком */
    voiceLine?: string;
    /** Проект MarkVision */
    projectId?: string;
    /** Карточка контент-завода, куда положить готовый ролик */
    contentFactoryId?: string;
}

/**
 * Собирает промпт из брифа.
 *
 * Модели генерации видео работают заметно лучше, когда им задают кадр, а не
 * тему: план, свет, движение камеры, действие. Поэтому бриф раскладывается
 * по этим осям, а не склеивается в одну фразу.
 */
export function buildVideoPrompt(brief: ContentBrief): string {
    const preset = PLATFORM_PRESETS[brief.platform];

    const lines = [
        `Рекламный ролик: ${brief.product}.`,
        `Зритель: ${brief.audience}.`,
        `Первый кадр цепляет за: ${brief.hook}.`,
        `Кадр: ${preset.framing}.`,
        brief.mood ? `Свет и настроение: ${brief.mood}.` : 'Свет естественный, мягкий, без пересветов.',
        'Камера: одно плавное движение — наезд или проводка, без резких склеек.',
        brief.voiceLine ? `Реплика в кадре: «${brief.voiceLine}».` : 'Без речи, только атмосферный звук.',
        `Финал: призыв «${brief.cta}».`,
        'Без текстовых плашек и субтитров в кадре — их накладываем отдельно.',
    ];

    return lines.join(' ');
}

export interface PipelineOptions {
    /** Слаг модели kie.ai. По умолчанию быстрая Veo 3. */
    model?: string;
    /** Отдавать готовые ролики в автопостинг */
    autoPublish?: boolean;
    /** Готовые кадры для image-to-video моделей, по одному на бриф */
    imageUrls?: string[];
    onTaskCreated?: (task: KieVideoTask, brief: ContentBrief) => void;
}

export interface PipelineResult {
    created: Array<{ brief: ContentBrief; task: KieVideoTask }>;
    failed: Array<{ brief: ContentBrief; error: string }>;
}

const DEFAULT_MODEL = 'veo3_fast';

// kie.ai принимает 20 новых генераций за 10 секунд и отбрасывает лишние без
// постановки в очередь. Едем пачками с запасом, чтобы не ловить 429.
const BATCH_SIZE = 15;
const BATCH_PAUSE_MS = 11_000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Ставит одну задачу по брифу. */
export async function createFromBrief(
    brief: ContentBrief,
    options: PipelineOptions = {},
): Promise<KieVideoTask> {
    const preset = PLATFORM_PRESETS[brief.platform];
    const model = options.model ?? DEFAULT_MODEL;

    const params: CreateVideoParams = {
        model,
        prompt: buildVideoPrompt(brief),
        aspectRatio: preset.aspectRatio,
        extraInput: { duration: preset.durationSec },
        projectId: brief.projectId,
        contentFactoryId: brief.contentFactoryId,
        autoPublish: options.autoPublish,
        ...(options.imageUrls?.length ? { imageUrls: options.imageUrls } : {}),
    };

    return createVideoTask(params);
}

/**
 * Прогоняет пачку брифов. Ошибка на одном брифе не роняет остальные:
 * каждый результат попадает либо в created, либо в failed с причиной.
 */
export async function runContentPipeline(
    briefs: ContentBrief[],
    options: PipelineOptions = {},
): Promise<PipelineResult> {
    const result: PipelineResult = { created: [], failed: [] };

    if (!briefs.length) return result;

    const model = options.model ?? DEFAULT_MODEL;
    const known = KIE_VIDEO_MODELS.find((m) => m.slug === model);
    if (known?.kind === 'image-to-video' && !options.imageUrls?.length) {
        throw new Error(`Модель ${known.label} требует исходную картинку — передайте imageUrls`);
    }

    for (let i = 0; i < briefs.length; i += BATCH_SIZE) {
        const batch = briefs.slice(i, i + BATCH_SIZE);

        const settled = await Promise.allSettled(
            batch.map((brief, index) =>
                createFromBrief(brief, {
                    ...options,
                    imageUrls: options.imageUrls?.[i + index]
                        ? [options.imageUrls[i + index]]
                        : undefined,
                }),
            ),
        );

        settled.forEach((outcome, index) => {
            const brief = batch[index];
            if (outcome.status === 'fulfilled') {
                result.created.push({ brief, task: outcome.value });
                options.onTaskCreated?.(outcome.value, brief);
            } else {
                const error = outcome.reason instanceof Error
                    ? outcome.reason.message
                    : String(outcome.reason);
                result.failed.push({ brief, error });
            }
        });

        // Пауза только между пачками, не после последней.
        if (i + BATCH_SIZE < briefs.length) await wait(BATCH_PAUSE_MS);
    }

    return result;
}
