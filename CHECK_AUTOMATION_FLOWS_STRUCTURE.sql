-- Проверка структуры таблицы automation_flows
-- Выполнить перед TEST_ALL_FIXES.sql

-- Проверить что таблица существует
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename = 'automation_flows';

-- Проверить колонки таблицы
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'automation_flows'
ORDER BY ordinal_position;

-- Проверить существующие данные
SELECT
    COUNT(*) as total_rows,
    COUNT(CASE WHEN name IS NOT NULL THEN 1 END) as rows_with_name,
    COUNT(CASE WHEN status IS NOT NULL THEN 1 END) as rows_with_status
FROM public.automation_flows;

-- Проверить данные для нашего project_id
SELECT
    id,
    project_id,
    name,
    status,
    last_run,
    execution_time,
    logs
FROM public.automation_flows
WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa';