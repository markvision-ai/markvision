-- =============================================================================
-- Исправление дублирования в таблице instagram_posts_stats
-- Проблема: Edge Function использует onConflict, но UNIQUE constraint может быть некорректным
-- Решение: Добавить UNIQUE constraint (project_id, post_id)
-- =============================================================================

-- Шаг 1: Удалить дубли по (project_id, post_id) - оставляем последнюю запись
WITH duplicates AS (
    SELECT
        project_id,
        post_id,
        MAX(created_at) as latest_created_at
    FROM public.instagram_posts_stats
    WHERE post_id IS NOT NULL
    GROUP BY project_id, post_id
    HAVING COUNT(*) > 1
)
DELETE FROM public.instagram_posts_stats ips
WHERE EXISTS (
    SELECT 1 FROM duplicates d
    WHERE ips.project_id = d.project_id
    AND ips.post_id = d.post_id
    AND ips.created_at < d.latest_created_at
);

-- Шаг 2: Удалить старый constraint если есть
ALTER TABLE public.instagram_posts_stats
DROP CONSTRAINT IF EXISTS instagram_posts_stats_unique_key;

ALTER TABLE public.instagram_posts_stats
DROP CONSTRAINT IF EXISTS instagram_posts_stats_project_post_key;

-- Шаг 3: Добавить правильный UNIQUE constraint
ALTER TABLE public.instagram_posts_stats
ADD CONSTRAINT instagram_posts_stats_project_post_key
UNIQUE (project_id, post_id);

-- Шаг 4: Добавить индекс для производительности (для сортировки по времени)
CREATE INDEX IF NOT EXISTS idx_instagram_posts_stats_project_posted
ON public.instagram_posts_stats(project_id, posted_at DESC);

-- Шаг 5: Добавить индекс для быстрого поиска по проекту
CREATE INDEX IF NOT EXISTS idx_instagram_posts_stats_project
ON public.instagram_posts_stats(project_id);

-- Шаг 6: Добавить комментарий для документации
COMMENT ON CONSTRAINT instagram_posts_stats_project_post_key
ON public.instagram_posts_stats IS 'Один набор статистики на пост в рамках проекта';
