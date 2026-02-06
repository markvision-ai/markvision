-- Unique constraint for upsert: project_id + name
-- Enables "Update if exists, Insert if new" (upsert) in automation_flows

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_flow_per_project'
    ) THEN
        ALTER TABLE public.automation_flows
        ADD CONSTRAINT unique_flow_per_project UNIQUE (project_id, name);
    END IF;
END
$$;
