ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS external_id text;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS platform text DEFAULT 'facebook';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_external_id ON campaigns(external_id);

-- Add unique constraint for upsert support (project_id + external_id)
-- Using DO block to avoid error if constraint already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'campaigns_project_external_id_key'
    ) THEN
        ALTER TABLE campaigns ADD CONSTRAINT campaigns_project_external_id_key UNIQUE (project_id, external_id);
    END IF;
END $$;
