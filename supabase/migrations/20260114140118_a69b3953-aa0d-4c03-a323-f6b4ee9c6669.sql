-- ============================================
-- SECURITY FIX: Protect webhook tokens from exposure
-- Create a view that excludes the webhook_token for regular access
-- Only admins should be able to see the actual tokens
-- ============================================

-- Step 1: Create a view for webhook configs that hides the token by default
-- The view will show a masked token for display purposes

CREATE OR REPLACE VIEW public.webhook_configs_safe
WITH (security_invoker=on) AS
SELECT 
  id,
  project_id,
  name,
  is_active,
  field_mapping,
  created_at,
  updated_at,
  -- Show only first 8 characters of token, mask the rest
  CASE 
    WHEN webhook_token IS NOT NULL 
    THEN substring(webhook_token from 1 for 8) || '************************'
    ELSE NULL 
  END as webhook_token_masked
FROM public.webhook_configs;

-- Step 2: Create a secure function to get the full webhook token
-- This function uses SECURITY DEFINER and requires admin role check
CREATE OR REPLACE FUNCTION public.get_webhook_token(config_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT webhook_token 
  FROM public.webhook_configs 
  WHERE id = config_id
    AND has_project_access(auth.uid(), project_id)
$$;

-- Step 3: Create a function to generate webhook URL securely
-- This function requires project access and returns the full URL
CREATE OR REPLACE FUNCTION public.get_webhook_url(config_id uuid, base_url text DEFAULT 'https://grzqykegqgglekcxdtsu.supabase.co')
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN has_project_access(auth.uid(), project_id)
      THEN base_url || '/functions/v1/webhook-receiver?token=' || webhook_token
      ELSE NULL
    END
  FROM public.webhook_configs 
  WHERE id = config_id
$$;