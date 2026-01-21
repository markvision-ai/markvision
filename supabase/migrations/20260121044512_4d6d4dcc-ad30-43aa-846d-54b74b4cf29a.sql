-- Fix leads table: make all policies RESTRICTIVE for defense-in-depth
-- Drop existing permissive policies and recreate as restrictive
DROP POLICY IF EXISTS "Users can manage leads for accessible projects" ON public.leads;
DROP POLICY IF EXISTS "Users can view leads for accessible projects" ON public.leads;

-- Recreate as RESTRICTIVE policies (requires auth check to pass AND project access)
CREATE POLICY "Users can manage leads for accessible projects" 
ON public.leads 
AS RESTRICTIVE
FOR ALL 
USING (has_project_access(auth.uid(), project_id))
WITH CHECK (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can view leads for accessible projects" 
ON public.leads 
AS RESTRICTIVE
FOR SELECT 
USING (has_project_access(auth.uid(), project_id));

-- Fix webhook_configs: Remove conflicting policies and ensure only safe access
DROP POLICY IF EXISTS "No direct SELECT on webhook_configs" ON public.webhook_configs;
DROP POLICY IF EXISTS "Users can view configs for accessible projects" ON public.webhook_configs;

-- Create a single RESTRICTIVE policy that blocks direct table access
CREATE POLICY "Block all direct SELECT access" 
ON public.webhook_configs 
AS RESTRICTIVE
FOR SELECT 
USING (false);

-- Add authentication requirement for all operations
DROP POLICY IF EXISTS "Require authentication for webhook_configs" ON public.webhook_configs;
CREATE POLICY "Require authentication for webhook_configs" 
ON public.webhook_configs 
AS RESTRICTIVE
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Update the Admins and owners policy to be RESTRICTIVE as well
DROP POLICY IF EXISTS "Admins and owners can manage webhook configs" ON public.webhook_configs;
CREATE POLICY "Admins and owners can manage webhook configs" 
ON public.webhook_configs 
AS RESTRICTIVE
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = webhook_configs.project_id 
    AND projects.owner_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = webhook_configs.project_id 
    AND projects.owner_id = auth.uid()
  )
);