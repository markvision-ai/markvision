import { supabase } from '@/integrations/supabase/client';

/**
 * Client for kie.ai video generation.
 *
 * The API key never reaches the browser — every call goes through the
 * `kie-video` edge function, which holds KIE_API_KEY and talks to
 * https://api.kie.ai on our behalf.
 */

export type KieTaskState = 'pending' | 'running' | 'success' | 'failed';

export interface KieVideoTask {
    taskId: string;
    model: string | null;
    state: KieTaskState;
    videoUrls: string[];
    error?: string | null;
}

export interface KieVideoModel {
    /** Model slug passed to kie.ai as `model` */
    slug: string;
    label: string;
    /** Whether the model needs a source image */
    kind: 'text-to-video' | 'image-to-video';
    description: string;
}

/**
 * Known kie.ai video models.
 *
 * kie.ai has no public "list models" endpoint — the catalogue lives in their
 * docs and changes as providers are added. Treat this as a convenience list,
 * not a hard whitelist: `createVideoTask` accepts any slug, so a new model
 * works without a code change. Verify the current slugs at
 * https://docs.kie.ai before relying on one in production.
 */
export const KIE_VIDEO_MODELS: KieVideoModel[] = [
    {
        slug: 'veo3_fast',
        label: 'Veo 3 Fast',
        kind: 'text-to-video',
        description: 'Быстрая и дешёвая версия Veo 3. Рабочая лошадка для черновиков креативов.',
    },
    {
        slug: 'veo3',
        label: 'Veo 3',
        kind: 'text-to-video',
        description: 'Полная Veo 3 со звуком. Дороже и медленнее, качество выше.',
    },
    {
        slug: 'sora-2-text-to-video',
        label: 'Sora 2',
        kind: 'text-to-video',
        description: 'Sora 2 из текста. Сильная физика и связность сцены.',
    },
    {
        slug: 'sora-2-image-to-video',
        label: 'Sora 2 (из картинки)',
        kind: 'image-to-video',
        description: 'Оживляет статичный кадр — например, готовый баннер продукта.',
    },
    {
        slug: 'runway-gen4-turbo',
        label: 'Runway Gen-4 Turbo',
        kind: 'image-to-video',
        description: 'Быстрая анимация кадра, хорошо держит идентичность объекта.',
    },
];

export interface CreateVideoParams {
    /** Model slug, e.g. 'veo3_fast'. See KIE_VIDEO_MODELS. */
    model: string;
    prompt: string;
    /** Aspect ratio understood by the model, e.g. '16:9' or '9:16' */
    aspectRatio?: string;
    /** Source image URL for image-to-video models */
    imageUrls?: string[];
    /** Extra model-specific fields merged into the kie.ai `input` object */
    extraInput?: Record<string, unknown>;
    /** Optional webhook kie.ai calls when the task finishes */
    callBackUrl?: string;
}

interface EdgeResponse {
    error?: string;
    [key: string]: unknown;
}

async function invokeKie<T>(payload: Record<string, unknown>): Promise<T> {
    const { data, error } = await supabase.functions.invoke<EdgeResponse>('kie-video', {
        body: payload,
    });

    if (error) {
        throw new Error(error.message || 'kie-video function call failed');
    }
    if (data?.error) {
        throw new Error(String(data.error));
    }
    if (!data) {
        throw new Error('kie-video returned an empty response');
    }

    return data as T;
}

/** Remaining kie.ai credits. Doubles as a key/connectivity check. */
export async function getKieCredits(): Promise<number | null> {
    const data = await invokeKie<{ credits: number | null }>({ action: 'credits' });
    return data.credits;
}

/** Queue a generation and return immediately with a task id. */
export async function createVideoTask(params: CreateVideoParams): Promise<KieVideoTask> {
    if (!params.model) {
        throw new Error('Не выбрана модель генерации');
    }
    if (!params.prompt?.trim()) {
        throw new Error('Промпт не может быть пустым');
    }

    const input: Record<string, unknown> = {
        prompt: params.prompt.trim(),
        ...(params.aspectRatio ? { aspect_ratio: params.aspectRatio } : {}),
        ...(params.imageUrls?.length ? { image_urls: params.imageUrls } : {}),
        ...params.extraInput,
    };

    return invokeKie<KieVideoTask>({
        action: 'create',
        model: params.model,
        input,
        ...(params.callBackUrl ? { callBackUrl: params.callBackUrl } : {}),
    });
}

/** One-shot status read for an existing task. */
export async function getVideoTask(taskId: string): Promise<KieVideoTask> {
    if (!taskId) {
        throw new Error('Не передан taskId');
    }
    return invokeKie<KieVideoTask>({ action: 'status', taskId });
}

export interface WaitOptions {
    /** How often to poll, ms. Default 5s — video jobs run for minutes. */
    pollIntervalMs?: number;
    /** Give up after this long, ms. Default 10 min. */
    timeoutMs?: number;
    onProgress?: (task: KieVideoTask) => void;
    signal?: AbortSignal;
}

const sleep = (ms: number, signal?: AbortSignal) =>
    new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
            signal?.removeEventListener('abort', onAbort);
            resolve();
        }, ms);
        const onAbort = () => {
            clearTimeout(timer);
            reject(new Error('Генерация отменена'));
        };
        signal?.addEventListener('abort', onAbort, { once: true });
    });

/** Poll a queued task until it succeeds, fails, or the timeout runs out. */
export async function waitForVideoTask(
    taskId: string,
    options: WaitOptions = {}
): Promise<KieVideoTask> {
    const { pollIntervalMs = 5000, timeoutMs = 10 * 60 * 1000, onProgress, signal } = options;
    const deadline = Date.now() + timeoutMs;

    while (true) {
        if (signal?.aborted) {
            throw new Error('Генерация отменена');
        }

        const task = await getVideoTask(taskId);
        onProgress?.(task);

        if (task.state === 'success') {
            if (task.videoUrls.length === 0) {
                throw new Error('kie.ai вернул успех, но без ссылки на видео');
            }
            return task;
        }
        if (task.state === 'failed') {
            throw new Error(task.error || 'Генерация не удалась');
        }
        if (Date.now() + pollIntervalMs > deadline) {
            throw new Error(
                `Превышено время ожидания (${Math.round(timeoutMs / 1000)}с). Задача ${taskId} может ещё выполняться.`
            );
        }

        await sleep(pollIntervalMs, signal);
    }
}

/** Create a task and wait for the finished video in one call. */
export async function generateVideo(
    params: CreateVideoParams,
    options: WaitOptions = {}
): Promise<KieVideoTask> {
    const task = await createVideoTask(params);
    options.onProgress?.(task);
    return waitForVideoTask(task.taskId, options);
}
