-- Unique constraint for upsert: project_id + name
-- Enables "Update if exists, Insert if new" (upsert) in automation_flows

ALTER TABLE public.automation_flows
ADD CONSTRAINT unique_flow_per_project UNIQUE (project_id, name);
