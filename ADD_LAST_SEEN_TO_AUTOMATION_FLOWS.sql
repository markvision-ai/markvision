-- Добавление поля last_seen в таблицу automation_flows
-- Выполнить в Supabase SQL Editor

ALTER TABLE public.automation_flows
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Индекс для производительности
CREATE INDEX IF NOT EXISTS idx_automation_flows_last_seen ON public.automation_flows(last_seen);

-- Комментарий для документации
COMMENT ON COLUMN public.automation_flows.last_seen IS 'Время последнего обновления из n8n (для фильтрации активных автоматизаций)';
