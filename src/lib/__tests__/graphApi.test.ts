import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchAllGraphPages, GraphError } from '@/lib/graphApi';

// Хелпер: собрать fake-Response для мока fetch
const ok = (body: unknown) => ({
  ok: true,
  status: 200,
  json: async () => body,
}) as unknown as Response;

const fail = (status: number, body: unknown) => ({
  ok: false,
  status,
  json: async () => body,
}) as unknown as Response;

describe('fetchAllGraphPages', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('возвращает данные с одной страницы, когда paging.next отсутствует', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(
      ok({ data: [{ id: '1' }, { id: '2' }] }),
    ));

    const rows = await fetchAllGraphPages<{ id: string }>('https://graph.facebook.com/v21.0/me/accounts');

    expect(rows).toEqual([{ id: '1' }, { id: '2' }]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('идёт по всем страницам через paging.next и склеивает данные', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(ok({ data: [{ id: '1' }], paging: { next: 'https://graph.facebook.com/next?p=2' } }))
      .mockResolvedValueOnce(ok({ data: [{ id: '2' }], paging: { next: 'https://graph.facebook.com/next?p=3' } }))
      .mockResolvedValueOnce(ok({ data: [{ id: '3' }] }));
    vi.stubGlobal('fetch', fetchMock);

    const rows = await fetchAllGraphPages<{ id: string }>('https://graph.facebook.com/v21.0/me/accounts');

    expect(rows).toEqual([{ id: '1' }, { id: '2' }, { id: '3' }]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    // вторая страница запрашивается именно по URL из paging.next
    expect(fetchMock.mock.calls[1][0]).toBe('https://graph.facebook.com/next?p=2');
  });

  it('бросает GraphError с текстом от Meta, когда тело содержит error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(
      ok({ error: { message: 'Error validating access token', code: 190 } }),
    ));

    await expect(
      fetchAllGraphPages('https://graph.facebook.com/v21.0/me/accounts'),
    ).rejects.toMatchObject({ name: 'GraphError', message: 'Error validating access token', code: 190 });
  });

  it('бросает GraphError при non-2xx ответе', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(fail(400, null)));

    const err = await fetchAllGraphPages('https://graph.facebook.com/v21.0/me/accounts').catch((e) => e);
    expect(err).toBeInstanceOf(GraphError);
    expect(err.message).toContain('400');
  });

  it('прекращает обход на первой же ошибочной странице', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(ok({ data: [{ id: '1' }], paging: { next: 'https://graph.facebook.com/next?p=2' } }))
      .mockResolvedValueOnce(ok({ error: { message: 'rate limit', code: 4 } }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      fetchAllGraphPages('https://graph.facebook.com/v21.0/me/accounts'),
    ).rejects.toBeInstanceOf(GraphError);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('пробрасывает AbortSignal в fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(ok({ data: [] }));
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();

    await fetchAllGraphPages('https://graph.facebook.com/v21.0/me/accounts', controller.signal);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://graph.facebook.com/v21.0/me/accounts',
      { signal: controller.signal },
    );
  });
});
