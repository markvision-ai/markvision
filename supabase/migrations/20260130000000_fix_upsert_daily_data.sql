-- =============================================================================
-- FIX: Исправление всех функций, использующих 'day' вместо 'date' в daily_data
-- =============================================================================
-- Проблема: Колонка в таблице daily_data называется 'date', но функции используют 'day'
-- Затронутые функции:
--   1. upsert_daily_data (p_day -> p_date)
--   2. upsert_daily_data_for_project
--   3. sync_leads_daily_inner (p_day -> p_date)
--   4. refresh_daily_fact_v2 (p_day -> p_date)
--   5. refresh_daily_fact_wrapper (p_day -> p_date)
-- =============================================================================

-- 1. Исправляем upsert_daily_data
-- Эта функция вставляет или обновляет данные в daily_data
DROP FUNCTION IF EXISTS public.upsert_daily_data(date, uuid, numeric, integer, numeric, integer, integer);
DROP FUNCTION IF EXISTS public.upsert_daily_data(text, uuid, numeric, integer, numeric, integer, integer);

CREATE OR REPLACE FUNCTION public.upsert_daily_data(
    p_date DATE,
    p_project_id UUID,
    p_spend NUMERIC DEFAULT NULL,
    p_leads INTEGER DEFAULT NULL,
    p_revenue NUMERIC DEFAULT NULL,
    p_sales INTEGER DEFAULT NULL,
    p_diagnostics INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.daily_data (project_id, date, spend, leads, revenue, sales, diagnostics, created_at, updated_at)
    VALUES (
        p_project_id,
        p_date,
        COALESCE(p_spend, 0),
        COALESCE(p_leads, 0),
        COALESCE(p_revenue, 0),
        COALESCE(p_sales, 0),
        COALESCE(p_diagnostics, 0),
        now(),
        now()
    )
    ON CONFLICT (project_id, date)
    DO UPDATE SET
        spend = COALESCE(EXCLUDED.spend, daily_data.spend),
        leads = COALESCE(EXCLUDED.leads, daily_data.leads),
        revenue = COALESCE(EXCLUDED.revenue, daily_data.revenue),
        sales = COALESCE(EXCLUDED.sales, daily_data.sales),
        diagnostics = COALESCE(EXCLUDED.diagnostics, daily_data.diagnostics),
        updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- 2. Исправляем upsert_daily_data_for_project
DROP FUNCTION IF EXISTS public.upsert_daily_data_for_project(uuid);

CREATE OR REPLACE FUNCTION public.upsert_daily_data_for_project(p_project_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Создаём запись на сегодня для проекта если её нет
    INSERT INTO public.daily_data (project_id, date, spend, leads, revenue, sales, diagnostics, created_at, updated_at)
    VALUES (
        p_project_id,
        CURRENT_DATE,
        0, 0, 0, 0, 0,
        now(),
        now()
    )
    ON CONFLICT (project_id, date) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 3. Исправляем sync_leads_daily_inner
DROP FUNCTION IF EXISTS public.sync_leads_daily_inner(date, uuid);
DROP FUNCTION IF EXISTS public.sync_leads_daily_inner(text, uuid);

CREATE OR REPLACE FUNCTION public.sync_leads_daily_inner(
    p_date DATE,
    p_project_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_leads_count INTEGER;
BEGIN
    -- Считаем количество лидов за указанный день
    SELECT COUNT(*) INTO v_leads_count
    FROM public.leads
    WHERE project_id = p_project_id
      AND DATE(created_at) = p_date;

    -- Обновляем daily_data
    INSERT INTO public.daily_data (project_id, date, leads, created_at, updated_at)
    VALUES (p_project_id, p_date, v_leads_count, now(), now())
    ON CONFLICT (project_id, date)
    DO UPDATE SET
        leads = v_leads_count,
        updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- 4. Исправляем refresh_daily_fact_v2
DROP FUNCTION IF EXISTS public.refresh_daily_fact_v2(date, uuid);
DROP FUNCTION IF EXISTS public.refresh_daily_fact_v2(text, uuid);

CREATE OR REPLACE FUNCTION public.refresh_daily_fact_v2(
    p_date DATE,
    p_project_id UUID
)
RETURNS VOID AS $$
BEGIN
    -- Пересчитываем все метрики за день
    -- Лиды
    UPDATE public.daily_data
    SET leads = (
        SELECT COUNT(*)
        FROM public.leads
        WHERE project_id = p_project_id
          AND DATE(created_at) = p_date
    ),
    -- Диагностики
    diagnostics = (
        SELECT COUNT(*)
        FROM public.diagnostics d
        JOIN public.leads l ON d.lead_id = l.id
        WHERE l.project_id = p_project_id
          AND DATE(d.created_at) = p_date
    ),
    -- Продажи (лиды со статусом 'sale' или 'sold')
    sales = (
        SELECT COUNT(*)
        FROM public.leads
        WHERE project_id = p_project_id
          AND DATE(created_at) = p_date
          AND status IN ('sale', 'sold')
    ),
    updated_at = now()
    WHERE project_id = p_project_id AND date = p_date;

    -- Если записи нет, создаём её
    IF NOT FOUND THEN
        INSERT INTO public.daily_data (project_id, date, leads, diagnostics, sales, spend, revenue, created_at, updated_at)
        SELECT
            p_project_id,
            p_date,
            (SELECT COUNT(*) FROM public.leads WHERE project_id = p_project_id AND DATE(created_at) = p_date),
            (SELECT COUNT(*) FROM public.diagnostics d JOIN public.leads l ON d.lead_id = l.id WHERE l.project_id = p_project_id AND DATE(d.created_at) = p_date),
            (SELECT COUNT(*) FROM public.leads WHERE project_id = p_project_id AND DATE(created_at) = p_date AND status IN ('sale', 'sold')),
            0,
            0,
            now(),
            now();
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. Исправляем refresh_daily_fact_wrapper
DROP FUNCTION IF EXISTS public.refresh_daily_fact_wrapper(date, uuid);
DROP FUNCTION IF EXISTS public.refresh_daily_fact_wrapper(text, uuid);

CREATE OR REPLACE FUNCTION public.refresh_daily_fact_wrapper(
    p_date DATE,
    p_project_id UUID
)
RETURNS VOID AS $$
BEGIN
    -- Wrapper вызывает основную функцию
    PERFORM public.refresh_daily_fact_v2(p_date, p_project_id);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Пересоздаём триггер handle_new_lead (на всякий случай)
-- =============================================================================
DROP TRIGGER IF EXISTS on_lead_created ON public.leads;
DROP FUNCTION IF EXISTS public.handle_new_lead();

CREATE OR REPLACE FUNCTION public.handle_new_lead()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.daily_data (project_id, date, leads, created_at, updated_at)
    VALUES (NEW.project_id, CURRENT_DATE, 1, now(), now())
    ON CONFLICT (project_id, date)
    DO UPDATE SET
        leads = COALESCE(daily_data.leads, 0) + 1,
        updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_lead_created
    AFTER INSERT ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_lead();

-- =============================================================================
-- Проверка: вывод созданных функций
-- =============================================================================
DO $$
DECLARE
    func_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname IN (
          'upsert_daily_data',
          'upsert_daily_data_for_project',
          'sync_leads_daily_inner',
          'refresh_daily_fact_v2',
          'refresh_daily_fact_wrapper',
          'handle_new_lead'
      );

    RAISE NOTICE 'Fixed % functions successfully', func_count;
END
$$;
