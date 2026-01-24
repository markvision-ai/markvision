-- Добавление тестовых данных для демонстрации n8n Automation Hub
-- Запустить после создания таблицы automation_flows

INSERT INTO public.automation_flows (project_id, name, description, status, last_run, execution_time) VALUES
    ('64c94e87-630c-470e-8ab1-8f7c8c835efa', 'Система аналитики (Core)', 'Основной мониторинг системы каждые 15 минут', 'active', NOW() - INTERVAL '5 minutes', 1250),
    ('64c94e87-630c-470e-8ab1-8f7c8c835efa', 'Facebook Ads Sync', 'Синхронизация данных Facebook рекламы', 'active', NOW() - INTERVAL '2 hours', 4850),
    ('64c94e87-630c-470e-8ab1-8f7c8c835efa', 'Instagram Content Intelligence', 'Анализ контента Instagram', 'error', NOW() - INTERVAL '1 hour', 3200),
    ('64c94e87-630c-470e-8ab1-8f7c8c835efa', 'Content Production Stats', 'Статистика производства контента', 'inactive', NOW() - INTERVAL '6 hours', 1890)
ON CONFLICT (id) DO NOTHING;

-- Обновление одного с ошибкой для демонстрации
UPDATE public.automation_flows
SET logs = 'API rate limit exceeded. Please try again later.',
    status = 'error',
    last_run = NOW() - INTERVAL '30 minutes'
WHERE name = 'Instagram Content Intelligence' AND project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa';