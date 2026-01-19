-- Fix unrestricted API usage log insertion policy
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service can insert usage logs" ON public.api_key_usage;

-- Create a secure policy that only allows users to insert their own usage logs
-- Note: Edge functions use service role key which bypasses RLS, so this won't affect legitimate usage logging
CREATE POLICY "Users can insert own usage logs"
ON public.api_key_usage FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);