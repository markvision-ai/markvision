ALTER TABLE content_tasks ADD COLUMN IF NOT EXISTS content_type text;
ALTER TABLE content_tasks ADD COLUMN IF NOT EXISTS style text;
ALTER TABLE content_tasks ADD COLUMN IF NOT EXISTS format text;
ALTER TABLE content_tasks ADD COLUMN IF NOT EXISTS count text;
ALTER TABLE content_tasks ADD COLUMN IF NOT EXISTS source text;
