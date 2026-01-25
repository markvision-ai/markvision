-- Добавление поля n8n_webhook_url в таблицу projects
-- Выполнить в Supabase SQL Editor

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS n8n_webhook_url TEXT;

-- Комментарий для документации
COMMENT ON COLUMN public.projects.n8n_webhook_url IS 'URL вебхука n8n для автоматизации проекта';
