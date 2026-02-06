-- =============================================================================
-- КОНТЕНТ-ЗАВОД: Полная настройка автоматизации и данных
-- =============================================================================

-- =============================================================================
-- ЧАСТЬ 1: Расширяем instagram_posts_stats для поддержки статусов Цехов
-- =============================================================================

-- Добавляем поля для workflow Цехов
ALTER TABLE public.instagram_posts_stats
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'idea',
ADD COLUMN IF NOT EXISTS workshop TEXT DEFAULT 'loading', -- loading, ai_analysis, ready
ADD COLUMN IF NOT EXISTS ai_analysis_result JSONB,
ADD COLUMN IF NOT EXISTS ai_score INTEGER,
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS idea_text TEXT,
ADD COLUMN IF NOT EXISTS content_plan_id UUID;

-- Комментарии
COMMENT ON COLUMN public.instagram_posts_stats.status IS 'Статус контента: idea, draft, production, review, scheduled, published, archived';
COMMENT ON COLUMN public.instagram_posts_stats.workshop IS 'Текущий Цех: loading (Загрузка идей), ai_analysis (AI Анализ), ready (Готово к публикации)';
COMMENT ON COLUMN public.instagram_posts_stats.ai_score IS 'AI оценка потенциала контента (0-100)';

-- Индекс для быстрой фильтрации по статусу/цеху
CREATE INDEX IF NOT EXISTS idx_instagram_posts_status
ON public.instagram_posts_stats(project_id, status, workshop);

-- =============================================================================
-- ЧАСТЬ 2: Пересоздаём content_items view с новыми полями
-- =============================================================================

DROP VIEW IF EXISTS public.content_items CASCADE;

CREATE VIEW public.content_items AS
SELECT
    id,
    project_id,
    post_id,
    media_type,
    caption,
    permalink,
    media_url,

    -- Статус и Цех
    status,
    workshop,
    idea_text,
    ai_analysis_result,
    ai_score,
    scheduled_at,

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

    -- Вычисляемые поля
    CASE
        WHEN media_type = 'REELS' OR media_type = 'VIDEO' THEN 'reel'
        WHEN media_type = 'CAROUSEL_ALBUM' THEN 'carousel'
        WHEN media_type = 'IMAGE' THEN 'image'
        WHEN media_type IS NULL AND idea_text IS NOT NULL THEN 'idea'
        ELSE 'post'
    END AS content_type,

    CASE
        WHEN reach > 0 THEN
            ROUND(((COALESCE(likes, 0) + COALESCE(comments, 0) + COALESCE(shares, 0) + COALESCE(saves, 0))::DECIMAL / reach) * 100, 2)
        ELSE 0
    END AS engagement_rate,

    CASE
        WHEN reach > 0 THEN
            ROUND((COALESCE(organic_leads_count, 0)::DECIMAL / reach) * 100, 4)
        ELSE 0
    END AS lead_conversion_rate

FROM public.instagram_posts_stats;

COMMENT ON VIEW public.content_items IS 'Контент для Цехов Контент-Завода с метриками и статусами';

-- =============================================================================
-- ЧАСТЬ 3: Расширяем content_stats для Plan/Fact
-- =============================================================================

ALTER TABLE public.content_stats
ADD COLUMN IF NOT EXISTS plan_followers INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS plan_reach INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS plan_comments INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS plan_leads INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS plan_sales INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS plan_revenue DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS fact_followers INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS fact_reach INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS fact_comments INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS fact_sales INTEGER DEFAULT 0;

COMMENT ON TABLE public.content_stats IS 'Статистика Контент-Завода с Plan/Fact для дашборда';

-- =============================================================================
-- ЧАСТЬ 4: SQL View для органических лидов и продаж
-- =============================================================================

DROP VIEW IF EXISTS public.organic_leads_summary CASCADE;

CREATE VIEW public.organic_leads_summary AS
SELECT
    project_id,
    COUNT(*) FILTER (WHERE source = 'organic') AS organic_leads_count,
    COUNT(*) FILTER (WHERE source = 'organic' AND status IN ('sold', 'won', 'completed', 'sale')) AS organic_sales_count,
    COALESCE(SUM(deal_amount) FILTER (WHERE source = 'organic'), 0) AS organic_leads_revenue,
    COALESCE(SUM(deal_amount) FILTER (WHERE source = 'organic' AND status IN ('sold', 'won', 'completed', 'sale')), 0) AS organic_sales_revenue,
    COUNT(*) FILTER (WHERE source = 'paid') AS paid_leads_count,
    COUNT(*) FILTER (WHERE source = 'paid' AND status IN ('sold', 'won', 'completed', 'sale')) AS paid_sales_count,
    COALESCE(SUM(deal_amount) FILTER (WHERE source = 'paid'), 0) AS paid_leads_revenue,
    COUNT(*) AS total_leads_count,
    COALESCE(SUM(deal_amount), 0) AS total_revenue
