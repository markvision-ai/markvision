import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  adminClient,
  callKie,
  corsHeaders,
  dispatchToPublishing,
  extractResultUrls,
  json,
  normalizeState,
  persistVideo,
  RATE_MAX_IN_WINDOW,
  RATE_WINDOW_SECONDS,
  taskIdOf,
} from '../_shared/kie.ts';

// Генерации дорогие, поэтому лимит на пользователя держим отдельно от лимита kie.ai.
const RATE_LIMITS = {
  default: { requests: 20, windowSeconds: 3600 },
  admin: { requests: 100, windowSeconds: 3600 },
};

// Чтение статуса и баланса кредиты не тратит — квоту не трогаем.
const FREE_ACTIONS = new Set(['credits', 'status', 'list']);

type Action = 'credits' | 'create' | 'status' | 'list';

interface KieRequest {
  action: Action;
  model?: string;
  input?: Record<string, unknown>;
  prompt?: string;
  taskId?: string;
  projectId?: string;
  contentFactoryId?: string;
  autoPublish?: boolean;
  limit?: number;
}

async function checkRateLimitAndLog(
  userId: string,
  service: string,
  endpoint: string,
): Promise<{ allowed: boolean; remaining: number }> {
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceRoleKey) return { allowed: true, remaining: -1 };

  const supabaseAdmin = adminClient();

  const { data: isAdmin } = await supabaseAdmin.rpc('has_role', {
    _user_id: userId,
    _role: 'admin',
  });

  const limit = isAdmin ? RATE_LIMITS.admin : RATE_LIMITS.default;
  const windowStart = new Date(Date.now() - limit.windowSeconds * 1000).toISOString();

  const { count } = await supabaseAdmin
    .from('api_key_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('service', service)
    .gte('created_at', windowStart);

  const currentCount = count || 0;
  const allowed = currentCount < limit.requests;

  await supabaseAdmin.from('api_key_usage').insert({
    service,
    user_id: userId,
    endpoint,
    request_count: 1,
  });

  console.log(`Rate limit: user=${userId}, service=${service}, count=${currentCount}/${limit.requests}`);

  return { allowed, remaining: Math.max(0, limit.requests - currentCount - 1) };
}

/**
 * Лимит самого kie.ai: 20 генераций за 10 секунд на аккаунт. Отброшенный
 * запрос в очередь не встаёт, поэтому дешевле придержать его у себя, чем
 * ловить 429 и терять задачу. Считаем по нашей же таблице задач.
 */
async function accountWindowIsFull(): Promise<boolean> {
  const supabaseAdmin = adminClient();
  const windowStart = new Date(Date.now() - RATE_WINDOW_SECONDS * 1000).toISOString();

  const { count, error } = await supabaseAdmin
    .from('kie_video_tasks')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', windowStart);

  if (error) {
    console.error('Не удалось посчитать окно лимита:', error.message);
    return false;
  }

  return (count || 0) >= RATE_MAX_IN_WINDOW;
}

/**
 * Достаёт финальную ссылку, перекладывает ролик в наш бакет и, если задача
 * помечена autoPublish, отдаёт его в автопостинг. Возвращает строку задачи.
 */
