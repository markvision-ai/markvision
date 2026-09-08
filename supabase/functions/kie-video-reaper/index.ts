import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  adminClient,
  callKie,
  corsHeaders,
  dispatchToPublishing,
  extractResultUrls,
  json,
  normalizeState,
  persistVideo,
} from '../_shared/kie.ts';

/**
 * Подбирает зависшие задачи: колбэк мог не дойти — сеть, деплой, ошибка на
 * нашей стороне. Раз в несколько минут дёргается по расписанию (pg_cron или
 * n8n) и опрашивает задачи, которые давно не двигались.
 *
 * Доступ по заголовку x-automation-key, как у остальных фоновых функций.
 */

// Генерация идёт минутами: раньше пяти дёргать бессмысленно.
const STALE_AFTER_MINUTES = 5;
// Через сутки без результата задача считается потерянной.
const GIVE_UP_AFTER_HOURS = 24;
const BATCH_SIZE = 20;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const automationKey = Deno.env.get('AUTOMATION_KEY');
    if (!automationKey) {
      return json({ error: 'AUTOMATION_KEY не задан' }, 500);
    }
    if (req.headers.get('x-automation-key') !== automationKey) {
      return json({ error: 'unauthorized' }, 401);
    }

    const KIE_API_KEY = Deno.env.get('KIE_API_KEY');
    if (!KIE_API_KEY) return json({ error: 'KIE_API_KEY is not configured' }, 500);

    const supabaseAdmin = adminClient();
    const staleBefore = new Date(Date.now() - STALE_AFTER_MINUTES * 60_000).toISOString();
    const giveUpBefore = new Date(Date.now() - GIVE_UP_AFTER_HOURS * 3_600_000).toISOString();

    const { data: stale, error } = await supabaseAdmin
      .from('kie_video_tasks')
      .select('*')
      .in('state', ['pending', 'running'])
      .lt('updated_at', staleBefore)
      .order('updated_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (error) return json({ error: error.message }, 500);
    if (!stale?.length) return json({ checked: 0, finished: 0, failed: 0, abandoned: 0 });

    let finished = 0;
    let failed = 0;
    let abandoned = 0;

    for (const task of stale) {
      // Сутки без движения — дальше опрашивать смысла нет, логи kie.ai
      // живут два месяца, разобраться можно там.
      if (task.created_at < giveUpBefore) {
        await supabaseAdmin
          .from('kie_video_tasks')
          .update({ state: 'failed', error: `Нет результата за ${GIVE_UP_AFTER_HOURS} ч — проверьте kie.ai/logs` })
          .eq('task_id', task.task_id);
        abandoned++;
        continue;
      }

      const result = await callKie<Record<string, unknown>>(
        KIE_API_KEY,
        `/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(task.task_id)}`,
      );

      if (!result.ok) {
        // 429 — просто попали в лимит, вернёмся на следующем тике.
        if (result.status === 429) break;
        console.error(`Опрос задачи ${task.task_id} не удался: ${result.error}`);
        continue;
      }

      const record = result.data ?? {};
      const state = normalizeState(record);

      if (state === 'failed') {
        await supabaseAdmin
          .from('kie_video_tasks')
          .update({
            state,
            error: String(record.failMsg ?? record.failureReason ?? 'Генерация не удалась'),
          })
          .eq('task_id', task.task_id);
        failed++;
        continue;
      }

      if (state !== 'success') {
        // Двигаем updated_at, чтобы задача ушла в конец очереди опроса.
        await supabaseAdmin
          .from('kie_video_tasks')
          .update({ state })
          .eq('task_id', task.task_id);
        continue;
      }

      const urls = extractResultUrls(record);
      if (!urls.length) {
        await supabaseAdmin
          .from('kie_video_tasks')
          .update({ state: 'failed', error: 'kie.ai вернул успех без ссылки на видео' })
          .eq('task_id', task.task_id);
        failed++;
        continue;
      }

      const storedUrl = task.stored_url ?? await persistVideo(supabaseAdmin, task.task_id, urls[0]);

      await supabaseAdmin
        .from('kie_video_tasks')
        .update({ state: 'success', source_url: urls[0], stored_url: storedUrl, error: null })
        .eq('task_id', task.task_id);

      if (task.content_factory_id) {
        const videoUrl = storedUrl ?? urls[0];
        await supabaseAdmin
          .from('content_factory')
          .update({ video_url: videoUrl, sora_url: videoUrl, sora_status: 'ready' })
          .eq('id', task.content_factory_id);
      }

      if (task.auto_publish && !task.published_at) {
        const dispatch = await dispatchToPublishing({
          project_id: task.project_id,
          file_url: storedUrl ?? urls[0],
          base_caption: task.prompt ?? null,
          source: 'kie',
          source_ref: task.task_id,
        });
        if (dispatch.dispatched) {
          await supabaseAdmin
            .from('kie_video_tasks')
            .update({ published_at: new Date().toISOString() })
            .eq('task_id', task.task_id);
        }
      }

      finished++;
    }

    console.log(`Reaper: проверено ${stale.length}, готово ${finished}, ошибок ${failed}, брошено ${abandoned}`);
    return json({ checked: stale.length, finished, failed, abandoned });
  } catch (error) {
    console.error('kie-video-reaper error:', error);
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500);
  }
});
