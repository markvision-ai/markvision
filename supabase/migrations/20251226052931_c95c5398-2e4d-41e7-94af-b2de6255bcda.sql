-- Drop the existing permissive policy
DROP POLICY IF EXISTS "Require authentication for profiles" ON public.profiles;

-- Create a RESTRICTIVE policy that truly blocks anonymous access
-- RESTRICTIVE policies are applied with AND logic, so this will block
-- any access where auth.uid() IS NULL, regardless of other policies
CREATE POLICY "Require authentication for profiles"
ON public.profiles
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);