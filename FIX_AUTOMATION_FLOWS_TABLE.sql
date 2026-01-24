-- Исправление таблицы automation_flows для соответствия новой схеме
-- Сначала проверим существующую схему и исправим ее

DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Проверяем, существует ли столбец flow_name (старое название)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'automation_flows'
        AND column_name = 'flow_name'
        AND table_schema = 'public'
    ) INTO column_exists;

    IF column_exists THEN
        -- Переименовываем flow_name в name
        ALTER TABLE public.automation_flows RENAME COLUMN flow_name TO name;
        RAISE NOTICE 'Renamed column flow_name to name';
    END IF;

    -- Проверяем и добавляем недостающие столбцы
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'automation_flows'
        AND column_name = 'description'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.automation_flows ADD COLUMN description TEXT;
        RAISE NOTICE 'Added column description';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'automation_flows'
        AND column_name = 'status'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.automation_flows ADD COLUMN status TEXT DEFAULT 'inactive';
        RAISE NOTICE 'Added column status';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'automation_flows'
        AND column_name = 'last_run'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.automation_flows ADD COLUMN last_run TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added column last_run';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'automation_flows'
        AND column_name = 'created_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.automation_flows ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added column created_at';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'automation_flows'
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.automation_flows ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added column updated_at';
    END IF;

    -- Добавляем CHECK constraint для status (игнорируем если уже существует)
    BEGIN
        ALTER TABLE public.automation_flows
        ADD CONSTRAINT automation_flows_status_check
        CHECK (status IN ('active', 'inactive', 'error', 'running'));
        RAISE NOTICE 'Added status check constraint';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Status check constraint already exists';
    END;

END $$;

-- Создаем индексы если они не существуют
CREATE INDEX IF NOT EXISTS idx_automation_flows_project ON public.automation_flows(project_id);
CREATE INDEX IF NOT EXISTS idx_automation_flows_status ON public.automation_flows(status);
CREATE INDEX IF NOT EXISTS idx_automation_flows_last_run ON public.automation_flows(last_run);

-- Включаем RLS
ALTER TABLE public.automation_flows ENABLE ROW LEVEL SECURITY;

-- Удаляем существующие политики если они есть
DROP POLICY IF EXISTS "Users can view automation flows for their projects" ON public.automation_flows;
DROP POLICY IF EXISTS "Users can manage automation flows for their projects" ON public.automation_flows;

-- Создаем политики
CREATE POLICY "Users can view automation flows for their projects" ON public.automation_flows
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage automation flows for their projects" ON public.automation_flows
    FOR ALL USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_automation_flows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Удаляем существующий триггер если он есть
DROP TRIGGER IF EXISTS automation_flows_updated_at_trigger ON public.automation_flows;

-- Создаем триггер
CREATE TRIGGER automation_flows_updated_at_trigger
    BEFORE UPDATE ON public.automation_flows
    FOR EACH ROW
    EXECUTE FUNCTION update_automation_flows_updated_at();

-- Очищаем существующие данные и вставляем тестовые
TRUNCATE TABLE public.automation_flows RESTART IDENTITY CASCADE;

-- Безопасная вставка тестовых данных
DO $$
DECLARE
    first_project_id UUID;
BEGIN
    -- Получаем ID первого проекта
    SELECT id INTO first_project_id FROM projects LIMIT 1;

    -- Вставляем тестовые данные только если есть проекты
    IF first_project_id IS NOT NULL THEN
        INSERT INTO public.automation_flows (project_id, name, description, status, last_run) VALUES
            (first_project_id, 'Facebook Ads Sync', 'Ежедневная синхронизация данных Facebook рекламы', 'active', NOW() - INTERVAL '2 hours'),
            (first_project_id, 'Instagram Content Intelligence', 'Анализ контента Instagram', 'active', NOW() - INTERVAL '1 hour'),
            (first_project_id, 'Content Production Stats', 'Статистика производства контента', 'error', NOW() - INTERVAL '6 hours');
        RAISE NOTICE 'Inserted test data for project %', first_project_id;
    ELSE
        RAISE NOTICE 'No projects found, skipping test data insertion';
    END IF;
END $$;