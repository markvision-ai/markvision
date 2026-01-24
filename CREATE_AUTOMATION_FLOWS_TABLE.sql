-- Создание таблицы для мониторинга n8n automation flows
CREATE TABLE IF NOT EXISTS public.automation_flows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error', 'running')),
    last_run TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_automation_flows_project ON public.automation_flows(project_id);
CREATE INDEX IF NOT EXISTS idx_automation_flows_status ON public.automation_flows(status);
CREATE INDEX IF NOT EXISTS idx_automation_flows_last_run ON public.automation_flows(last_run);

-- RLS политика
ALTER TABLE public.automation_flows ENABLE ROW LEVEL SECURITY;

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

CREATE TRIGGER automation_flows_updated_at_trigger
    BEFORE UPDATE ON public.automation_flows
    FOR EACH ROW
    EXECUTE FUNCTION update_automation_flows_updated_at();

-- Вставка тестовых данных для демонстрации
INSERT INTO public.automation_flows (project_id, name, description, status, last_run) VALUES
    ((SELECT id FROM projects LIMIT 1), 'Facebook Ads Sync', 'Ежедневная синхронизация данных Facebook рекламы', 'active', NOW() - INTERVAL '2 hours'),
    ((SELECT id FROM projects LIMIT 1), 'Instagram Content Intelligence', 'Анализ контента Instagram', 'active', NOW() - INTERVAL '1 hour'),
    ((SELECT id FROM projects LIMIT 1), 'Content Production Stats', 'Статистика производства контента', 'error', NOW() - INTERVAL '6 hours')
ON CONFLICT DO NOTHING;