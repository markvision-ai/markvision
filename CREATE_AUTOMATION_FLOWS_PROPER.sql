-- Правильное создание таблицы automation_flows с исправленной структурой
-- Выполнить в Supabase SQL Editor

-- Удаляем старую таблицу если она существует
DROP TABLE IF EXISTS public.automation_flows CASCADE;

-- Создаем таблицу с правильной структурой
CREATE TABLE public.automation_flows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error', 'running')),
    last_run TIMESTAMP WITH TIME ZONE,
    execution_time INTEGER,
    logs TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX idx_automation_flows_project ON public.automation_flows(project_id);
CREATE INDEX idx_automation_flows_status ON public.automation_flows(status);
CREATE INDEX idx_automation_flows_last_run ON public.automation_flows(last_run);

-- RLS политика
ALTER TABLE public.automation_flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view automation flows for their projects" ON public.automation_flows
    FOR SELECT USING (true); -- Временно разрешаем все для тестирования

CREATE POLICY "Users can manage automation flows for their projects" ON public.automation_flows
    FOR ALL USING (true); -- Временно разрешаем все для тестирования

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_automation_flows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER automation_flows_updated_at_trigger
    BEFORE UPDATE ON public.automation_flows
    FOR EACH ROW
    EXECUTE FUNCTION update_automation_flows_updated_at();

-- Добавляем тестовые данные с правильным project_id
INSERT INTO public.automation_flows (project_id, name, description, status, last_run, execution_time) VALUES
    ('64c94e87-630c-470e-8ab1-8f7c8c835efa', 'Система аналитики (Core)', 'Основной мониторинг системы каждые 15 минут', 'active', NOW() - INTERVAL '5 minutes', 1250),
    ('64c94e87-630c-470e-8ab1-8f7c8c835efa', 'Facebook Ads Sync', 'Синхронизация данных Facebook рекламы', 'active', NOW() - INTERVAL '2 hours', 4850),
    ('64c94e87-630c-470e-8ab1-8f7c8c835efa', 'Instagram Content Intelligence', 'Анализ контента Instagram', 'error', NOW() - INTERVAL '1 hour', 3200),
    ('64c94e87-630c-470e-8ab1-8f7c8c835efa', 'Content Production Stats', 'Статистика производства контента', 'inactive', NOW() - INTERVAL '6 hours', 1890)
ON CONFLICT (id) DO NOTHING;

-- Обновляем один с ошибкой для демонстрации
UPDATE public.automation_flows
SET logs = 'API rate limit exceeded. Please try again later.',
    status = 'error',
    last_run = NOW() - INTERVAL '30 minutes'
WHERE name = 'Instagram Content Intelligence' AND project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa';