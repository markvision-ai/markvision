-- =============================================
-- SECURITY FIX: Multiple RLS Policy Improvements
-- =============================================

-- 1. FIX: leads_table_pii_exposure
-- Add explicit null check to ensure auth.uid() is not null
-- Drop and recreate the base policy with explicit null check

DROP POLICY IF EXISTS "Require authentication for leads" ON public.leads;

CREATE POLICY "Require authentication for leads"
ON public.leads AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- 2. FIX: team_members_all_profiles_access
-- The current "Require authentication for profiles" policy is too permissive
-- Drop the overly permissive policy and rely on specific policies

DROP POLICY IF EXISTS "Require authentication for profiles" ON public.profiles;

-- Create a more restrictive base policy that requires auth AND allows only:
-- - Own profile access
-- - Admin access
-- - Project-based access (users can see profiles of people in shared projects)

CREATE POLICY "Users can view profiles in shared projects"
ON public.profiles FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- Can view own profile
    auth.uid() = user_id OR
    -- Admins can view all
    has_role(auth.uid(), 'admin') OR
    -- Can view profiles of users who share a project
    EXISTS (
      SELECT 1 FROM project_access pa1
      JOIN project_access pa2 ON pa1.project_id = pa2.project_id
      WHERE pa1.user_id = auth.uid()
      AND pa2.user_id = profiles.user_id
    )
  )
);

-- 3. FIX: transactions_revenue_exposure  
-- Strengthen view policy to always require view_revenue permission
-- Drop existing permissive view policy

DROP POLICY IF EXISTS "Users can view transactions with proper permissions" ON public.transactions;

-- Create stricter policy that always requires view_revenue permission or admin/owner
CREATE POLICY "Users can view transactions with proper permissions"
ON public.transactions FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  has_project_access(auth.uid(), project_id) AND (
    has_role(auth.uid(), 'admin') OR
    (EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = transactions.project_id AND projects.owner_id = auth.uid()
    )) OR
    has_permission(auth.uid(), project_id, 'view_revenue')
  )
);

-- 4. FIX: audit_logs_incomplete_protection
-- Make the INSERT policy more restrictive - only allow inserting logs for own actions
-- and add server-side timestamp verification

DROP POLICY IF EXISTS "Users can insert audit logs" ON public.audit_logs;

-- Create restrictive INSERT policy
CREATE POLICY "Users can insert own audit logs"
ON public.audit_logs AS RESTRICTIVE
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  auth.uid() = user_id AND
  -- Ensure timestamp is recent (within last 5 minutes) to prevent backdating
  created_at >= (now() - interval '5 minutes')
);