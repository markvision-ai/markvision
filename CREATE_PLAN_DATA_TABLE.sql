-- Создание таблицы plan_data для хранения плановых показателей
-- Эта таблица используется для сравнения План/Факт

CREATE TABLE IF NOT EXISTS public.plan_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    month DATE NOT NULL, -- Первое число месяца (например, 2026-01-01)
    
    -- Плановые метрики
    spend NUMERIC DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    leads INTEGER DEFAULT 0,
    followers INTEGER DEFAULT 0,
    diagnostics INTEGER DEFAULT 0,
    sales INTEGER DEFAULT 0,
    revenue NUMERIC DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Уникальность плана для проекта и месяца
    UNIQUE(project_id, month)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_plan_data_project_month ON public.plan_data(project_id, month);

-- RLS Политики
ALTER TABLE public.plan_data ENABLE ROW LEVEL SECURITY;

-- Политика на чтение (доступно всем авторизованным пользователям проекта или всем, если публичный доступ разрешен логикой приложения)
-- Здесь предполагаем, что доступ к данным проекта регулируется через project_access или просто авторизацией
CREATE POLICY "Users can view plan data for their projects" ON public.plan_data
    FOR SELECT
    USING (auth.uid() IN (
        SELECT user_id FROM public.project_access WHERE project_id = plan_data.project_id
    ) OR auth.role() = 'service_role');

-- Политика на вставку/обновление (только админы или редакторы)
CREATE POLICY "Users can upsert plan data for their projects" ON public.plan_data
    FOR ALL
    USING (auth.uid() IN (
        SELECT user_id FROM public.project_access WHERE project_id = plan_data.project_id AND role IN ('admin', 'editor', 'owner')
    ));

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_plan_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_plan_data_updated_at_trigger ON public.plan_data;
CREATE TRIGGER update_plan_data_updated_at_trigger
    BEFORE UPDATE ON public.plan_data
    FOR EACH ROW
    EXECUTE FUNCTION update_plan_data_updated_at();
