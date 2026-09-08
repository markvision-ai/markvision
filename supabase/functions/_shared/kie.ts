// Общий слой работы с kie.ai для edge-функций kie-video и kie-video-callback.
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const KIE_BASE_URL = 'https://api.kie.ai';
export const VIDEO_BUCKET = 'generated-videos';

// kie.ai: не более 20 новых генераций за 10 секунд на аккаунт, лишние
// отбрасываются с 429 и в очередь не встают. Держим запас в два слота.
export const RATE_WINDOW_SECONDS = 10;
export const RATE_MAX_IN_WINDOW = 18;

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export type KieTaskState = 'pending' | 'running' | 'success' | 'failed';

// Ответы kie.ai завёрнуты в { code, msg, data }, причём HTTP-статус остаётся
// 200 даже когда code сигналит об ошибке. Конверт разбираем вручную.
interface KieEnvelope<T> {
  code: number;
  msg?: string;
  message?: string;
  data?: T;
}

export type KieResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; retryAfter?: number };

export function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', ...extraHeaders },
  });
}

export function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

export async function callKie<T>(
  apiKey: string,
  path: string,
  init: { method: 'GET' | 'POST'; body?: unknown } = { method: 'GET' },
): Promise<KieResult<T>> {
  let response: Response;
  try {
    response = await fetch(`${KIE_BASE_URL}${path}`, {
      method: init.method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch (error) {
    console.error('kie.ai unreachable:', error);
    return { ok: false, status: 502, error: 'kie.ai недоступен' };
  }

  const raw = await response.text();
  let payload: KieEnvelope<T>;
  try {
    payload = JSON.parse(raw);
  } catch {
    console.error('kie.ai returned non-JSON:', response.status, raw.slice(0, 500));
    return { ok: false, status: 502, error: `kie.ai вернул не-JSON (HTTP ${response.status})` };
  }

  if (response.status === 429 || payload.code === 429) {
    const retryAfter = Number(response.headers.get('Retry-After')) || RATE_WINDOW_SECONDS;
    return {
      ok: false,
      status: 429,
      error: 'Лимит kie.ai: 20 генераций за 10 секунд. Запрос отброшен, в очередь не встал.',
      retryAfter,
    };
  }

  if (!response.ok || payload.code !== 200) {
    const message = payload.msg || payload.message || `kie.ai вернул ошибку (HTTP ${response.status})`;
    console.error('kie.ai error:', response.status, payload.code, message);
    const status = response.ok
      ? (payload.code >= 400 && payload.code < 600 ? payload.code : 502)
      : response.status;
    return { ok: false, status, error: message };
  }

  return { ok: true, data: payload.data as T };
}

// Статусы у разных эндпоинтов kie.ai называются по-разному; сводим к четырём.
export function normalizeState(record: Record<string, unknown>): KieTaskState {
  const raw = String(record.state ?? record.status ?? '').toLowerCase();

  if (['success', 'succeeded', 'completed', 'done'].includes(raw)) return 'success';
  if (['fail', 'failed', 'error', 'canceled', 'cancelled'].includes(raw)) return 'failed';
  if (['generating', 'running', 'processing', 'in_progress'].includes(raw)) return 'running';
  if (['waiting', 'queuing', 'queued', 'pending', 'created'].includes(raw)) return 'pending';

  // Незнакомый статус считаем живым: иначе потеряем задачу, которая ещё считается.
  console.warn('Unknown kie.ai task state:', raw);
  return 'running';
}

// Результат приходит JSON-строкой в resultJson; в колбэке — плоским объектом.
export function extractResultUrls(record: Record<string, unknown>): string[] {
  const candidates: unknown[] = [];

  const resultJson = record.resultJson ?? record.result_json;
  if (typeof resultJson === 'string' && resultJson.trim()) {
    try {
      const parsed = JSON.parse(resultJson);
      candidates.push(parsed?.resultUrls, parsed?.result_urls, parsed?.resultUrl);
    } catch {
      console.warn('Could not parse resultJson for task', record.taskId ?? record.task_id);
    }
  }

  for (const holder of [record, record.response as Record<string, unknown> | undefined]) {
    if (!holder) continue;
    candidates.push(holder.resultUrls, holder.result_urls, holder.resultUrl, holder.result_url);
  }

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length) {
      return candidate.filter((url): url is string => typeof url === 'string');
    }
    if (typeof candidate === 'string' && candidate) return [candidate];
  }

  return [];
}

export function taskIdOf(record: Record<string, unknown>): string | null {
  const id = record.taskId ?? record.task_id;
  return typeof id === 'string' && id ? id : null;
}

/**
 * Перекладывает готовый ролик из временного хранилища kie.ai в наш бакет.
 * Файлы kie.ai живут 14 дней — без этого шага ссылка протухнет молча.
 * Возвращает постоянный URL или null, если переложить не вышло: в этом
 * случае задача всё равно считается успешной, но с временной ссылкой.
 */
export async function persistVideo(
  supabase: SupabaseClient,
  taskId: string,
  sourceUrl: string,
): Promise<string | null> {
  try {
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      console.error('Не удалось скачать результат kie.ai:', response.status, taskId);
      return null;
    }

    const contentType = response.headers.get('content-type') || 'video/mp4';
    const extension = contentType.includes('webm') ? 'webm' : 'mp4';
    const path = `${new Date().toISOString().slice(0, 10)}/${taskId}.${extension}`;

    const { error } = await supabase.storage
      .from(VIDEO_BUCKET)
      .upload(path, await response.arrayBuffer(), { contentType, upsert: true });

    if (error) {
      console.error('Не удалось залить ролик в хранилище:', error.message, taskId);
      return null;
    }

    const { data } = supabase.storage.from(VIDEO_BUCKET).getPublicUrl(path);
    console.log(`Ролик ${taskId} сохранён: ${path}`);
    return data.publicUrl;
  } catch (error) {
    console.error('persistVideo упал:', error, taskId);
    return null;
  }
}

/**
 * Отдаёт готовый ролик в автопостинг. Адрес и ключ берём из окружения:
 * не настроены — шаг тихо пропускается, генерация от этого не ломается.
 */
export async function dispatchToPublishing(
  payload: Record<string, unknown>,
): Promise<{ dispatched: boolean; error?: string }> {
  const url = Deno.env.get('PUBLISH_WEBHOOK_URL');
  const key = Deno.env.get('PUBLISH_WEBHOOK_KEY');

  if (!url || !key) {
    console.log('Автопостинг не настроен (PUBLISH_WEBHOOK_URL / PUBLISH_WEBHOOK_KEY) — пропускаем');
    return { dispatched: false };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-publish-key': key },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Автопостинг отказал:', response.status, text.slice(0, 300));
      return { dispatched: false, error: `HTTP ${response.status}` };
    }

    return { dispatched: true };
  } catch (error) {
    console.error('Автопостинг недоступен:', error);
    return { dispatched: false, error: error instanceof Error ? error.message : 'unknown' };
  }
}
