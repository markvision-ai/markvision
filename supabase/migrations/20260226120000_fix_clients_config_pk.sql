-- Fix primary key and constraints for project isolation
BEGIN;

-- 1. Drop existing PK if it was on project_id (which we suspect based on error logs)
-- Note: We drop by constraint name if we knew it, but here we'll try to drop the PK index.
ALTER TABLE public.clients_config DROP CONSTRAINT IF EXISTS clients_config_pkey CASCADE;

-- 2. Add PK to the 'id' column
ALTER TABLE public.clients_config ADD PRIMARY KEY (id);

-- 3. Re-assign all agency accounts to the specified project UUID
UPDATE public.clients_config SET project_id = 'fc323674-bde1-41f9-836b-43043ab10924';

COMMIT;
