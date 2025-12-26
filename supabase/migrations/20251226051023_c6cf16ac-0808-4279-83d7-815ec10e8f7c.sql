-- Drop the ineffective policy
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;

-- Create a proper policy that requires authentication for all operations
CREATE POLICY "Require authentication for profiles"
ON public.profiles
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);