import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const createVideoTask = vi.fn();

// kieVideoService тянет клиент supabase, которому нужны переменные окружения.
vi.mock('@/integrations/supabase/client', () => ({
    supabase: { functions: { invoke: vi.fn() } },
}));

vi.mock('../kieVideoService', async () => {
    const actual = await vi.importActual<typeof import('../kieVideoService')>('../kieVideoService');
    return {
        KIE_VIDEO_MODELS: actual.KIE_VIDEO_MODELS,
        createVideoTask: (...args: unknown[]) => createVideoTask(...args),
    };
});

import {
    buildVideoPrompt,
    createFromBrief,
    runContentPipeline,
    PLATFORM_PRESETS,
    type ContentBrief,
} from '../videoContentPipeline';

const brief = (over: Partial<ContentBrief> = {}): ContentBrief => ({
    product: 'Ортопедические матрасы',
    audience: 'женщины 30-45, болит спина по утрам',
    hook: 'просыпаешься разбитой',
    cta: 'запишись на подбор',
    platform: 'reels',
    ...over,
});

const task = (id = 'task-1') => ({ taskId: id, model: 'veo3_fast', state: 'pending', videoUrls: [] });

beforeEach(() => {
    createVideoTask.mockReset();
    createVideoTask.mockResolvedValue(task());
});

describe('buildVideoPrompt', () => {
    it('раскладывает бриф по осям кадра, а не склеивает в одну фразу', () => {
        const prompt = buildVideoPrompt(brief({ mood: 'тёплое утро', voiceLine: 'Спина сказала спасибо' }));

        expect(prompt).toContain('Ортопедические матрасы');
        expect(prompt).toContain('женщины 30-45');
        expect(prompt).toContain('просыпаешься разбитой');
        expect(prompt).toContain('тёплое утро');
        expect(prompt).toContain('Спина сказала спасибо');
        expect(prompt).toContain('запишись на подбор');
        expect(prompt).toContain('Камера:');
    });

    it('подставляет кадрирование площадки', () => {
        expect(buildVideoPrompt(brief({ platform: 'feed' }))).toContain('Квадратный кадр'.toLowerCase());
    });

    it('без реплики просит атмосферный звук', () => {
        expect(buildVideoPrompt(brief())).toContain('Без речи');
    });
});

describe('createFromBrief', () => {
    it('берёт соотношение сторон и длительность из пресета площадки', async () => {
        await createFromBrief(brief({ platform: 'stories', projectId: 'p1' }));

        const params = createVideoTask.mock.calls[0][0];
        expect(params.aspectRatio).toBe(PLATFORM_PRESETS.stories.aspectRatio);
        expect(params.extraInput).toEqual({ duration: PLATFORM_PRESETS.stories.durationSec });
        expect(params.projectId).toBe('p1');
        expect(params.model).toBe('veo3_fast');
    });

    it('пробрасывает автопубликацию и карточку контента', async () => {
        await createFromBrief(brief({ contentFactoryId: 'cf-9' }), { autoPublish: true });

        const params = createVideoTask.mock.calls[0][0];
        expect(params.autoPublish).toBe(true);
        expect(params.contentFactoryId).toBe('cf-9');
    });
});

describe('runContentPipeline', () => {
    it('пустой список не вызывает API', async () => {
        const result = await runContentPipeline([]);
        expect(result).toEqual({ created: [], failed: [] });
        expect(createVideoTask).not.toHaveBeenCalled();
    });

    it('ставит задачу на каждый бриф', async () => {
        createVideoTask
            .mockResolvedValueOnce(task('a'))
            .mockResolvedValueOnce(task('b'));

        const seen: string[] = [];
        const result = await runContentPipeline([brief(), brief({ platform: 'tiktok' })], {
            onTaskCreated: (t) => seen.push(t.taskId),
        });

        expect(result.created).toHaveLength(2);
        expect(result.failed).toHaveLength(0);
        expect(seen).toEqual(['a', 'b']);
    });

    it('падение одного брифа не роняет остальные', async () => {
        createVideoTask
            .mockResolvedValueOnce(task('a'))
            .mockRejectedValueOnce(new Error('Лимит kie.ai'))
            .mockResolvedValueOnce(task('c'));

        const result = await runContentPipeline([brief(), brief(), brief()]);

        expect(result.created).toHaveLength(2);
        expect(result.failed).toHaveLength(1);
        expect(result.failed[0].error).toBe('Лимит kie.ai');
    });

    it('image-to-video без картинки отклоняется до вызова API', async () => {
        await expect(
            runContentPipeline([brief()], { model: 'sora-2-image-to-video' }),
        ).rejects.toThrow(/требует исходную картинку/);

        expect(createVideoTask).not.toHaveBeenCalled();
    });

    it('раздаёт каждому брифу свою картинку', async () => {
        await runContentPipeline([brief(), brief()], {
            model: 'sora-2-image-to-video',
            imageUrls: ['https://cdn/1.png', 'https://cdn/2.png'],
        });

        expect(createVideoTask.mock.calls[0][0].imageUrls).toEqual(['https://cdn/1.png']);
        expect(createVideoTask.mock.calls[1][0].imageUrls).toEqual(['https://cdn/2.png']);
    });
});

describe('лимит kie.ai', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('делит больше 15 брифов на пачки с паузой между ними', async () => {
        const briefs = Array.from({ length: 16 }, () => brief());
        const promise = runContentPipeline(briefs);

        // Первая пачка ушла сразу, вторая ждёт паузы.
        await vi.advanceTimersByTimeAsync(0);
        expect(createVideoTask).toHaveBeenCalledTimes(15);

        await vi.advanceTimersByTimeAsync(11_000);
        const result = await promise;

        expect(createVideoTask).toHaveBeenCalledTimes(16);
        expect(result.created).toHaveLength(16);
    });
});
