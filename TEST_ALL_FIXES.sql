-- Тестовый файл для проверки всех исправлений
-- Выполнить после развертывания изменений

-- 1. Проверить исправление undefined кабинетов
SELECT
    selected_page_name,
    selected_instagram_handle,
    ad_account_name
FROM public.ad_accounts
WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa';

-- 2. Проверить что данные правильно сохраняются
SELECT
    id,
    selected_page_id,
    selected_page_name,
    selected_instagram_id,
    selected_instagram_handle,
    ad_account_name,
    updated_at
FROM public.ad_accounts
WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa';

-- 3. Проверить automation_flows с правильными данными
SELECT
    name,
    status,
    last_run,
    execution_time,
    logs
FROM public.automation_flows
WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa'
ORDER BY last_run DESC NULLS LAST;

-- 4. Проверить что все таблицы существуют и имеют правильную структуру
SELECT
    schemaname,
    tablename
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('ad_accounts', 'automation_flows', 'daily_data', 'marketing_stats')
ORDER BY tablename;

-- 5. Проверить что колонки существуют
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name IN ('ad_accounts', 'automation_flows')
    AND column_name IN ('selected_page_name', 'selected_instagram_handle', 'ad_account_name', 'name', 'status', 'logs', 'execution_time')
ORDER BY table_name, column_name;