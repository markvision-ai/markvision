-- Harden RLS policies: remove overly broad access and anon reads.

-- ============================================================================
-- ad_insights: drop permissive policy and allow read only for project members
-- ============================================================================
ALTER TABLE public.ad_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for users" ON public.ad_insights;

CREATE POLICY "Project members can read ad_insights"
  ON public.ad_insights
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.project_members pm
      WHERE pm.project_id = ad_insights.project_id
        AND pm.user_id = auth.uid()
    )
  );

-- ============================================================================
-- content_stats: remove anon read; scope read to project members
-- ============================================================================
ALTER TABLE public.content_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon can read content_stats" ON public.content_stats;
DROP POLICY IF EXISTS "Users can view own project content stats" ON public.content_stats;

CREATE POLICY "Project members can read content_stats"
  ON public.content_stats
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.project_members pm
      WHERE pm.project_id = content_stats.project_id
        AND pm.user_id = auth.uid()
    )
  );
