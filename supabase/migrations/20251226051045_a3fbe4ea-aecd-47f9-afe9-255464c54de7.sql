-- Drop the ineffective policy for leads
DROP POLICY IF EXISTS "Deny anonymous access to leads" ON public.leads;

-- Create a proper policy that requires authentication for all operations
CREATE POLICY "Require authentication for leads"
ON public.leads
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);