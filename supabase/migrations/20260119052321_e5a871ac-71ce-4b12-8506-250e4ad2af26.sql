-- Create api_key_usage table for monitoring and rate limiting
CREATE TABLE IF NOT EXISTS public.api_key_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL,
  user_id UUID NOT NULL,
  project_id UUID,
  request_count INTEGER DEFAULT 1,
  tokens_used INTEGER,
  endpoint TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_key_usage ENABLE ROW LEVEL SECURITY;

-- Admins can view all usage
CREATE POLICY "Admins can view all api usage"
ON public.api_key_usage FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Project owners can view their project usage
CREATE POLICY "Project owners can view project usage"
ON public.api_key_usage FOR SELECT
USING (
  project_id IS NOT NULL 
  AND EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
);

-- Insert is allowed for authenticated users (edge functions use service role)
CREATE POLICY "Service can insert usage logs"
ON public.api_key_usage FOR INSERT
WITH CHECK (true);

-- Create index for rate limiting queries
CREATE INDEX idx_api_key_usage_rate_limit 
ON public.api_key_usage (user_id, service, created_at DESC);

CREATE INDEX idx_api_key_usage_project 
ON public.api_key_usage (project_id, created_at DESC);

-- Fix transactions table RLS to enforce financial permissions
DROP POLICY IF EXISTS "Users can view transactions for accessible projects" ON public.transactions;

CREATE POLICY "Users can view transactions with proper permissions"
ON public.transactions FOR SELECT
USING (
  has_project_access(auth.uid(), project_id)
  AND (
    -- Admins see everything
    has_role(auth.uid(), 'admin')
    -- Project owners see everything
    OR EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
    -- Users with view_revenue permission
    OR has_permission(auth.uid(), project_id, 'view_revenue')
  )
);