FROM public.leads
GROUP BY project_id;

COMMENT ON VIEW public.organic_leads_summary IS 'Сводка по органическим и платным лидам/продажам для CRM';

-- Детальный view по постам
DROP VIEW IF EXISTS public.content_leads_detail CASCADE;

CREATE VIEW public.content_leads_detail AS
SELECT
    l.project_id,
    l.post_id,
    ips.caption,
    ips.permalink,
    ips.media_type,
    ips.reach,
    ips.impressions,
    COUNT(*) AS leads_from_post,
    COUNT(*) FILTER (WHERE l.status IN ('sold', 'won', 'completed', 'sale')) AS sales_from_post,
    COALESCE(SUM(l.deal_amount), 0) AS revenue_from_post,
    CASE
        WHEN ips.reach > 0 THEN ROUND((COUNT(*)::DECIMAL / ips.reach) * 100, 4)
        ELSE 0
    END AS conversion_rate
FROM public.leads l
LEFT JOIN public.instagram_posts_stats ips
    ON l.post_id = ips.post_id AND l.project_id = ips.project_id
WHERE l.source = 'organic' AND l.post_id IS NOT NULL
GROUP BY l.project_id, l.post_id, ips.caption, ips.permalink, ips.media_type, ips.reach, ips.impressions
ORDER BY leads_from_post DESC;

COMMENT ON VIEW public.content_leads_detail IS 'Детальная статистика лидов по каждому посту';

-- =============================================================================
-- ЧАСТЬ 5: Функция для получения статистики Контент-Завода
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_content_factory_stats(p_project_id UUID)
RETURNS TABLE (
    -- Цеха
    ideas_count BIGINT,
    in_production_count BIGINT,
    ready_count BIGINT,
    published_count BIGINT,
    -- Органика
    organic_leads BIGINT,
    organic_sales BIGINT,
    organic_revenue DECIMAL,
    -- Plan/Fact текущий месяц
    plan_followers INTEGER,
    fact_followers INTEGER,
    plan_reach INTEGER,
    fact_reach BIGINT,
    plan_comments INTEGER,
    fact_comments BIGINT,
    plan_leads INTEGER,
    fact_leads BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH workshop_counts AS (
        SELECT
            COUNT(*) FILTER (WHERE status = 'idea' OR workshop = 'loading') AS ideas,
            COUNT(*) FILTER (WHERE status = 'production' OR workshop = 'ai_analysis') AS production,
            COUNT(*) FILTER (WHERE status IN ('review', 'scheduled') OR workshop = 'ready') AS ready,
            COUNT(*) FILTER (WHERE status = 'published') AS published
        FROM public.instagram_posts_stats
        WHERE project_id = p_project_id
    ),
    organic_stats AS (
        SELECT
            COUNT(*) FILTER (WHERE source = 'organic') AS leads,
            COUNT(*) FILTER (WHERE source = 'organic' AND status IN ('sold', 'won', 'completed', 'sale')) AS sales,
            COALESCE(SUM(deal_amount) FILTER (WHERE source = 'organic'), 0) AS revenue
        FROM public.leads
        WHERE project_id = p_project_id
    ),
    plan_fact AS (
        SELECT
            COALESCE(cs.plan_followers, 0) AS p_followers,
            COALESCE(cs.fact_followers, 0) AS f_followers,
            COALESCE(cs.plan_reach, 0) AS p_reach,
            COALESCE(cs.total_reach, 0)::BIGINT AS f_reach,
            COALESCE(cs.plan_comments, 0) AS p_comments,
            COALESCE(cs.total_comments, 0)::BIGINT AS f_comments,
            COALESCE(cs.plan_leads, 0) AS p_leads,
            COALESCE(cs.organic_leads_count, 0)::BIGINT AS f_leads
        FROM public.content_stats cs
        WHERE cs.project_id = p_project_id
          AND cs.date = date_trunc('month', CURRENT_DATE)::DATE
          AND cs.period_type = 'monthly'
        LIMIT 1
    )
    SELECT
        wc.ideas,
        wc.production,
        wc.ready,
        wc.published,
        os.leads,
        os.sales,
        os.revenue,
        COALESCE(pf.p_followers, 0),
        COALESCE(pf.f_followers, 0),
        COALESCE(pf.p_reach, 0),
        COALESCE(pf.f_reach, 0),
        COALESCE(pf.p_comments, 0),
        COALESCE(pf.f_comments, 0),
        COALESCE(pf.p_leads, 0),
        COALESCE(pf.f_leads, 0)
    FROM workshop_counts wc
    CROSS JOIN organic_stats os
    LEFT JOIN plan_fact pf ON true;
END;
$$;

-- =============================================================================
-- ЧАСТЬ 6: Автоматическая синхронизация через pg_cron
-- =============================================================================

-- Включаем pg_cron если ещё не включён
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Удаляем старое задание если есть
SELECT cron.unschedule('sync-organic-leads-hourly') WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'sync-organic-leads-hourly'
);

