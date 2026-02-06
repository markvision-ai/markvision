-- =============================================================================
-- Создание представления content_items для дашборда "Цеха"
-- =============================================================================
-- instagram_posts_stats служит основной таблицей для хранения контента.
-- Это представление создаёт удобный интерфейс content_items для "Цехов".
-- =============================================================================

-- Удаляем старую таблицу/view если есть
DROP TABLE IF EXISTS public.content_items CASCADE;
DROP VIEW IF EXISTS public.content_items CASCADE;

-- Создаём представление content_items как alias для instagram_posts_stats
CREATE VIEW public.content_items AS
SELECT
    id,
    project_id,
    post_id,
    media_type,
    caption,
    permalink,
    media_url,

    -- Engagement метрики
    likes AS likes_count,
    comments AS comments_count,
    shares AS shares_count,
    saves AS saves_count,
    impressions,
    reach,

    -- Лиды
    leads_count,
    organic_leads_count,
    paid_leads AS paid_leads_count,
    revenue,

    -- Даты
    posted_at AS published_at,
    created_at,
    updated_at,

    -- Вычисляемые поля для "Цехов"
    CASE
        WHEN media_type = 'REELS' OR media_type = 'VIDEO' THEN 'reel'
        WHEN media_type = 'CAROUSEL_ALBUM' THEN 'carousel'
        WHEN media_type = 'IMAGE' THEN 'image'
        ELSE 'post'
    END AS content_type,

    -- Engagement rate (если есть reach)
    CASE
        WHEN reach > 0 THEN
            ROUND(((COALESCE(likes, 0) + COALESCE(comments, 0) + COALESCE(shares, 0) + COALESCE(saves, 0))::DECIMAL / reach) * 100, 2)
        ELSE 0
    END AS engagement_rate,

    -- Конверсия в лиды
    CASE
        WHEN reach > 0 THEN
            ROUND((COALESCE(organic_leads_count, 0)::DECIMAL / reach) * 100, 4)
        ELSE 0
    END AS lead_conversion_rate

FROM public.instagram_posts_stats;

-- Комментарий для документации
COMMENT ON VIEW public.content_items IS 'Представление для дашборда "Цеха" - контент с метриками вовлеченности и лидами';

-- =============================================================================
-- Функция для получения топ контента по лидам
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_top_content_by_leads(
    p_project_id UUID,
    p_limit INTEGER DEFAULT 10,
    p_content_type TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    post_id TEXT,
    content_type TEXT,
    caption TEXT,
    permalink TEXT,
    organic_leads_count INTEGER,
    reach INTEGER,
    engagement_rate DECIMAL,
    lead_conversion_rate DECIMAL,
    published_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ci.id,
        ci.post_id,
        ci.content_type,
        ci.caption,
        ci.permalink,
        ci.organic_leads_count::INTEGER,
        ci.reach::INTEGER,
        ci.engagement_rate,
        ci.lead_conversion_rate,
        ci.published_at
    FROM public.content_items ci
    WHERE ci.project_id = p_project_id
      AND (p_content_type IS NULL OR ci.content_type = p_content_type)
      AND ci.organic_leads_count > 0
    ORDER BY ci.organic_leads_count DESC
    LIMIT p_limit;
END;
$$;

-- =============================================================================
-- Функция для статистики "Цехов" по типам контента
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_content_workshop_stats(
    p_project_id UUID,
    p_date_from DATE DEFAULT NULL,
    p_date_to DATE DEFAULT NULL
)
RETURNS TABLE (
    content_type TEXT,
    total_items BIGINT,
    total_reach BIGINT,
    total_impressions BIGINT,
    total_likes BIGINT,
    total_comments BIGINT,
    total_organic_leads BIGINT,
    avg_engagement_rate DECIMAL,
    avg_lead_conversion_rate DECIMAL
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ci.content_type,
        COUNT(*)::BIGINT AS total_items,
        SUM(ci.reach)::BIGINT AS total_reach,
        SUM(ci.impressions)::BIGINT AS total_impressions,
        SUM(ci.likes_count)::BIGINT AS total_likes,
        SUM(ci.comments_count)::BIGINT AS total_comments,
        SUM(ci.organic_leads_count)::BIGINT AS total_organic_leads,
        ROUND(AVG(ci.engagement_rate), 2) AS avg_engagement_rate,
        ROUND(AVG(ci.lead_conversion_rate), 4) AS avg_lead_conversion_rate
    FROM public.content_items ci
    WHERE ci.project_id = p_project_id
      AND (p_date_from IS NULL OR ci.published_at >= p_date_from)
      AND (p_date_to IS NULL OR ci.published_at <= p_date_to)
    GROUP BY ci.content_type
    ORDER BY total_organic_leads DESC;
END;
$$;

-- =============================================================================
-- Проверка
-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE 'content_items view created successfully';
    RAISE NOTICE 'Functions created: get_top_content_by_leads, get_content_workshop_stats';
END
$$;
