-- =====================================================
-- SECURITY FIX: Delete test admin account with exposed credentials
-- =====================================================

-- Delete from user_roles first (due to foreign key)
DELETE FROM public.user_roles WHERE user_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- Delete from project_access
DELETE FROM public.project_access WHERE user_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- Delete from profiles
DELETE FROM public.profiles WHERE user_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- Delete from auth.identities
DELETE FROM auth.identities WHERE provider_id = 'testadmin@markvision.app';

-- Delete the user from auth.users
DELETE FROM auth.users WHERE email = 'testadmin@markvision.app';

-- =====================================================
-- SECURITY FIX: Improve profiles table RLS policies
-- =====================================================

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Require authentication for profiles" ON public.profiles;

-- Create proper authentication requirement as a base
CREATE POLICY "Require authentication for profiles"
ON public.profiles
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Update the user view own profile policy to be more explicit
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- =====================================================
-- SECURITY FIX: Create staff_basic_secure view with RLS
-- =====================================================

-- Drop the insecure view
DROP VIEW IF EXISTS public.staff_basic;

-- Recreate staff_basic as a secure view with SECURITY INVOKER
-- This means RLS from the underlying staff table will be enforced
CREATE VIEW public.staff_basic 
WITH (security_invoker = true)
AS
SELECT 
    id,
    project_id,
    name,
    "position",
    department,
    status,
    level,
    xp_points,
    avatar_url,
    hire_date,
    created_at,
    updated_at,
    user_id
FROM public.staff;

-- Grant appropriate permissions on the view
GRANT SELECT ON public.staff_basic TO authenticated;
GRANT SELECT ON public.staff_basic TO anon;

-- =====================================================
-- SECURITY FIX: Improve staff table RLS for sensitive data
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage staff for accessible projects" ON public.staff;
DROP POLICY IF EXISTS "Users can view staff for accessible projects" ON public.staff;
DROP POLICY IF EXISTS "Require auth for staff" ON public.staff;

-- Recreate with proper separation of concerns
CREATE POLICY "Require authentication for staff"
ON public.staff
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Users with project access can view staff info (salary is handled separately)
CREATE POLICY "Users can view staff for accessible projects"
ON public.staff
FOR SELECT
USING (has_project_access(auth.uid(), project_id));

-- Only admins, owners, or the staff member can manage staff records
CREATE POLICY "Admins and owners can manage staff"
ON public.staff
FOR ALL
USING (
    has_role(auth.uid(), 'admin') 
    OR auth.uid() = user_id
    OR EXISTS (
        SELECT 1 FROM public.projects p 
        WHERE p.id = staff.project_id 
        AND p.owner_id = auth.uid()
    )
);

-- Create a secure function to get salary data (admin/owner only)
CREATE OR REPLACE FUNCTION public.get_staff_salary_data(p_staff_id uuid)
RETURNS TABLE (
    salary numeric,
    commission_rate numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT s.salary, s.commission_rate
    FROM public.staff s
    WHERE s.id = p_staff_id
    AND (
        has_role(auth.uid(), 'admin')
        OR auth.uid() = s.user_id
        OR EXISTS (
            SELECT 1 FROM public.projects p 
            WHERE p.id = s.project_id 
            AND p.owner_id = auth.uid()
        )
    );
$$;