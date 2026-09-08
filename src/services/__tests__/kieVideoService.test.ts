import { describe, it, expect, vi, beforeEach } from 'vitest';

const invoke = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
    supabase: { functions: { invoke: (...args: unknown[]) => invoke(...args) } },
}));

import {
    createVideoTask,
    getVideoTask,
    getKieCredits,
    waitForVideoTask,
    generateVideo,
    KIE_VIDEO_MODELS,
} from '../kieVideoService';

const task = (over: Record<string, unknown> = {}) => ({
    data: { taskId: 'task-1', model: 'veo3_fast', state: 'pending', videoUrls: [], ...over },
    error: null,
});

beforeEach(() => {
    invoke.mockReset();
});

describe('createVideoTask', () => {
    it('sends the prompt and model to the edge function', async () => {
        invoke.mockResolvedValue(task());

        const result = await createVideoTask({ model: 'veo3_fast', prompt: '  кот в скафандре  ' });

        expect(invoke).toHaveBeenCalledWith('kie-video', {
            body: {
                action: 'create',
                model: 'veo3_fast',
                input: { prompt: 'кот в скафандре' },
            },
        });
        expect(result.taskId).toBe('task-1');
    });

    it('maps aspect ratio and images into the kie.ai input shape', async () => {
        invoke.mockResolvedValue(task());

        await createVideoTask({
            model: 'sora-2-image-to-video',
            prompt: 'оживи баннер',
            aspectRatio: '9:16',
            imageUrls: ['https://cdn.example/banner.png'],
            extraInput: { duration: 10 },
        });

        expect(invoke.mock.calls[0][1].body.input).toEqual({
            prompt: 'оживи баннер',
            aspect_ratio: '9:16',
            image_urls: ['https://cdn.example/banner.png'],
            duration: 10,
        });
    });

    it('rejects an empty prompt before spending a request', async () => {
        await expect(createVideoTask({ model: 'veo3_fast', prompt: '   ' })).rejects.toThrow(
            'Промпт не может быть пустым'
        );
        expect(invoke).not.toHaveBeenCalled();
    });

    it('surfaces an application-level error from the edge function', async () => {
        invoke.mockResolvedValue({ data: { error: 'Insufficient credits' }, error: null });

        await expect(createVideoTask({ model: 'veo3_fast', prompt: 'тест' })).rejects.toThrow(
            'Insufficient credits'
        );
    });

    it('surfaces a transport error from supabase', async () => {
        invoke.mockResolvedValue({ data: null, error: { message: 'Failed to fetch' } });

        await expect(createVideoTask({ model: 'veo3_fast', prompt: 'тест' })).rejects.toThrow(
            'Failed to fetch'
        );
    });
});

describe('getKieCredits', () => {
    it('returns the balance reported by kie.ai', async () => {
        invoke.mockResolvedValue({ data: { credits: 42 }, error: null });
        await expect(getKieCredits()).resolves.toBe(42);
    });
});

describe('getVideoTask', () => {
    it('requires a task id', async () => {
        await expect(getVideoTask('')).rejects.toThrow('Не передан taskId');
    });
});

describe('waitForVideoTask', () => {
    it('polls until the task succeeds', async () => {
        invoke
            .mockResolvedValueOnce(task({ state: 'pending' }))
            .mockResolvedValueOnce(task({ state: 'running' }))
            .mockResolvedValueOnce(task({ state: 'success', videoUrls: ['https://cdn.example/v.mp4'] }));

        const seen: string[] = [];
        const result = await waitForVideoTask('task-1', {
            pollIntervalMs: 0,
            onProgress: (t) => seen.push(t.state),
        });

        expect(seen).toEqual(['pending', 'running', 'success']);
        expect(result.videoUrls).toEqual(['https://cdn.example/v.mp4']);
    });

    it('throws with the failure reason from kie.ai', async () => {
        invoke.mockResolvedValue(task({ state: 'failed', error: 'content policy' }));

        await expect(waitForVideoTask('task-1', { pollIntervalMs: 0 })).rejects.toThrow('content policy');
    });

    it('treats success without a url as a failure', async () => {
        invoke.mockResolvedValue(task({ state: 'success', videoUrls: [] }));

        await expect(waitForVideoTask('task-1', { pollIntervalMs: 0 })).rejects.toThrow(
            'без ссылки на видео'
        );
    });

    it('gives up once the timeout is reached', async () => {
        invoke.mockResolvedValue(task({ state: 'running' }));

        await expect(
            waitForVideoTask('task-1', { pollIntervalMs: 10, timeoutMs: 0 })
        ).rejects.toThrow(/Превышено время ожидания/);
    });

    it('stops when the caller aborts', async () => {
        invoke.mockResolvedValue(task({ state: 'running' }));
        const controller = new AbortController();
        controller.abort();

        await expect(
            waitForVideoTask('task-1', { pollIntervalMs: 0, signal: controller.signal })
        ).rejects.toThrow('Генерация отменена');
    });
});

describe('generateVideo', () => {
    it('creates the task and returns the finished video', async () => {
        invoke
            .mockResolvedValueOnce(task({ state: 'pending' }))
            .mockResolvedValueOnce(task({ state: 'success', videoUrls: ['https://cdn.example/v.mp4'] }));

        const result = await generateVideo(
            { model: 'veo3_fast', prompt: 'тест' },
            { pollIntervalMs: 0 }
        );

        expect(invoke.mock.calls[0][1].body.action).toBe('create');
        expect(invoke.mock.calls[1][1].body).toEqual({ action: 'status', taskId: 'task-1' });
        expect(result.videoUrls).toEqual(['https://cdn.example/v.mp4']);
    });
});

describe('KIE_VIDEO_MODELS', () => {
    it('has unique slugs', () => {
        const slugs = KIE_VIDEO_MODELS.map((m) => m.slug);
        expect(new Set(slugs).size).toBe(slugs.length);
    });
});
