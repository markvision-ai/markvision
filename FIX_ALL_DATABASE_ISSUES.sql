-- ============================================
-- КРИТИЧЕСКИЕ ИСПРАВЛЕНИЯ БАЗЫ ДАННЫХ
-- ============================================

-- 1. ИСПРАВЛЕНИЕ: Удаление проблемных триггеров и функций
DROP TRIGGER IF EXISTS trigger_set_priority_from_score ON public.leads;
DROP TRIGGER IF EXISTS trigger_auto_priority ON public.leads;
DROP FUNCTION IF EXISTS set_priority_from_score() CASCADE;
DROP FUNCTION IF EXISTS auto_set_priority() CASCADE;

-- Исправление priority_id (без IF EXISTS в DROP DEFAULT)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'leads' 
    AND column_name = 'priority_id'
  ) THEN
    BEGIN
      ALTER TABLE public.leads ALTER COLUMN priority_id DROP DEFAULT;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
    ALTER TABLE public.leads ALTER COLUMN priority_id SET DEFAULT NULL;
  END IF;
END $$;

-- 2. КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Полное отключение RLS для project_members
-- Это устранит рекурсию. Политики можно настроить позже.
ALTER TABLE public.project_members DISABLE ROW LEVEL SECURITY;

-- Удаляем ВСЕ политики project_members
DROP POLICY IF EXISTS "project_members_select_policy" ON public.project_members;
DROP POLICY IF EXISTS "project_members_policy" ON public.project_members;
DROP POLICY IF EXISTS "Users can view project members" ON public.project_members;
DROP POLICY IF EXISTS "Users can view their own project members" ON public.project_members;
DROP POLICY IF EXISTS "project_members_insert_policy" ON public.project_members;
DROP POLICY IF EXISTS "project_members_update_policy" ON public.project_members;
DROP POLICY IF EXISTS "project_members_delete_policy" ON public.project_members;

-- Создаем простую политику БЕЗ рекурсии (используем только project_access)
CREATE POLICY "project_members_simple_policy" ON public.project_members
  FOR ALL
  USING (
    -- Используем только project_access, НЕ project_members
    EXISTS (
      SELECT 1 FROM public.project_access pa
      WHERE pa.user_id = auth.uid()
      AND pa.project_id = project_members.project_id
    )
    OR
    -- Админы видят все
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_access pa
      WHERE pa.user_id = auth.uid()
      AND pa.project_id = project_members.project_id
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'super_admin')
    )
  );

-- Включаем RLS обратно
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- 3. ВОССТАНОВЛЕНИЕ: Восстановление зависимостей для daily_data и plan_data
DO $$
BEGIN
  -- daily_data constraints
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'daily_data_project_id_fkey'
  ) THEN
    ALTER TABLE public.daily_data
    ADD CONSTRAINT daily_data_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'daily_data_project_id_date_key'
  ) THEN
    ALTER TABLE public.daily_data
    ADD CONSTRAINT daily_data_project_id_date_key UNIQUE (project_id, date);
  END IF;

  -- plan_data constraints
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'plan_data_project_id_fkey'
  ) THEN
    ALTER TABLE public.plan_data
    ADD CONSTRAINT plan_data_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'plan_data_project_id_month_key'
  ) THEN
    ALTER TABLE public.plan_data
    ADD CONSTRAINT plan_data_project_id_month_key UNIQUE (project_id, month);
  END IF;
END $$;

-- 4. ВОССТАНОВЛЕНИЕ ДАННЫХ: Полное восстановление daily_data из ВСЕХ источников
-- Восстанавливаем ВСЕ данные агрегированно за каждый день

-- Создаем временную функцию для полного восстановления
CREATE OR REPLACE FUNCTION restore_all_daily_data()
RETURNS TABLE(
  projects_processed INTEGER,
  total_records INTEGER,
  earliest_date DATE,
  latest_date DATE
) AS $$
DECLARE
  project_record RECORD;
  total_projects INTEGER := 0;
  total_recs INTEGER := 0;
  min_date DATE;
  max_date DATE;
