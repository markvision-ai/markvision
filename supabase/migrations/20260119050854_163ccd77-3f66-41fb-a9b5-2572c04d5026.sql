-- Fix the integrations_safe view to use security_invoker
DROP VIEW IF EXISTS public.integrations_safe;

CREATE VIEW public.integrations_safe 
WITH (security_invoker = true)
AS
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
  -- Only expose non-sensitive config info (no actual credentials)
  CASE 
    WHEN config IS NULL THEN NULL
    ELSE jsonb_build_object(
      'configured', true,
      'has_api_token', COALESCE((config->>'api_token') IS NOT NULL, false),
      'has_id_instance', COALESCE((config->>'id_instance') IS NOT NULL, false)
    )
  END as config_summary
FROM integrations;