async function finalizeTask(taskId: string, record: Record<string, unknown>) {
  const supabaseAdmin = adminClient();
  const state = normalizeState(record);

  const { data: task } = await supabaseAdmin
    .from('kie_video_tasks')
    .select('*')
    .eq('task_id', taskId)
    .maybeSingle();

  if (state !== 'success') {
    const patch = state === 'failed'
      ? { state, error: String(record.failMsg ?? record.failureReason ?? 'Генерация не удалась') }
      : { state };
    await supabaseAdmin.from('kie_video_tasks').update(patch).eq('task_id', taskId);
    return { taskId, state, videoUrls: [], storedUrl: null, error: patch.error ?? null };
  }

  const urls = extractResultUrls(record);
  if (!urls.length) {
    await supabaseAdmin
      .from('kie_video_tasks')
      .update({ state: 'failed', error: 'kie.ai вернул успех без ссылки на видео' })
      .eq('task_id', taskId);
    return { taskId, state: 'failed' as const, videoUrls: [], storedUrl: null, error: 'kie.ai вернул успех без ссылки на видео' };
  }

  // Уже переложенный ролик второй раз не качаем: колбэк и опрос могут прийти оба.
  const storedUrl = task?.stored_url ?? await persistVideo(supabaseAdmin, taskId, urls[0]);

  await supabaseAdmin
    .from('kie_video_tasks')
    .update({ state: 'success', source_url: urls[0], stored_url: storedUrl, error: null })
    .eq('task_id', taskId);

  if (task?.auto_publish && !task?.published_at) {
    const { dispatched } = await dispatchToPublishing({
      project_id: task.project_id,
      file_url: storedUrl ?? urls[0],
      base_caption: task.prompt ?? null,
      source: 'kie',
      source_ref: taskId,
    });
    if (dispatched) {
      await supabaseAdmin
        .from('kie_video_tasks')
        .update({ published_at: new Date().toISOString() })
        .eq('task_id', taskId);
    }
  }

  return { taskId, state: 'success' as const, videoUrls: urls, storedUrl, error: null };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return json({ error: 'Missing authorization header' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return json({ error: 'Invalid or expired token' }, 401);
    }

    const KIE_API_KEY = Deno.env.get('KIE_API_KEY');
    if (!KIE_API_KEY) return json({ error: 'KIE_API_KEY is not configured' }, 500);

    const body: KieRequest = await req.json();
    const action = body.action;

    if (!action || !['credits', 'create', 'status', 'list'].includes(action)) {
      return json({ error: "Invalid action: 'credits', 'create', 'status' или 'list'" }, 400);
    }

    if (!FREE_ACTIONS.has(action)) {
      const { allowed, remaining } = await checkRateLimitAndLog(user.id, 'kie_video', 'kie-video');
      if (!allowed) {
        return json(
          { error: 'Превышен часовой лимит генераций. Попробуйте позже.', retryAfter: 3600 },
          429,
          { 'Retry-After': '3600' },
        );
      }
      console.log(`kie-video create by ${user.id}, remaining: ${remaining}`);
    }

    if (action === 'credits') {
      const result = await callKie<number | { credits?: number }>(KIE_API_KEY, '/api/v1/chat/credit');
      if (!result.ok) return json({ error: result.error }, result.status);
      const credits = typeof result.data === 'number' ? result.data : (result.data?.credits ?? null);
      return json({ credits });
    }

    if (action === 'list') {
      const supabaseAdmin = adminClient();
      const { data, error } = await supabaseAdmin
        .from('kie_video_tasks')
        .select('task_id, model, prompt, state, stored_url, source_url, error, auto_publish, published_at, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(Math.min(body.limit ?? 20, 100));

      if (error) return json({ error: error.message }, 500);
      return json({ tasks: data ?? [] });
    }

    if (action === 'create') {
      if (!body.model || !body.input || typeof body.input !== 'object') {
        return json({ error: 'Нужны поля model и input' }, 400);
      }

      if (await accountWindowIsFull()) {
        return json(
          {
            error: `Окно лимита kie.ai заполнено (${RATE_MAX_IN_WINDOW} за ${RATE_WINDOW_SECONDS}с). Повторите через несколько секунд.`,
            retryAfter: RATE_WINDOW_SECONDS,
          },
          429,
          { 'Retry-After': String(RATE_WINDOW_SECONDS) },
        );
      }

      // Колбэк снимает нужду в поллинге: kie.ai сам постучится, когда закончит.
      const callbackBase = Deno.env.get('KIE_CALLBACK_URL');
      const callbackSecret = Deno.env.get('KIE_CALLBACK_SECRET');
      const callBackUrl = callbackBase && callbackSecret
        ? `${callbackBase}?secret=${encodeURIComponent(callbackSecret)}`
        : undefined;

      const result = await callKie<Record<string, unknown>>(
        KIE_API_KEY,
        '/api/v1/jobs/createTask',
        {
          method: 'POST',
          body: { model: body.model, input: body.input, ...(callBackUrl ? { callBackUrl } : {}) },
        },
      );

      if (!result.ok) {
        return json(
          { error: result.error },
          result.status,
          result.retryAfter ? { 'Retry-After': String(result.retryAfter) } : {},
        );
      }

      const taskId = taskIdOf(result.data ?? {});
      if (!taskId) return json({ error: 'kie.ai не вернул taskId' }, 502);

      const supabaseAdmin = adminClient();
      const { error: insertError } = await supabaseAdmin.from('kie_video_tasks').insert({
        task_id: taskId,
        project_id: body.projectId ?? null,
        content_factory_id: body.contentFactoryId ?? null,
        user_id: user.id,
        model: body.model,
        prompt: body.prompt ?? String(body.input.prompt ?? ''),
        input: body.input,
        state: 'pending',
        auto_publish: Boolean(body.autoPublish),
      });

      // Задача у kie.ai уже создана и кредиты списаны — обрыв записи в базу
      // не повод возвращать ошибку, иначе клиент потеряет taskId.
      if (insertError) console.error('Не удалось записать задачу:', insertError.message);

      console.log(`kie.ai task created: ${taskId} (model=${body.model}, callback=${Boolean(callBackUrl)})`);
      return json({
        taskId,
        model: body.model,
        state: 'pending' as const,
        videoUrls: [],
        storedUrl: null,
        callbackEnabled: Boolean(callBackUrl),
      });
    }

    // action === 'status'
    if (!body.taskId) return json({ error: 'Нужно поле taskId' }, 400);

    const result = await callKie<Record<string, unknown>>(
      KIE_API_KEY,
      `/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(body.taskId)}`,
    );

    if (!result.ok) {
      return json(
        { error: result.error },
        result.status,
        result.retryAfter ? { 'Retry-After': String(result.retryAfter) } : {},
      );
    }

    return json(await finalizeTask(body.taskId, result.data ?? {}));
  } catch (error) {
    console.error('kie-video error:', error);
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500);
  }
});
