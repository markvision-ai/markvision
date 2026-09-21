// Общие помощники для работы с Meta Graph API.
//
// Единый источник правды для пагинации и разбора ошибок Graph API,
// чтобы одинаковая логика не жила копиями в компонентах и edge-функциях.

/** Ошибка Graph API с человекочитаемым текстом (протухший токен, нет прав и т.п.). */
export class GraphError extends Error {
  code?: number;
  constructor(message: string, code?: number) {
    super(message);
    this.name = 'GraphError';
    this.code = code;
  }
}

/**
 * Проходит по всем страницам Graph API (paging.next), собирая массив .data.
 *
 * Без этого `me/accounts` / `me/adaccounts` отдаёт лишь первые ~25 записей —
 * при 100+ подключённых IG-аккаунтах большая часть просто не отображается.
 *
 * Ошибку API поднимаем наверх, а не глотаем: иначе протухший токен выглядит
 * как «нет аккаунтов», и пользователь не понимает, что нужно переподключиться.
 */
export async function fetchAllGraphPages<T = unknown>(
  url: string,
  signal?: AbortSignal,
): Promise<T[]> {
  const out: T[] = [];
  let next: string | null = url;
  while (next) {
    const res = await fetch(next, signal ? { signal } : undefined);
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.error) {
      throw new GraphError(
        json?.error?.message || `Graph API вернул ${res.status}`,
        json?.error?.code,
      );
    }
    if (Array.isArray(json.data)) out.push(...json.data);
    next = json.paging?.next || null;
  }
  return out;
}
