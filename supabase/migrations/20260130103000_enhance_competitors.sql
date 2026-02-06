-- Enhance competitor_monitoring table for comprehensive tracking
ALTER TABLE "public"."competitor_monitoring" 
ADD COLUMN IF NOT EXISTS "avatar_url" text,
ADD COLUMN IF NOT EXISTS "followers_count" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "engagement_rate" float DEFAULT 0,
ADD COLUMN IF NOT EXISTS "posts_count" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "stories_count" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "last_post_at" timestamp with time zone,
ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active';

-- Enable RLS for competitor_monitoring if not already enabled
ALTER TABLE "public"."competitor_monitoring" ENABLE ROW LEVEL SECURITY;

-- Allow project members to view and manage competitors
DROP POLICY IF EXISTS "Enable all for project members" ON "public"."competitor_monitoring";
CREATE POLICY "Enable all for project members" ON "public"."competitor_monitoring"
FOR ALL TO "authenticated"
USING (
  EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = competitor_monitoring.project_id
    AND project_members.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = competitor_monitoring.project_id
    AND project_members.user_id = auth.uid()
  )
);
