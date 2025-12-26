-- Drop the existing PERMISSIVE policy that allows any authenticated user to access all leads
DROP POLICY IF EXISTS "Require authentication for leads" ON public.leads;

-- Create a RESTRICTIVE policy that acts as a baseline authentication requirement
-- RESTRICTIVE policies are combined with AND logic, so this ensures:
-- 1. User MUST be authenticated (this policy)
-- 2. AND user must have project access (other policies)
CREATE POLICY "Require authentication for leads"
ON public.leads
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);