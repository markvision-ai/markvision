-- =============================================================================
-- Исправление дублирования в таблице ad_insights
-- Проблема: UNIQUE constraint без project_id позволял разным проектам перезаписывать данные друг друга
-- Решение: Добавить project_id в UNIQUE constraint
-- =============================================================================

-- Шаг 1: Найти и удалить дубли (оставляем последнюю запись)
WITH duplicates AS (
    SELECT
        entity_id,
        date_start,
        date_stop,
        ARRAY_AGG(id ORDER BY created_at DESC) as duplicate_ids
    FROM public.ad_insights
    GROUP BY entity_id, date_start, date_stop
    HAVING COUNT(*) > 1
)
DELETE FROM public.ad_insights
WHERE id IN (
    SELECT unnest(duplicate_ids[2:]) FROM duplicates
);

-- Шаг 2: Удалить старый некорректный constraint
ALTER TABLE public.ad_insights
DROP CONSTRAINT IF EXISTS ad_insights_entity_period_key;

-- Шаг 3: Добавить правильный UNIQUE constraint с project_id
ALTER TABLE public.ad_insights
ADD CONSTRAINT ad_insights_project_entity_period_key
UNIQUE (project_id, entity_id, date_start, date_stop);

-- Шаг 4: Добавить индекс для производительности
CREATE INDEX IF NOT EXISTS idx_ad_insights_project_entity
ON public.ad_insights(project_id, entity_id, date_start);

-- Шаг 5: Добавить комментарий для документации
COMMENT ON CONSTRAINT ad_insights_project_entity_period_key
ON public.ad_insights IS 'Один набор метрик на сущность (entity) в рамках проекта за определенный период';
