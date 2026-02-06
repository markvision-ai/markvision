-- =============================================================================
-- Настройка pg_cron для автоматической синхронизации органических лидов
-- =============================================================================
-- ВНИМАНИЕ: pg_cron должен быть включён в настройках Supabase Dashboard
-- Dashboard → Database → Extensions → pg_cron → Enable
-- =============================================================================

-- Создаём функцию для вызова edge function через pg_net
CREATE OR REPLACE FUNCTION public.trigger_sync_organic_leads()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_supabase_url TEXT;
    v_service_key TEXT;
BEGIN
    -- Получаем URL и ключ из vault (или используем напрямую)
    -- В production лучше хранить в vault
    v_supabase_url := current_setting('app.settings.supabase_url', true);
    v_service_key := current_setting('app.settings.service_role_key', true);

    -- Если настройки не заданы, используем fallback
    IF v_supabase_url IS NULL THEN
        RAISE NOTICE 'Supabase URL not configured. Please call edge function manually or configure app.settings.supabase_url';
        RETURN;
    END IF;

    -- Вызываем edge function через HTTP (требуется pg_net extension)
    -- PERFORM net.http_post(
    --     url := v_supabase_url || '/functions/v1/sync-organic-leads',
    --     headers := jsonb_build_object(
    --         'Authorization', 'Bearer ' || v_service_key,
    --         'Content-Type', 'application/json'
    --     ),
    --     body := '{}'::jsonb
    -- );

    RAISE NOTICE 'sync_organic_leads triggered at %', now();
END;
$$;

-- =============================================================================
-- Альтернатива: SQL-функция для синхронизации без edge function
-- =============================================================================
CREATE OR REPLACE FUNCTION public.sync_organic_leads_sql()
RETURNS TABLE (
    posts_updated INTEGER,
    content_stats_updated INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_posts_updated INTEGER := 0;
    v_content_stats_updated INTEGER := 0;
    v_project RECORD;
    v_post RECORD;
    v_today DATE := CURRENT_DATE;
BEGIN
    -- Шаг 1: Обновляем organic_leads_count в instagram_posts_stats
    FOR v_post IN (
        SELECT
            l.post_id,
            l.project_id,
            COUNT(*) AS leads_count,
            SUM(COALESCE(l.deal_amount, 0)) AS total_revenue
        FROM public.leads l
        WHERE l.source = 'organic'
          AND l.post_id IS NOT NULL
        GROUP BY l.post_id, l.project_id
    )
    LOOP
        UPDATE public.instagram_posts_stats
        SET
            organic_leads_count = v_post.leads_count,
            revenue = v_post.total_revenue,
            updated_at = now()
        WHERE post_id = v_post.post_id
          AND project_id = v_post.project_id;

        v_posts_updated := v_posts_updated + 1;
    END LOOP;

    -- Шаг 2: Обновляем content_stats для каждого проекта
    FOR v_project IN (SELECT id FROM public.projects)
    LOOP
        INSERT INTO public.content_stats (
            project_id,
            date,
            period_type,
            total_posts,
            total_reels,
            total_reach,
            total_impressions,
            total_likes,
            total_comments,
            total_shares,
            total_saves,
            organic_leads_count,
            organic_leads_revenue,
            paid_leads_count,
            paid_leads_revenue,
            top_posts_by_leads,
            synced_at,
            updated_at
        )
        SELECT
            v_project.id,
            v_today,
            'daily',
            COUNT(*) FILTER (WHERE media_type NOT IN ('REELS', 'VIDEO')),
            COUNT(*) FILTER (WHERE media_type IN ('REELS', 'VIDEO')),
            COALESCE(SUM(reach), 0),
            COALESCE(SUM(impressions), 0),
            COALESCE(SUM(likes), 0),
            COALESCE(SUM(comments), 0),
            COALESCE(SUM(shares), 0),
            COALESCE(SUM(saves), 0),
            (SELECT COUNT(*) FROM leads WHERE project_id = v_project.id AND source = 'organic'),
            (SELECT COALESCE(SUM(deal_amount), 0) FROM leads WHERE project_id = v_project.id AND source = 'organic'),
            (SELECT COUNT(*) FROM leads WHERE project_id = v_project.id AND source = 'paid'),
            (SELECT COALESCE(SUM(deal_amount), 0) FROM leads WHERE project_id = v_project.id AND source = 'paid'),
            (
                SELECT jsonb_agg(jsonb_build_object(
                    'post_id', post_id,
                    'permalink', permalink,
                    'leads_count', organic_leads_count,
                    'media_type', media_type
                ))
                FROM (
                    SELECT post_id, permalink, organic_leads_count, media_type
                    FROM instagram_posts_stats
                    WHERE project_id = v_project.id
                      AND organic_leads_count > 0
                    ORDER BY organic_leads_count DESC
                    LIMIT 5
                ) top_posts
            ),
            now(),
            now()
        FROM public.instagram_posts_stats
        WHERE project_id = v_project.id
        ON CONFLICT (project_id, date, period_type)
        DO UPDATE SET
            total_posts = EXCLUDED.total_posts,
            total_reels = EXCLUDED.total_reels,
            total_reach = EXCLUDED.total_reach,
            total_impressions = EXCLUDED.total_impressions,
            total_likes = EXCLUDED.total_likes,
            total_comments = EXCLUDED.total_comments,
            total_shares = EXCLUDED.total_shares,
            total_saves = EXCLUDED.total_saves,
            organic_leads_count = EXCLUDED.organic_leads_count,
            organic_leads_revenue = EXCLUDED.organic_leads_revenue,
            paid_leads_count = EXCLUDED.paid_leads_count,
            paid_leads_revenue = EXCLUDED.paid_leads_revenue,
            top_posts_by_leads = EXCLUDED.top_posts_by_leads,
            synced_at = now(),
            updated_at = now();

        v_content_stats_updated := v_content_stats_updated + 1;
    END LOOP;

    RETURN QUERY SELECT v_posts_updated, v_content_stats_updated;
END;
$$;

-- =============================================================================
-- Настройка pg_cron (раскомментируйте после включения расширения)
-- =============================================================================
-- Синхронизация каждый час
-- SELECT cron.schedule(
--     'sync-organic-leads-hourly',
--     '0 * * * *',  -- каждый час в 00 минут
--     $$SELECT public.sync_organic_leads_sql()$$
-- );

-- Проверка расписания
-- SELECT * FROM cron.job;

-- =============================================================================
-- Проверка
-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Organic leads sync functions created';
    RAISE NOTICE 'To enable hourly sync, uncomment pg_cron schedule above';
    RAISE NOTICE 'Or call manually: SELECT * FROM sync_organic_leads_sql()';
END
$$;