BEGIN
  -- Для каждого проекта восстанавливаем все данные
  FOR project_record IN 
    SELECT DISTINCT project_id 
    FROM public.leads 
    WHERE project_id IS NOT NULL
    UNION
    SELECT DISTINCT project_id 
    FROM public.marketing_stats 
    WHERE project_id IS NOT NULL
  LOOP
    total_projects := total_projects + 1;
    
    -- Восстанавливаем ВСЕ метрики за один запрос для каждого дня
    INSERT INTO public.daily_data (
      project_id, 
      date, 
      leads, 
      revenue, 
      sales, 
      diagnostics,
      spend,
      impressions,
      clicks,
      updated_at
    )
    SELECT 
      project_record.project_id,
      COALESCE(lead_dates.date, marketing_dates.date) as date,
      COALESCE(lead_stats.leads, 0) as leads,
      COALESCE(lead_stats.revenue, 0) as revenue,
      COALESCE(lead_stats.sales, 0) as sales,
      COALESCE(lead_stats.diagnostics, 0) as diagnostics,
      COALESCE(marketing_stats.spend, 0) as spend,
      COALESCE(marketing_stats.impressions, 0) as impressions,
      COALESCE(marketing_stats.clicks, 0) as clicks,
      NOW() as updated_at
    FROM (
      SELECT DISTINCT DATE(created_at) as date
      FROM public.leads
      WHERE project_id = project_record.project_id
      AND created_at IS NOT NULL
    ) lead_dates
    FULL OUTER JOIN (
      SELECT DISTINCT date
      FROM public.marketing_stats
      WHERE project_id = project_record.project_id
      AND date IS NOT NULL
    ) marketing_dates ON lead_dates.date = marketing_dates.date
    LEFT JOIN (
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as leads,
        COALESCE(SUM(CASE WHEN status = 'paid' AND deal_amount > 0 THEN deal_amount ELSE 0 END), 0) as revenue,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as sales,
        COUNT(CASE WHEN status IN ('diagnostic', 'diagnostics_completed') THEN 1 END) as diagnostics
      FROM public.leads
      WHERE project_id = project_record.project_id
      AND created_at IS NOT NULL
      GROUP BY DATE(created_at)
    ) lead_stats ON COALESCE(lead_dates.date, marketing_dates.date) = lead_stats.date
    LEFT JOIN (
      SELECT 
        date,
        COALESCE(SUM(spend), 0) as spend,
        COALESCE(SUM(impressions), 0) as impressions,
        COALESCE(SUM(clicks), 0) as clicks
      FROM public.marketing_stats
      WHERE project_id = project_record.project_id
      AND date IS NOT NULL
      GROUP BY date
    ) marketing_stats ON COALESCE(lead_dates.date, marketing_dates.date) = marketing_stats.date
    WHERE COALESCE(lead_dates.date, marketing_dates.date) IS NOT NULL
    ON CONFLICT (project_id, date) 
    DO UPDATE SET 
      leads = EXCLUDED.leads,
      revenue = EXCLUDED.revenue,
      sales = EXCLUDED.sales,
      diagnostics = EXCLUDED.diagnostics,
      spend = EXCLUDED.spend,
      impressions = EXCLUDED.impressions,
      clicks = EXCLUDED.clicks,
      updated_at = NOW();
    
    -- Подсчитываем количество записей для этого проекта
    SELECT COUNT(*) INTO total_recs
    FROM public.daily_data
    WHERE project_id = project_record.project_id;
  END LOOP;
  
  -- Получаем статистику
  SELECT 
    COUNT(DISTINCT project_id),
    COUNT(*),
    MIN(date),
    MAX(date)
  INTO total_projects, total_recs, min_date, max_date
  FROM public.daily_data;
  
  RETURN QUERY SELECT total_projects, total_recs, min_date, max_date;
END;
$$ LANGUAGE plpgsql;

-- Запускаем полное восстановление
SELECT * FROM restore_all_daily_data();

-- Восстанавливаем followers из instagram_posts, если таблица существует
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'instagram_posts'
  ) THEN
    -- Обновляем followers из последнего поста за каждый день
    UPDATE public.daily_data dd
    SET followers = (
      SELECT followers
      FROM public.instagram_posts ip
      WHERE ip.project_id = dd.project_id
      AND DATE(ip.created_at) = dd.date
      ORDER BY ip.created_at DESC
      LIMIT 1
    )
    WHERE EXISTS (
      SELECT 1 FROM public.instagram_posts ip
      WHERE ip.project_id = dd.project_id
      AND DATE(ip.created_at) = dd.date
    );
  END IF;
END $$;

-- 5. Создание таблицы campaigns, если её нет
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'campaigns'
  ) THEN
    CREATE TABLE public.campaigns (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
      platform TEXT NOT NULL,
      external_id TEXT,
      name TEXT NOT NULL,
      status BOOLEAN DEFAULT true,
      budget NUMERIC DEFAULT 0,
      spent_today NUMERIC DEFAULT 0,
      autopilot_enabled BOOLEAN DEFAULT false,
      rules JSONB DEFAULT '{}',
      ai_log JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_campaigns_project_id ON public.campaigns(project_id);
  END IF;
END $$;

-- 6. Финальные проверки
ALTER TABLE public.leads
  ALTER COLUMN lead_score SET DEFAULT NULL,
  ALTER COLUMN score_label SET DEFAULT NULL;

-- Выводим статистику восстановленных данных
SELECT 
  '✅ Исправления применены!' as status,
  COUNT(DISTINCT project_id) as projects_with_data,
  COUNT(*) as total_daily_records,
  MIN(date) as earliest_date,
  MAX(date) as latest_date
FROM public.daily_data;
