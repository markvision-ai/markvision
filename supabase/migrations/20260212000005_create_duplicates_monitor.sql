-- =============================================================================
-- Создание view для мониторинга дублей во всех критических таблицах
-- Используется для проверки что дубли успешно устранены после исправлений
-- =============================================================================

CREATE OR REPLACE VIEW public.duplicates_monitor AS

-- Дубли в ad_insights
SELECT
    'ad_insights' as table_name,
    project_id,
    entity_id as key_field,
    date_start::text as date_field,
    COUNT(*) as duplicate_count,
    ARRAY_AGG(id) as duplicate_ids
FROM public.ad_insights
GROUP BY project_id, entity_id, date_start, date_stop
HAVING COUNT(*) > 1

UNION ALL

-- Дубли в daily_data
SELECT
    'daily_data' as table_name,
    project_id,
    date::text as key_field,
    NULL::text as date_field,
    COUNT(*) as duplicate_count,
    ARRAY_AGG(id) as duplicate_ids
FROM public.daily_data
GROUP BY project_id, date
HAVING COUNT(*) > 1

UNION ALL

-- Дубли в content_factory
SELECT
    'content_factory' as table_name,
    NULL::uuid as project_id,
    video_url as key_field,
    NULL::text as date_field,
    COUNT(*) as duplicate_count,
    ARRAY_AGG(id) as duplicate_ids
FROM public.content_factory
WHERE video_url IS NOT NULL
GROUP BY video_url
HAVING COUNT(*) > 1

UNION ALL

-- Дубли в instagram_posts_stats
SELECT
    'instagram_posts_stats' as table_name,
    project_id,
    post_id as key_field,
    posted_at::text as date_field,
    COUNT(*) as duplicate_count,
    ARRAY_AGG(id) as duplicate_ids
FROM public.instagram_posts_stats
WHERE post_id IS NOT NULL
GROUP BY project_id, post_id, posted_at
HAVING COUNT(*) > 1;

-- Комментарий для документации
COMMENT ON VIEW public.duplicates_monitor IS 'Мониторинг дублей во всех критических таблицах. После исправлений должен показывать пустой набор.';

-- Функция для проверки дублей
CREATE OR REPLACE FUNCTION public.check_duplicates()
RETURNS TABLE (
    table_name TEXT,
    duplicate_count INT,
    total_duplication INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        dm.table_name,
        COUNT(*)::INT as duplicate_count,
        SUM(dm.duplicate_count)::INT as total_duplication
    FROM public.duplicates_monitor dm
    GROUP BY dm.table_name
    ORDER BY total_duplication DESC;

    -- Если нет дублей, вернуть сообщение
    IF NOT FOUND THEN
        RETURN QUERY SELECT 'No duplicates found'::TEXT, 0::INT, 0::INT;
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.check_duplicates() IS 'Функция для быстрой проверки наличия дублей';