-- Создаём задание для синхронизации каждый час
SELECT cron.schedule(
    'sync-organic-leads-hourly',
    '0 * * * *',  -- каждый час в :00
    $$SELECT public.sync_organic_leads_sql()$$
);

-- Создаём задание для обновления fact данных каждые 6 часов
SELECT cron.schedule(
    'update-content-factory-fact',
    '0 */6 * * *',  -- каждые 6 часов
    $$
    UPDATE public.content_stats cs
    SET
        fact_followers = COALESCE((
            SELECT ig_followers_total
            FROM public.daily_data
            WHERE project_id = cs.project_id
            ORDER BY date DESC LIMIT 1
        ), 0),
        fact_reach = cs.total_reach,
        fact_comments = cs.total_comments,
        fact_sales = COALESCE((
            SELECT COUNT(*)
            FROM public.leads
            WHERE project_id = cs.project_id
              AND source = 'organic'
              AND status IN ('sold', 'won', 'completed', 'sale')
              AND created_at >= date_trunc('month', CURRENT_DATE)
        ), 0),
        updated_at = now()
    WHERE period_type = 'monthly'
      AND date = date_trunc('month', CURRENT_DATE)::DATE
    $$
);

-- =============================================================================
-- ЧАСТЬ 7: Тестовые данные для project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa'
-- =============================================================================

-- 2 идеи в статусе 'idea' (Цех 'Загрузка')
INSERT INTO public.instagram_posts_stats (
    project_id, post_id, status, workshop, idea_text, media_type, caption, created_at
) VALUES
(
    '64c94e87-630c-470e-8ab1-8f7c8c835efa',
    'idea_001_' || extract(epoch from now())::text,
    'idea',
    'loading',
    'Идея рилса: "5 ошибок при выборе клиники" - разбор типичных ошибок пациентов',
    NULL,
    NULL,
    now()
),
(
    '64c94e87-630c-470e-8ab1-8f7c8c835efa',
    'idea_002_' || extract(epoch from now())::text,
    'idea',
    'loading',
    'Идея поста: Кейс пациента - до/после с историей лечения',
    NULL,
    NULL,
    now()
)
ON CONFLICT DO NOTHING;

-- 2 рилса в статусе 'production' (Цех 'AI Анализ')
INSERT INTO public.instagram_posts_stats (
    project_id, post_id, status, workshop, media_type, caption, ai_score, ai_analysis_result, created_at
) VALUES
(
    '64c94e87-630c-470e-8ab1-8f7c8c835efa',
    'prod_001_' || extract(epoch from now())::text,
    'production',
    'ai_analysis',
    'REELS',
    'Как выбрать стоматолога? 🦷 5 важных критериев, которые спасут ваши зубы и кошелёк! #стоматология #здоровье',
    78,
    '{"hook_score": 85, "cta_score": 70, "predicted_engagement": "high", "suggestions": ["Добавить субтитры", "Усилить CTA в конце"]}'::jsonb,
    now()
),
(
    '64c94e87-630c-470e-8ab1-8f7c8c835efa',
    'prod_002_' || extract(epoch from now())::text,
    'production',
    'ai_analysis',
    'REELS',
    'Мифы о винирах, которые пора забыть 💎 Врач-ортопед развенчивает главные заблуждения',
    82,
    '{"hook_score": 90, "cta_score": 75, "predicted_engagement": "very_high", "suggestions": ["Отличный hook!", "Добавить цену в комментарии"]}'::jsonb,
    now()
)
ON CONFLICT DO NOTHING;

