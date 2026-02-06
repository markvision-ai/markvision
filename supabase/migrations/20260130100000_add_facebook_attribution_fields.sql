-- =============================================================================
-- Добавление полей для Facebook Attribution и CAPI
-- =============================================================================
-- Эти поля нужны для:
-- 1. Связывания клика на рекламу с конверсией (fbclid)
-- 2. Атрибуции конверсий к конкретным объявлениям (fb_ad_id, fb_adset_id, fb_campaign_id)
-- 3. Отправки событий в Conversion API (CAPI) для оптимизации рекламы
-- =============================================================================

-- Добавляем поля в таблицу leads
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS fbclid TEXT,
ADD COLUMN IF NOT EXISTS fb_ad_id TEXT,
ADD COLUMN IF NOT EXISTS fb_adset_id TEXT,
ADD COLUMN IF NOT EXISTS fb_campaign_id TEXT,
ADD COLUMN IF NOT EXISTS fbc TEXT,  -- Facebook Click cookie (_fbc)
ADD COLUMN IF NOT EXISTS fbp TEXT;  -- Facebook Pixel cookie (_fbp)

-- Индекс для быстрого поиска по fbclid (часто используется в CAPI)
CREATE INDEX IF NOT EXISTS idx_leads_fbclid ON public.leads(fbclid) WHERE fbclid IS NOT NULL;

-- Индекс для атрибуции по кампаниям
CREATE INDEX IF NOT EXISTS idx_leads_fb_campaign_id ON public.leads(fb_campaign_id) WHERE fb_campaign_id IS NOT NULL;

-- Комментарии для документации
COMMENT ON COLUMN public.leads.fbclid IS 'Facebook Click ID - связывает клик на рекламу с конверсией';
COMMENT ON COLUMN public.leads.fb_ad_id IS 'Facebook Ad ID - ID объявления для атрибуции';
COMMENT ON COLUMN public.leads.fb_adset_id IS 'Facebook AdSet ID - ID группы объявлений';
COMMENT ON COLUMN public.leads.fb_campaign_id IS 'Facebook Campaign ID - ID рекламной кампании';
COMMENT ON COLUMN public.leads.fbc IS 'Facebook Click cookie (_fbc) - для server-side tracking';
COMMENT ON COLUMN public.leads.fbp IS 'Facebook Pixel cookie (_fbp) - для cross-device tracking';

-- =============================================================================
-- Добавляем таблицу для хранения Pixel настроек проекта
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.pixel_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,

    -- Facebook Pixel
    fb_pixel_id TEXT,
    fb_access_token TEXT,  -- Токен для CAPI (зашифрованный)
    fb_test_event_code TEXT,  -- Для тестирования CAPI

    -- Google Analytics
    ga_measurement_id TEXT,  -- GA4 Measurement ID
    ga_api_secret TEXT,  -- GA4 API Secret для server-side

    -- TikTok Pixel
    tiktok_pixel_id TEXT,
    tiktok_access_token TEXT,

    -- Настройки событий
    events_config JSONB DEFAULT '{
        "lead": true,
        "schedule": true,
        "purchase": true,
        "custom_events": []
    }'::jsonb,

    -- Метаданные
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(project_id)
);

-- RLS для pixel_configs
ALTER TABLE public.pixel_configs ENABLE ROW LEVEL SECURITY;

-- Политика: пользователи видят только настройки своих проектов
CREATE POLICY "Users can view own project pixel configs"
    ON public.pixel_configs FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM public.projects
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own project pixel configs"
    ON public.pixel_configs FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM public.projects
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own project pixel configs"
    ON public.pixel_configs FOR UPDATE
    USING (
        project_id IN (
            SELECT id FROM public.projects
            WHERE user_id = auth.uid()
        )
    );

-- Service role может всё (для n8n/CAPI)
CREATE POLICY "Service role full access to pixel configs"
    ON public.pixel_configs FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Индекс для быстрого поиска по project_id
CREATE INDEX IF NOT EXISTS idx_pixel_configs_project_id ON public.pixel_configs(project_id);

-- =============================================================================
-- Таблица для логирования CAPI событий
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.capi_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,

    -- Данные события
    event_name TEXT NOT NULL,  -- Lead, Schedule, Purchase, etc.
    event_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    event_id TEXT,  -- Для дедупликации

    -- Атрибуция
    fbclid TEXT,
    fb_ad_id TEXT,
    fb_campaign_id TEXT,

    -- Данные пользователя (хешированные)
    user_data JSONB,  -- {email_hash, phone_hash, fbc, fbp, etc.}

    -- Кастомные данные
    custom_data JSONB,  -- {value, currency, content_ids, etc.}

    -- Статус отправки
    platform TEXT NOT NULL,  -- facebook, google, tiktok
    status TEXT DEFAULT 'pending',  -- pending, sent, failed
    response JSONB,  -- Ответ от API
    error_message TEXT,

    -- Метаданные
    created_at TIMESTAMPTZ DEFAULT now(),
    sent_at TIMESTAMPTZ
);

-- RLS для capi_events
ALTER TABLE public.capi_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project capi events"
    ON public.capi_events FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM public.projects
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Service role full access to capi events"
    ON public.capi_events FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Индексы
CREATE INDEX IF NOT EXISTS idx_capi_events_project_id ON public.capi_events(project_id);
CREATE INDEX IF NOT EXISTS idx_capi_events_lead_id ON public.capi_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_capi_events_status ON public.capi_events(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_capi_events_event_time ON public.capi_events(event_time);

-- =============================================================================
-- Проверка
-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Facebook Attribution fields added successfully';
    RAISE NOTICE 'Tables created: pixel_configs, capi_events';
END
$$;
