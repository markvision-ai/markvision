-- =====================================================
-- SECURITY FIX: Add webhook_secret for HMAC signature verification
-- =====================================================

-- Add webhook_secret column for HMAC signing (separate from webhook_token)
ALTER TABLE public.webhook_configs 
ADD COLUMN IF NOT EXISTS webhook_secret TEXT DEFAULT encode(gen_random_bytes(32), 'hex');

-- Create function to rotate webhook credentials
CREATE OR REPLACE FUNCTION public.rotate_webhook_credentials(p_config_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_token TEXT;
  v_new_secret TEXT;
  v_project_id UUID;
BEGIN
  -- Get project_id and verify access
  SELECT project_id INTO v_project_id
  FROM webhook_configs
  WHERE id = p_config_id;
  
  IF v_project_id IS NULL THEN
    RETURN json_build_object('error', 'Webhook config not found');
  END IF;
  
  -- Check if user has access to this project
  IF NOT has_project_access(auth.uid(), v_project_id) THEN
    RETURN json_build_object('error', 'Access denied');
  END IF;
  
  -- Generate new credentials
  v_new_token := encode(gen_random_bytes(16), 'hex');
  v_new_secret := encode(gen_random_bytes(32), 'hex');
  
  -- Update the webhook config
  UPDATE webhook_configs 
  SET 
    webhook_token = v_new_token,
    webhook_secret = v_new_secret,
    updated_at = now()
  WHERE id = p_config_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Credentials rotated successfully'
  );
END;
$$;

-- Create function to get webhook secret (only for project members)
CREATE OR REPLACE FUNCTION public.get_webhook_secret(p_config_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret TEXT;
  v_project_id UUID;
BEGIN
  -- Get secret and project_id
  SELECT webhook_secret, project_id INTO v_secret, v_project_id
  FROM webhook_configs
  WHERE id = p_config_id;
  
  IF v_project_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Check if user has access to this project
  IF NOT has_project_access(auth.uid(), v_project_id) THEN
    RETURN NULL;
  END IF;
  
  RETURN v_secret;
END;
$$;

-- Update the webhook_configs_safe view to exclude both token and secret
DROP VIEW IF EXISTS public.webhook_configs_safe;
CREATE VIEW public.webhook_configs_safe AS
SELECT 
    id,
    project_id,
    name,
    '********************************'::text as webhook_token_masked,
    field_mapping,
    is_active,
    created_at,
    updated_at
FROM public.webhook_configs;

-- Grant appropriate permissions
GRANT SELECT ON public.webhook_configs_safe TO authenticated;

-- Add audit logging trigger for webhook credential changes
CREATE OR REPLACE FUNCTION public.log_webhook_credential_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.webhook_token IS DISTINCT FROM NEW.webhook_token OR OLD.webhook_secret IS DISTINCT FROM NEW.webhook_secret THEN
    INSERT INTO audit_logs (
      user_id,
      project_id,
      action,
      entity_type,
      entity_id,
      old_values,
      new_values
    ) VALUES (
      auth.uid(),
      NEW.project_id,
      'credential_rotation',
      'webhook_config',
      NEW.id::text,
      jsonb_build_object('token_changed', OLD.webhook_token IS DISTINCT FROM NEW.webhook_token, 'secret_changed', OLD.webhook_secret IS DISTINCT FROM NEW.webhook_secret),
      jsonb_build_object('rotated_at', now())
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS webhook_credential_audit ON webhook_configs;
CREATE TRIGGER webhook_credential_audit
  AFTER UPDATE ON webhook_configs
  FOR EACH ROW
  EXECUTE FUNCTION log_webhook_credential_change();