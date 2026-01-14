-- =====================================================
-- FIX ERROR-LEVEL SECURITY ISSUES
-- =====================================================

-- 1. FIX: projects_super_admin_backdoor
-- Remove hardcoded UUID from projects and leads policies

-- Drop the problematic policies with hardcoded UUID
DROP POLICY IF EXISTS "Super admin full access to projects" ON public.projects;
DROP POLICY IF EXISTS "Super admin full access to leads" ON public.leads;

-- Create proper role-based policies for projects (without hardcoded UUID)
CREATE POLICY "Owners can manage their projects"
ON public.projects FOR ALL
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Leads policy already has proper project access check, no replacement needed
-- The "Users can manage leads for accessible projects" policy handles this

-- 2. FIX: staff_table_email_phone_exposure
-- Remove the overly permissive admin policy that allows cross-project access
DROP POLICY IF EXISTS "Admins can view all staff details" ON public.staff;

-- Admin should only see staff within projects they have access to
CREATE POLICY "Admins can view staff for accessible projects"
ON public.staff FOR SELECT
USING (
  has_role(auth.uid(), 'admin') 
  AND has_project_access(auth.uid(), project_id)
);

-- Create a safe view for staff that excludes sensitive contact info
DROP VIEW IF EXISTS public.staff_basic;
CREATE VIEW public.staff_basic
WITH (security_invoker=on) AS
SELECT 
  id,
  project_id,
  name,
  position,
  department,
  status,
  level,
  xp_points,
  avatar_url,
  hire_date,
  created_at,
  updated_at,
  user_id
  -- Excluded: email, phone, salary, commission_rate
FROM public.staff;

-- Grant access to the view
GRANT SELECT ON public.staff_basic TO authenticated;

-- 3. FIX: webhook_configs_token_exposure  
-- Block direct SELECT on webhook_configs to force use of safe view
-- First, drop any existing SELECT-only policies that might allow token access
DROP POLICY IF EXISTS "Users can view webhook configs for accessible projects" ON public.webhook_configs;

-- Create a policy that denies direct SELECT (force use of webhook_configs_safe view)
CREATE POLICY "No direct SELECT on webhook_configs"
ON public.webhook_configs FOR SELECT
USING (false);

-- Keep INSERT/UPDATE/DELETE policies for project access
-- These already exist and don't expose the token in responses

-- Ensure the safe view exists and is properly configured
DROP VIEW IF EXISTS public.webhook_configs_safe;
CREATE VIEW public.webhook_configs_safe
WITH (security_invoker=on) AS
SELECT 
  id,
  project_id,
  name,
  is_active,
  field_mapping,
  created_at,
  updated_at,
  CASE 
    WHEN webhook_token IS NOT NULL 
    THEN '********' || RIGHT(webhook_token, 4)
    ELSE NULL 
  END as webhook_token_masked
FROM public.webhook_configs;

-- Grant access to the safe view
GRANT SELECT ON public.webhook_configs_safe TO authenticated;

-- Ensure the get_webhook_token function exists for secure token retrieval
CREATE OR REPLACE FUNCTION public.get_webhook_token(config_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token TEXT;
  config_project_id UUID;
BEGIN
  -- Get the project_id for this config
  SELECT project_id INTO config_project_id
  FROM public.webhook_configs
  WHERE id = config_id;
  
  -- Check if user has access to this project
  IF NOT has_project_access(auth.uid(), config_project_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Return the token
  SELECT webhook_token INTO token
  FROM public.webhook_configs
  WHERE id = config_id;
  
  RETURN token;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_webhook_token(UUID) TO authenticated;