import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  adminClient,
  attachVideoToContentCard,
  corsHeaders,
  dispatchToPublishing,
  extractResultUrls,
  json,
  normalizeState,
  persistVideo,
  taskIdOf,
} from '../_shared/kie.ts';

/**
 * Приёмник колбэка kie.ai. Вызывается их серверами, поэтому JWT здесь нет —
 * доступ закрыт секретом в query (?secret=...), который знает только kie.ai:
 * мы сами кладём его в callBackUrl при создании задачи.
 *
 * Задача колбэка: разобрать результат, переложить ролик в наше хранилище
 * (файлы kie.ai живут 14 дней) и, если задача помечена на автопубликацию,
 * отдать её в автопостинг.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const expected = Deno.env.get('KIE_CALLBACK_SECRET');
    if (!expected) {
      console.error('KIE_CALLBACK_SECRET не задан — колбэк принимать нельзя');
      return json({ error: 'callback is not configured' }, 500);
    }

    const given = new URL(req.url).searchParams.get('secret');
    if (given !== expected) {
      console.warn('Колбэк с неверным секретом отклонён');
      return json({ error: 'unauthorized' }, 401);
    }

    const payload = await req.json().catch(() => ({}));
    // kie.ai кладёт полезную часть либо в корень, либо в data.
    const record = (payload?.data ?? payload) as Record<string, unknown>;

    const taskId = taskIdOf(record);
    if (!taskId) {
      console.error('Колбэк без taskId:', JSON.stringify(payload).slice(0, 500));
      return json({ error: 'taskId missing' }, 400);
    }

    const supabaseAdmin = adminClient();
    const { data: task } = await supabaseAdmin
      .from('kie_video_tasks')
      .select('*')
      .eq('task_id', taskId)
      .maybeSingle();

    if (!task) {
      // Не наша задача либо запись не прошла при создании. Отвечаем 200,
      // чтобы kie.ai не молотил ретраями по мёртвому адресу.
      console.warn('Колбэк по неизвестной задаче:', taskId);
      return json({ ok: true, ignored: true });
    }

    if (task.state === 'success' && task.stored_url) {
      console.log('Повторный колбэк по уже готовой задаче:', taskId);
      return json({ ok: true, duplicate: true });
    }

    const state = normalizeState(record);

    if (state === 'failed') {
      const error = String(record.failMsg ?? record.failureReason ?? 'Генерация не удалась');
      await supabaseAdmin.from('kie_video_tasks').update({ state, error }).eq('task_id', taskId);
      console.log(`Задача ${taskId} завершилась ошибкой: ${error}`);
      return json({ ok: true, state });
    }

    if (state !== 'success') {
      await supabaseAdmin.from('kie_video_tasks').update({ state }).eq('task_id', taskId);
      return json({ ok: true, state });
    }

    const urls = extractResultUrls(record);
    if (!urls.length) {
      await supabaseAdmin
        .from('kie_video_tasks')
        .update({ state: 'failed', error: 'Колбэк без ссылки на видео' })
        .eq('task_id', taskId);
      console.error('Колбэк с успехом, но без ссылки:', taskId);
      return json({ ok: true, state: 'failed' });
    }

    const storedUrl = await persistVideo(supabaseAdmin, taskId, urls[0]);

    await supabaseAdmin
      .from('kie_video_tasks')
      .update({ state: 'success', source_url: urls[0], stored_url: storedUrl, error: null })
      .eq('task_id', taskId);

    // Готовый ролик кладём в карточку контента, если задача пришла оттуда.
    if (task.content_factory_id) {
      await attachVideoToContentCard(supabaseAdmin, task.content_factory_id, storedUrl ?? urls[0]);
    }

    let published = false;
    if (task.auto_publish && !task.published_at) {
      const result = await dispatchToPublishing({
        project_id: task.project_id,
        file_url: storedUrl ?? urls[0],
        base_caption: task.prompt ?? null,
        source: 'kie',
        source_ref: taskId,
      });
      published = result.dispatched;
      if (published) {
        await supabaseAdmin
          .from('kie_video_tasks')
          .update({ published_at: new Date().toISOString() })
          .eq('task_id', taskId);
      }
    }

    console.log(`Задача ${taskId} готова, публикация: ${published}`);
    return json({ ok: true, state: 'success', stored: Boolean(storedUrl), published });
  } catch (error) {
    console.error('kie-video-callback error:', error);
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500);
  }
});
