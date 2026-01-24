-- =====================================================
-- Проверка данных "Новые подписчики" в Supabase
-- =====================================================

-- 1. Проверка структуры таблицы content_production_stats
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'content_production_stats'
ORDER BY ordinal_position;

-- 2. Проверка наличия столбца followers
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'content_production_stats'
  AND column_name = 'followers';

-- 3. Просмотр всех данных из content_production_stats
SELECT 
    id,
    project_id,
    period_start,
    period_end,
    publications,
    stories,
    reach,
    comments,
    followers,  -- <-- ЭТО СТОЛБЕЦ ДЛЯ "НОВЫЕ ПОДПИСЧИКИ"
    diagnostics,
    sales,
    revenue,
    created_at,
    updated_at
FROM public.content_production_stats
ORDER BY period_start DESC, period_end DESC
LIMIT 10;

-- 4. Проверка данных для конкретного проекта
-- Замени '64c94e87-630c-470e-8ab1-8f7c8c835efa' на свой project_id
SELECT 
    period_start,
    period_end,
    publications,
    reach,
    comments,
    followers,  -- <-- "НОВЫЕ ПОДПИСЧИКИ"
    diagnostics,
    sales,
    revenue
FROM public.content_production_stats
WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa'
ORDER BY period_start DESC, period_end DESC;

-- 5. Проверка последних записей с подписчиками
SELECT 
    period_start,
    period_end,
    followers,
    publications,
    reach,
    comments,
    updated_at
FROM public.content_production_stats
WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa'
  AND followers > 0
ORDER BY updated_at DESC
LIMIT 5;

-- 6. Статистика по подписчикам
SELECT 
    COUNT(*) as total_records,
    SUM(followers) as total_followers,
    AVG(followers) as avg_followers,
    MAX(followers) as max_followers,
    MIN(followers) as min_followers
FROM public.content_production_stats
WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa';

-- 7. Проверка, есть ли данные за последний период
SELECT 
    period_start,
    period_end,
    followers,
    publications,
    reach,
    comments
FROM public.content_production_stats
WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa'
  AND period_start = '2026-01-01'
  AND period_end >= CURRENT_DATE - INTERVAL '2 days'
ORDER BY period_end DESC
LIMIT 1;
