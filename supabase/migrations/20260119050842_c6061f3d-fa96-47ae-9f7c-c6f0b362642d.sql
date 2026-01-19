-- Fix #1: Create secure function for webhook credentials (admins/owners only)
CREATE OR REPLACE FUNCTION public.get_webhook_credentials(p_project_id UUID)
RETURNS TABLE(webhook_url TEXT, webhook_token TEXT, webhook_secret TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins or project owners can access webhook credentials
  IF NOT (
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (SELECT 1 FROM projects WHERE id = p_project_id AND owner_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Access denied: only admins and project owners can access webhook credentials';
  END IF;
  
  RETURN QUERY
  SELECT 
    wc.webhook_url,
    wc.webhook_token,
    wc.webhook_secret
  FROM webhook_configs wc
  WHERE wc.project_id = p_project_id;
END;
$$;

-- Fix #2: Create secure function for integration credentials (admins/owners only)
CREATE OR REPLACE FUNCTION public.get_integration_credentials(p_integration_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id UUID;
  v_config JSONB;
BEGIN
  SELECT project_id, config INTO v_project_id, v_config
  FROM integrations WHERE id = p_integration_id;
  
  IF v_project_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Only admins or project owners can access integration credentials
  IF NOT (
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (SELECT 1 FROM projects WHERE id = v_project_id AND owner_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Access denied: only admins and project owners can access integration credentials';
  END IF;
  
  RETURN v_config;
END;
$$;

-- Fix #3: Create view for integrations without sensitive config data
CREATE OR REPLACE VIEW public.integrations_safe AS
SELECT 
  id,
  project_id,
  name,
  type,
  status,
  error_message,
  last_sync_at,
  created_at,
  updated_at,
  -- Only expose non-sensitive config info
  CASE 
    WHEN config IS NULL THEN NULL
    ELSE jsonb_build_object(
      'configured', true,
      'has_api_token', COALESCE((config->>'api_token') IS NOT NULL, false),
      'has_id_instance', COALESCE((config->>'id_instance') IS NOT NULL, false)
    )
  END as config_summary
FROM integrations;

-- Fix #4: Update webhook_configs policies - drop the ALL policy that bypasses SELECT restriction
DROP POLICY IF EXISTS "Users can manage configs for accessible projects" ON webhook_configs;

-- Create specific policies for INSERT, UPDATE, DELETE (but NOT SELECT for regular users)
CREATE POLICY "Admins and owners can manage webhook configs"
ON webhook_configs FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (SELECT 1 FROM projects WHERE id = webhook_configs.project_id AND owner_id = auth.uid())
);

-- Regular users can only see if a config exists (via the false SELECT policy already in place)
-- They must use the get_webhook_credentials function to access secrets

-- Fix #5: Update integrations policies - restrict direct config access
DROP POLICY IF EXISTS "Users can view integrations for accessible projects" ON integrations;

-- Create new SELECT policy that excludes config for non-admin users
CREATE POLICY "Users can view integrations metadata for accessible projects"
ON integrations FOR SELECT
USING (has_project_access(auth.uid(), project_id));

-- Note: The config column is still returned, but we'll handle this in application code
-- by using integrations_safe view or get_integration_credentials function

-- Fix #6: Create function to check if current user is project owner/admin
CREATE OR REPLACE FUNCTION public.is_project_admin(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (SELECT 1 FROM projects WHERE id = p_project_id AND owner_id = auth.uid())
  );
END;
$$;