-- Добавление уникального ограничения для upsert операций в automation_flows
-- Выполнить этот SQL в Supabase для исправления ошибки "there is no unique or exclusion constraint"

-- Добавляем уникальное ограничение на (project_id, name) для поддержки ON CONFLICT
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'automation_flows_project_name_unique'
        AND table_name = 'automation_flows'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.automation_flows
        ADD CONSTRAINT automation_flows_project_name_unique UNIQUE (project_id, name);
    END IF;
END $$;

-- Проверяем, что ограничение добавлено
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'automation_flows'
    AND tc.table_schema = 'public'
    AND tc.constraint_type = 'UNIQUE'
ORDER BY tc.constraint_name, kcu.ordinal_position;