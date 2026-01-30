-- Ensure instagram_posts_stats has project_id and is linked to projects
ALTER TABLE "public"."instagram_posts_stats" 
ADD COLUMN IF NOT EXISTS "project_id" uuid REFERENCES "public"."projects"("id") ON DELETE CASCADE;

-- Add RLS policy for instagram_posts_stats
ALTER TABLE "public"."instagram_posts_stats" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for project members" ON "public"."instagram_posts_stats";
CREATE POLICY "Enable all for project members" ON "public"."instagram_posts_stats"
FOR ALL TO "authenticated"
USING (
  EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = instagram_posts_stats.project_id
    AND project_members.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = instagram_posts_stats.project_id
    AND project_members.user_id = auth.uid()
  )
);
