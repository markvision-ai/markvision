-- =============================================================================
-- Исправление дублирования в таблице content_factory
-- Проблема: Отсутствие UNIQUE constraint позволяло создавать дубли при каждом запуске n8n workflow
-- Решение: Добавить UNIQUE constraint на video_url
-- =============================================================================

-- Шаг 1: Удалить дубли по video_url (оставляем последнюю запись)
WITH duplicates AS (
    SELECT
        video_url,
        MAX(created_at) as latest_created_at
    FROM public.content_factory
    WHERE video_url IS NOT NULL
    GROUP BY video_url
    HAVING COUNT(*) > 1
)
DELETE FROM public.content_factory cf
WHERE EXISTS (
    SELECT 1 FROM duplicates d
    WHERE cf.video_url = d.video_url
    AND cf.created_at < d.latest_created_at
);

-- Шаг 2: Добавить UNIQUE constraint
ALTER TABLE public.content_factory
ADD CONSTRAINT content_factory_video_url_key
UNIQUE (video_url);

-- Шаг 3: Добавить индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_content_factory_video_url
ON public.content_factory(video_url);

-- Шаг 4: Добавить комментарий для документации
COMMENT ON CONSTRAINT content_factory_video_url_key
ON public.content_factory IS 'Каждый пост обрабатывается только один раз - по URL';
