-- Add explicit DENY policies for anonymous (unauthenticated) access
-- This provides defense-in-depth security

-- Profiles table
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false);

-- Projects table
CREATE POLICY "Deny anonymous access to projects"
ON public.projects
FOR ALL
TO anon
USING (false);

-- User roles table
CREATE POLICY "Deny anonymous access to user_roles"
ON public.user_roles
FOR ALL
TO anon
USING (false);

-- Project access table
CREATE POLICY "Deny anonymous access to project_access"
ON public.project_access
FOR ALL
TO anon
USING (false);

-- Daily data table
CREATE POLICY "Deny anonymous access to daily_data"
ON public.daily_data
FOR ALL
TO anon
USING (false);

-- Plan data table
CREATE POLICY "Deny anonymous access to plan_data"
ON public.plan_data
FOR ALL
TO anon
USING (false);