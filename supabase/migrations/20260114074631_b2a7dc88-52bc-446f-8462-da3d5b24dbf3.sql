-- Fix staff salary exposure: Create a view that hides sensitive salary/commission data
-- and restrict the base table access

-- Create a view for basic staff info (excludes salary and commission)
CREATE OR REPLACE VIEW public.staff_basic
WITH (security_invoker=on) AS
SELECT 
  id, 
  project_id, 
  name, 
  position, 
  department, 
  status, 
  avatar_url, 
  email, 
  phone,
  xp_points, 
  level,
  hire_date,
  user_id,
  created_at,
  updated_at
FROM public.staff;

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Users can view staff for accessible projects" ON public.staff;

-- Create restrictive policies for base staff table with salary data
-- Only admins and the staff member themselves can see salary/commission

CREATE POLICY "Admins can view all staff details"
ON public.staff FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view own full details"
ON public.staff FOR SELECT
USING (auth.uid() = user_id);

-- Update audit_logs policy to include project access check
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;

CREATE POLICY "Users can view own audit logs for accessible projects"
ON public.audit_logs FOR SELECT
USING (
  auth.uid() = user_id
  AND (
    project_id IS NULL
    OR public.has_project_access(auth.uid(), project_id)
    OR public.has_role(auth.uid(), 'admin')
  )
);