-- 1 готовый пост в статусе 'published' (Цех 'Готово')
INSERT INTO public.instagram_posts_stats (
    project_id, post_id, status, workshop, media_type, caption,
    likes, comments, shares, saves, reach, impressions,
    organic_leads_count, posted_at, created_at
) VALUES
(
    '64c94e87-630c-470e-8ab1-8f7c8c835efa',
    'pub_001_' || extract(epoch from now())::text,
    'published',
    'ready',
    'IMAGE',
    '✨ Результат работы нашей команды: красивая улыбка за 2 визита! Пациентка пришла с комплексами, а ушла с уверенностью 💪 Запись на консультацию в шапке профиля ☝️',
    1250,
    89,
    45,
    234,
    45000,
    52000,
    3,
    now() - interval '2 days',
    now() - interval '2 days'
)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- ЧАСТЬ 8: План на текущий месяц для project_id
-- =============================================================================

INSERT INTO public.content_stats (
    project_id,
    date,
    period_type,
    -- План
    plan_followers,
    plan_reach,
    plan_comments,
    plan_leads,
    plan_sales,
    plan_revenue,
    -- Факт (начальные значения)
    fact_followers,
    fact_reach,
    fact_comments,
    organic_leads_count,
    organic_leads_revenue,
    -- Контент
    total_posts,
    total_reels,
    synced_at
) VALUES (
    '64c94e87-630c-470e-8ab1-8f7c8c835efa',
    date_trunc('month', CURRENT_DATE)::DATE,
    'monthly',
    -- План: Подписчики 5000, Охват 500000, Комментарии 500
    5000,
    500000,
    500,
    50,  -- план по лидам
    10,  -- план по продажам
    500000.00,  -- план по выручке
    -- Факт
    0,
    0,
    0,
    0,
    0,
    -- Контент
    0,
    0,
    now()
)
ON CONFLICT (project_id, date, period_type)
DO UPDATE SET
    plan_followers = 5000,
    plan_reach = 500000,
    plan_comments = 500,
    plan_leads = 50,
    plan_sales = 10,
    plan_revenue = 500000.00,
    updated_at = now();

-- =============================================================================
-- ЧАСТЬ 9: Триггер для автообновления fact при изменении leads
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_content_stats_on_lead()
RETURNS TRIGGER AS $$
BEGIN
    -- Обновляем fact в content_stats при добавлении органического лида
    IF NEW.source = 'organic' THEN
        UPDATE public.content_stats
        SET
            organic_leads_count = organic_leads_count + 1,
            organic_leads_revenue = organic_leads_revenue + COALESCE(NEW.deal_amount, 0),
            updated_at = now()
        WHERE project_id = NEW.project_id
          AND period_type = 'monthly'
          AND date = date_trunc('month', CURRENT_DATE)::DATE;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_content_stats_on_lead ON public.leads;
CREATE TRIGGER trigger_update_content_stats_on_lead
    AFTER INSERT ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.update_content_stats_on_lead();

-- =============================================================================
-- ПРОВЕРКА
-- =============================================================================
DO $$
DECLARE
    v_ideas INTEGER;
    v_production INTEGER;
    v_published INTEGER;
BEGIN
    SELECT
        COUNT(*) FILTER (WHERE status = 'idea'),
        COUNT(*) FILTER (WHERE status = 'production'),
        COUNT(*) FILTER (WHERE status = 'published')
    INTO v_ideas, v_production, v_published
    FROM public.instagram_posts_stats
    WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa';

    RAISE NOTICE '========================================';
    RAISE NOTICE 'КОНТЕНТ-ЗАВОД: Топливо загружено!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Цех "Загрузка" (ideas): % записей', v_ideas;
    RAISE NOTICE 'Цех "AI Анализ" (production): % записей', v_production;
    RAISE NOTICE 'Цех "Готово" (published): % записей', v_published;
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE 'pg_cron задания настроены:';
    RAISE NOTICE '- sync-organic-leads-hourly (каждый час)';
    RAISE NOTICE '- update-content-factory-fact (каждые 6 часов)';
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE 'Plan/Fact на месяц установлен:';
    RAISE NOTICE '- Подписчики: 5000';
    RAISE NOTICE '- Охват: 500000';
    RAISE NOTICE '- Комментарии: 500';
    RAISE NOTICE '========================================';
END
$$;
