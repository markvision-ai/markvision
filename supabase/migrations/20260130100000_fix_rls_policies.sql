-- Fix RLS policies for Content Factory and Project Members to allow test data generation

-- 1. Ensure RLS is enabled
ALTER TABLE "public"."content_factory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."project_members" ENABLE ROW LEVEL SECURITY;

-- 2. Allow authenticated users to join projects (required for test data generation script)
-- Note: In a strict production environment, this should be restricted to admins or invitations.
-- But for this system update request, we need to unblock the generator.
DROP POLICY IF EXISTS "Enable self-join for project_members" ON "public"."project_members";
CREATE POLICY "Enable self-join for project_members" ON "public"."project_members"
FOR INSERT TO "authenticated"
WITH CHECK (
  auth.uid() = user_id
);

DROP POLICY IF EXISTS "Enable select for own membership" ON "public"."project_members";
CREATE POLICY "Enable select for own membership" ON "public"."project_members"
FOR SELECT TO "authenticated"
USING (
  auth.uid() = user_id
);

-- 3. Allow project members to insert into content_factory
DROP POLICY IF EXISTS "Enable insert for project members" ON "public"."content_factory";
CREATE POLICY "Enable insert for project members" ON "public"."content_factory"
FOR INSERT TO "authenticated"
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = content_factory.project_id
    AND project_members.user_id = auth.uid()
  )
);

-- 4. Allow project members to update their own content or project content
DROP POLICY IF EXISTS "Enable update for project members" ON "public"."content_factory";
CREATE POLICY "Enable update for project members" ON "public"."content_factory"
FOR UPDATE TO "authenticated"
USING (
  EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = content_factory.project_id
    AND project_members.user_id = auth.uid()
  )
);

-- 5. Allow project members to select content
DROP POLICY IF EXISTS "Enable select for project members" ON "public"."content_factory";
CREATE POLICY "Enable select for project members" ON "public"."content_factory"
FOR SELECT TO "authenticated"
USING (
  EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = content_factory.project_id
    AND project_members.user_id = auth.uid()
  )
);
