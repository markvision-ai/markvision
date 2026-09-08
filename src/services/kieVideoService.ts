import { supabase } from '@/integrations/supabase/client';

/**
 * Клиент генерации видео через kie.ai.
 *
 * Ключ в браузер не попадает: всё идёт через edge-функцию `kie-video`,
 * которая держит KIE_API_KEY и ходит на https://api.kie.ai.
 */

export type KieTaskState = 'pending' | 'running' | 'success' | 'failed';

export interface KieVideoTask {
    taskId: string;
    model: string | null;
    state: KieTaskState;
    /** Временные ссылки kie.ai — живут 14 дней */
    videoUrls: string[];
    /** Постоянная ссылка в нашем хранилище, появляется после успеха */
    storedUrl?: string | null;
    error?: string | null;
    /** true — kie.ai сам сообщит о готовности, поллинг не обязателен */
    callbackEnabled?: boolean;
}

export interface KieTaskRow {
    task_id: string;
    model: string;
    prompt: string | null;
    state: KieTaskState;
    stored_url: string | null;
    source_url: string | null;
    error: string | null;
    auto_publish: boolean;
    published_at: string | null;
    created_at: string;
}

export interface KieVideoModel {
    slug: string;
    label: string;
    kind: 'text-to-video' | 'image-to-video';
    description: string;
}

/**
 * Известные модели kie.ai для выпадашек в UI.
 *
 * Каталог у kie.ai живёт на https://kie.ai/market и меняется по мере
 * подключения новых провайдеров, отдельного эндпоинта со списком нет.
 * Поэтому это подсказка, а не белый список: `createVideoTask` примет любой
 * слаг, и новая модель заработает без правок кода. Актуальные слаги и набор
 * полей `input` у каждой модели — на странице модели в Market и в Playground.
 */
export const KIE_VIDEO_MODELS: KieVideoModel[] = [
    {
        slug: 'veo3_fast',
        label: 'Veo 3 Fast',
        kind: 'text-to-video',
        description: 'Быстрая и дешёвая Veo 3. Рабочая лошадка для черновиков креативов.',
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
    /** Слаг модели, например 'veo3_fast'. См. KIE_VIDEO_MODELS. */
    model: string;
    prompt: string;
    aspectRatio?: string;
    /** Исходная картинка для image-to-video моделей */
    imageUrls?: string[];
    /** Доп. поля конкретной модели, подмешиваются в `input` для kie.ai */
    extraInput?: Record<string, unknown>;
    /** Проект MarkVision, к которому относится ролик */
    projectId?: string;
    /** Карточка контент-завода: в неё запишется video_url по готовности */
    contentFactoryId?: string;
    /** Отдать готовый ролик в автопостинг */
    autoPublish?: boolean;
}

interface EdgeResponse {
    error?: string;
    [key: string]: unknown;
}

async function invokeKie<T>(payload: Record<string, unknown>): Promise<T> {
    const { data, error } = await supabase.functions.invoke<EdgeResponse>('kie-video', {
        body: payload,
    });

    if (error) throw new Error(error.message || 'Вызов функции kie-video не удался');
    if (data?.error) throw new Error(String(data.error));
    if (!data) throw new Error('kie-video вернул пустой ответ');

    return data as T;
}

/** Остаток кредитов kie.ai. Заодно проверяет, что ключ рабочий. */
export async function getKieCredits(): Promise<number | null> {
    const data = await invokeKie<{ credits: number | null }>({ action: 'credits' });
    return data.credits;
}

/** Ставит генерацию в очередь и сразу возвращает taskId. */
export async function createVideoTask(params: CreateVideoParams): Promise<KieVideoTask> {
    if (!params.model) throw new Error('Не выбрана модель генерации');
    if (!params.prompt?.trim()) throw new Error('Промпт не может быть пустым');

    const prompt = params.prompt.trim();
    const input: Record<string, unknown> = {
        prompt,
        ...(params.aspectRatio ? { aspect_ratio: params.aspectRatio } : {}),
        ...(params.imageUrls?.length ? { image_urls: params.imageUrls } : {}),
        ...params.extraInput,
    };

    return invokeKie<KieVideoTask>({
        action: 'create',
        model: params.model,
        input,
        prompt,
        projectId: params.projectId,
        contentFactoryId: params.contentFactoryId,
        autoPublish: params.autoPublish,
    });
}

/** Разовое чтение статуса задачи. */
export async function getVideoTask(taskId: string): Promise<KieVideoTask> {
    if (!taskId) throw new Error('Не передан taskId');
    return invokeKie<KieVideoTask>({ action: 'status', taskId });
}

/** История задач текущего пользователя. */
export async function listVideoTasks(limit = 20): Promise<KieTaskRow[]> {
    const data = await invokeKie<{ tasks: KieTaskRow[] }>({ action: 'list', limit });
    return data.tasks;
}

export interface WaitOptions {
    /** Интервал опроса, мс. По умолчанию 5с — генерация идёт минутами. */
    pollIntervalMs?: number;
    /** Сдаться через столько мс. По умолчанию 10 минут. */
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

/** Опрашивает задачу до успеха, ошибки или истечения таймаута. */
export async function waitForVideoTask(
    taskId: string,
    options: WaitOptions = {},
): Promise<KieVideoTask> {
    const { pollIntervalMs = 5000, timeoutMs = 10 * 60 * 1000, onProgress, signal } = options;
    const deadline = Date.now() + timeoutMs;

    while (true) {
        if (signal?.aborted) throw new Error('Генерация отменена');

        const task = await getVideoTask(taskId);
        onProgress?.(task);

        if (task.state === 'success') {
            if (!task.videoUrls.length && !task.storedUrl) {
                throw new Error('kie.ai вернул успех, но без ссылки на видео');
            }
            return task;
        }
        if (task.state === 'failed') throw new Error(task.error || 'Генерация не удалась');

        if (Date.now() + pollIntervalMs > deadline) {
            throw new Error(
                `Превышено время ожидания (${Math.round(timeoutMs / 1000)}с). Задача ${taskId} может ещё выполняться.`,
            );
        }

        await sleep(pollIntervalMs, signal);
    }
}

/** Создаёт задачу и дожидается готового видео. */
export async function generateVideo(
    params: CreateVideoParams,
    options: WaitOptions = {},
): Promise<KieVideoTask> {
    const task = await createVideoTask(params);
    options.onProgress?.(task);
    return waitForVideoTask(task.taskId, options);
}

/** Ссылка, которую стоит отдавать наружу: постоянная, если она уже есть. */
export function permanentUrl(task: KieVideoTask): string | null {
    return task.storedUrl || task.videoUrls[0] || null;
}
