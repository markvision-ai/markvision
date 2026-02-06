-- =============================================================================
-- MarkVision AI — ГЛАВНЫЙ ПРОЕКТ ПЛАТФОРМЫ
-- =============================================================================
-- MarkVision — это основа платформы. Все остальные проекты — клиенты.
--
-- Структура:
--   MarkVision (master) ─┬─ Стоматология Уали (client)
--                        ├─ Клиника X (client)
--                        └─ ... другие клиенты
-- =============================================================================

-- Добавляем колонку для типа проекта если её нет
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'projects'
        AND column_name = 'project_type'
    ) THEN
        ALTER TABLE public.projects ADD COLUMN project_type TEXT DEFAULT 'client';
        COMMENT ON COLUMN public.projects.project_type IS 'Тип проекта: master (платформа) или client (клиент)';
    END IF;

    -- Добавляем колонку для Meta Ad Account ID
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'projects'
        AND column_name = 'meta_ad_account_id'
    ) THEN
        ALTER TABLE public.projects ADD COLUMN meta_ad_account_id TEXT;
        COMMENT ON COLUMN public.projects.meta_ad_account_id IS 'ID рекламного аккаунта Meta (act_xxx)';
    END IF;

    -- Добавляем колонку для токена
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'projects'
        AND column_name = 'meta_access_token'
    ) THEN
        ALTER TABLE public.projects ADD COLUMN meta_access_token TEXT;
        COMMENT ON COLUMN public.projects.meta_access_token IS 'Access token для Meta API (зашифрованный)';
    END IF;
END
$$;

-- =============================================================================
-- 1. ГЛАВНЫЙ ПРОЕКТ: MarkVision
-- =============================================================================
INSERT INTO public.projects (
    id,
    name,
    description,
    project_type,
    meta_ad_account_id,
    meta_access_token,
    user_id,
    created_at,
    updated_at
) VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'MarkVision',
    'Главный проект платформы MarkVision AI. Управление всеми клиентами и настройками.',
    'master',
    'act_3800749813528424',  -- MarkVision ad account
    'EAAa3xKWvHHYBQge5eyP2RVTpTZCOH7UXHaFhrbKpm5b7PRuKz7THTQIBk8sSm8lXKd5Jlr8W6TCndHrvuZBrhNwDClhQgIaZCXcoGPSWQIxtq3hcCU63Xv8RyAthkF1Gbtr3uRO4Kb003NVzTzErcZCQdYrvZCqZCET4rxCZCAZAtVwpa1aZBSI0HA8Rt4tkidFsdoqRCNl4KN0Bucz3oXtuETcIEz1XL9Fj5taUM',
    (SELECT id FROM auth.users LIMIT 1),
    now(),
    now()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    project_type = EXCLUDED.project_type,
    meta_ad_account_id = EXCLUDED.meta_ad_account_id,
    meta_access_token = EXCLUDED.meta_access_token,
    updated_at = now();

-- =============================================================================
-- 2. КЛИЕНТ: Стоматология Уали
-- =============================================================================
-- Обновляем существующий проект (64c94e87-...) или создаём новый
INSERT INTO public.projects (
    id,
    name,
    description,
    project_type,
    meta_ad_account_id,
    meta_access_token,
    user_id,
    created_at,
    updated_at
) VALUES (
    '64c94e87-630c-470e-8ab1-8f7c8c835efa',
    'Стоматология Уали',
    'Клиент: стоматологическая клиника в Казахстане',
    'client',
    'act_1005197113823722',  -- Стоматология Уали ad account
    'EAAa3xKWvHHYBQge5eyP2RVTpTZCOH7UXHaFhrbKpm5b7PRuKz7THTQIBk8sSm8lXKd5Jlr8W6TCndHrvuZBrhNwDClhQgIaZCXcoGPSWQIxtq3hcCU63Xv8RyAthkF1Gbtr3uRO4Kb003NVzTzErcZCQdYrvZCqZCET4rxCZCAZAtVwpa1aZBSI0HA8Rt4tkidFsdoqRCNl4KN0Bucz3oXtuETcIEz1XL9Fj5taUM',
    (SELECT id FROM auth.users LIMIT 1),
    now(),
    now()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    project_type = EXCLUDED.project_type,
    meta_ad_account_id = EXCLUDED.meta_ad_account_id,
    meta_access_token = EXCLUDED.meta_access_token,
    updated_at = now();

-- =============================================================================
-- 3. Настройки Pixel для MarkVision (главный проект)
-- =============================================================================
INSERT INTO public.pixel_configs (
    project_id,
    fb_pixel_id,
    fb_access_token,
    fb_test_event_code,
    events_config,
    is_active,
    created_at,
    updated_at
) VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    '867449209384180',
    'EAAXbutpKfZCEBQhc9f5YplliTwdsYpL1s3TFkpjWx2pTohiqxCMdZBjgBBKriHInZARVodoGDlpIJIwuuI3cnEUrDjNTX9pXYwZAqtKPdeEkYcrNS9B0Xgs3C70oAyURFTIBxR8FHGPqL2M8SqTG3tu9xN2CIyfJq0yH8uwgp6lu6HZCf3qKupVKviHSO2AZDZD',
    NULL,  -- Без тестового кода - production
    '{
        "lead": true,
        "schedule": true,
        "purchase": true,
        "custom_events": ["ViewContent", "InitiateCheckout"]
    }'::jsonb,
    true,
    now(),
    now()
) ON CONFLICT (project_id) DO UPDATE SET
    fb_pixel_id = EXCLUDED.fb_pixel_id,
    fb_access_token = EXCLUDED.fb_access_token,
    updated_at = now();

-- =============================================================================
-- 4. Выводим результат
-- =============================================================================
DO $$
DECLARE
    master_project RECORD;
    client_project RECORD;
BEGIN
    SELECT * INTO master_project FROM public.projects WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    SELECT * INTO client_project FROM public.projects WHERE id = '64c94e87-630c-470e-8ab1-8f7c8c835efa';

    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '  MarkVision AI — Проекты настроены';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '  🏢 ГЛАВНЫЙ ПРОЕКТ (master):';
    RAISE NOTICE '     Имя: %', master_project.name;
    RAISE NOTICE '     UUID: a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    RAISE NOTICE '     Ad Account: act_3800749813528424';
    RAISE NOTICE '';
    RAISE NOTICE '  👤 КЛИЕНТ:';
    RAISE NOTICE '     Имя: %', client_project.name;
    RAISE NOTICE '     UUID: 64c94e87-630c-470e-8ab1-8f7c8c835efa';
    RAISE NOTICE '     Ad Account: act_1005197113823722';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END
$$;
