-- Ensure all required columns exist in campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS status boolean DEFAULT true;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS budget numeric DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS spent_today numeric DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS autopilot_enabled boolean DEFAULT false;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS rules jsonb DEFAULT '[]'::jsonb;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS ai_log jsonb DEFAULT '[]'::jsonb;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS external_id text;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS platform text DEFAULT 'facebook';

-- Ensure external_id is unique per project if not already
-- (Optional, might conflict if duplicates exist, so we skip the constraint for now or use safe index)
CREATE INDEX IF NOT EXISTS idx_campaigns_external_id ON campaigns(external_id);
