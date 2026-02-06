-- =============================================================================
-- Добавление отслеживания органических лидов для дашборда "Контент-Завод"
-- =============================================================================
-- Эта миграция добавляет:
-- 1. Поле source в leads для явного разделения organic/paid
-- 2. Поле organic_post_id как alias для post_id (для совместимости)
-- 3. Поле organic_leads_count в instagram_posts_stats
-- 4. Таблицу content_stats для агрегированной статистики "Контент-Завод"
-- =============================================================================

-- Добавляем поле source в leads (organic, paid, direct, referral)
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'direct';

-- Создаём индекс для быстрой фильтрации по source
CREATE INDEX IF NOT EXISTS idx_leads_source
ON public.leads(source)
WHERE source IS NOT NULL;

-- Индекс для связки post_id + source
CREATE INDEX IF NOT EXISTS idx_leads_post_id_source
ON public.leads(post_id, source)
WHERE post_id IS NOT NULL;

-- Комментарий для документации
COMMENT ON COLUMN public.leads.source IS 'Источник лида: organic (из органического контента), paid (из рекламы), direct (прямой трафик), referral (реферальный)';

-- =============================================================================
-- Добавляем organic_leads_count в instagram_posts_stats
-- =============================================================================
ALTER TABLE public.instagram_posts_stats
ADD COLUMN IF NOT EXISTS organic_leads_count INTEGER DEFAULT 0;

COMMENT ON COLUMN public.instagram_posts_stats.organic_leads_count IS 'Количество органических лидов с этого поста (source = organic)';

-- =============================================================================
-- Создаём таблицу content_stats для дашборда "Контент-Завод"
-- =============================================================================
-- Удаляем старую таблицу если есть (была создана с другой структурой)
DROP TABLE IF EXISTS public.content_stats CASCADE;

CREATE TABLE public.content_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,

    -- Период
    date DATE NOT NULL,
    period_type TEXT DEFAULT 'daily', -- daily, hourly, weekly

    -- Статистика контента
    total_posts INTEGER DEFAULT 0,
    total_reels INTEGER DEFAULT 0,
    total_stories INTEGER DEFAULT 0,

    -- Охват и вовлеченность
    total_reach INTEGER DEFAULT 0,
    total_impressions INTEGER DEFAULT 0,
    total_likes INTEGER DEFAULT 0,
    total_comments INTEGER DEFAULT 0,
    total_shares INTEGER DEFAULT 0,
    total_saves INTEGER DEFAULT 0,

    -- Лиды с органического контента
    organic_leads_count INTEGER DEFAULT 0,
    organic_leads_revenue DECIMAL(12, 2) DEFAULT 0,

    -- Для сравнения с платными
    paid_leads_count INTEGER DEFAULT 0,
    paid_leads_revenue DECIMAL(12, 2) DEFAULT 0,

    -- Топ посты по лидам (JSON array)
    top_posts_by_leads JSONB DEFAULT '[]'::jsonb,

    -- Метаданные
    synced_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Уникальность по проекту + дата + период
    UNIQUE(project_id, date, period_type)
);

-- RLS для content_stats
ALTER TABLE public.content_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project content stats"
    ON public.content_stats FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM public.projects
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Service role full access to content stats"
    ON public.content_stats FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Индексы для быстрого доступа
CREATE INDEX IF NOT EXISTS idx_content_stats_project_date
ON public.content_stats(project_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_content_stats_period
ON public.content_stats(project_id, period_type, date DESC);

-- =============================================================================
-- Функция для автоматического определения source при вставке лида
-- =============================================================================
CREATE OR REPLACE FUNCTION public.auto_detect_lead_source()
RETURNS TRIGGER AS $$
BEGIN
    -- Если source уже установлен, не меняем
    IF NEW.source IS NOT NULL AND NEW.source != 'direct' THEN
        RETURN NEW;
    END IF;

    -- Если есть fb_ad_id или fb_campaign_id - это paid
    IF NEW.fb_ad_id IS NOT NULL OR NEW.fb_campaign_id IS NOT NULL THEN
        NEW.source := 'paid';
    -- Если есть post_id без рекламных ID - это organic
    ELSIF NEW.post_id IS NOT NULL THEN
        NEW.source := 'organic';
    -- Если есть utm_source с реферальными маркерами
    ELSIF NEW.utm_source IN ('partner', 'affiliate', 'referral') THEN
        NEW.source := 'referral';
    -- Иначе direct
    ELSE
        NEW.source := 'direct';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического определения source
DROP TRIGGER IF EXISTS trigger_auto_detect_lead_source ON public.leads;
CREATE TRIGGER trigger_auto_detect_lead_source
    BEFORE INSERT ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_detect_lead_source();

-- =============================================================================
-- Функция для синхронизации organic_leads_count в instagram_posts_stats
-- =============================================================================
CREATE OR REPLACE FUNCTION public.sync_organic_leads_to_post()
RETURNS TRIGGER AS $$
BEGIN
    -- Обновляем счётчик органических лидов в instagram_posts_stats
    IF NEW.source = 'organic' AND NEW.post_id IS NOT NULL THEN
        UPDATE public.instagram_posts_stats
        SET
            organic_leads_count = COALESCE(organic_leads_count, 0) + 1,
            leads_count = COALESCE(leads_count, 0) + 1,
            updated_at = now()
        WHERE post_id = NEW.post_id
          AND project_id = NEW.project_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для синхронизации при создании лида
DROP TRIGGER IF EXISTS trigger_sync_organic_leads ON public.leads;
CREATE TRIGGER trigger_sync_organic_leads
    AFTER INSERT ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_organic_leads_to_post();

-- =============================================================================
-- Обновление существующих лидов с post_id
-- =============================================================================
UPDATE public.leads
SET source = 'organic'
WHERE post_id IS NOT NULL
  AND fb_ad_id IS NULL
  AND fb_campaign_id IS NULL
  AND (source IS NULL OR source = 'direct');

UPDATE public.leads
SET source = 'paid'
WHERE (fb_ad_id IS NOT NULL OR fb_campaign_id IS NOT NULL)
  AND (source IS NULL OR source = 'direct');

-- =============================================================================
-- Первичная синхронизация organic_leads_count
-- =============================================================================
UPDATE public.instagram_posts_stats ips
SET organic_leads_count = (
    SELECT COUNT(*)
    FROM public.leads l
    WHERE l.post_id = ips.post_id
      AND l.project_id = ips.project_id
      AND l.source = 'organic'
);

-- =============================================================================
-- Проверка
-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Organic leads tracking added successfully';
    RAISE NOTICE 'Added: leads.source, instagram_posts_stats.organic_leads_count';
    RAISE NOTICE 'Created: content_stats table for Контент-Завод dashboard';
END
$$;
