-- Add missing columns to content_factory table for Content Factory v2 workflow
ALTER TABLE content_factory ADD COLUMN IF NOT EXISTS project_id TEXT;
ALTER TABLE content_factory ADD COLUMN IF NOT EXISTS platform_type TEXT;
ALTER TABLE content_factory ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE content_factory ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE content_factory ADD COLUMN IF NOT EXISTS body JSONB;
ALTER TABLE content_factory ADD COLUMN IF NOT EXISTS body_text TEXT;
ALTER TABLE content_factory ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE content_factory ADD COLUMN IF NOT EXISTS voice_url TEXT;
ALTER TABLE content_factory ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE content_factory ADD COLUMN IF NOT EXISTS author_id TEXT;
ALTER TABLE content_factory ADD COLUMN IF NOT EXISTS cta_text TEXT;
ALTER TABLE content_factory ADD COLUMN IF NOT EXISTS hook_text TEXT;
ALTER TABLE content_factory ADD COLUMN IF NOT EXISTS current_workshop INTEGER;
ALTER TABLE content_factory ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Enable realtime for content_factory
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE content_factory;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- RLS
ALTER TABLE content_factory ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Service role full access" ON content_factory;
  CREATE POLICY "Service role full access" ON content_factory
    FOR ALL TO service_role USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Authenticated users can read" ON content_factory;
  CREATE POLICY "Authenticated users can read" ON content_factory
    FOR SELECT TO authenticated USING (true);
END $$;
