-- Create ad_accounts table for storing advertising platform credentials
CREATE TABLE IF NOT EXISTS public.ad_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'tiktok', 'google')),
  external_id TEXT NOT NULL,
  name TEXT NOT NULL,
  access_token TEXT, -- OAuth access token
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (project_id, platform, external_id)
);

-- Enable RLS
ALTER TABLE public.ad_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view ad accounts for accessible projects
CREATE POLICY "Users can view ad accounts for accessible projects"
ON public.ad_accounts
FOR SELECT
USING (
  project_id IN (
    SELECT project_id 
    FROM public.project_access 
    WHERE user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Policy: Users can manage ad accounts for accessible projects
CREATE POLICY "Users can manage ad accounts for accessible projects"
ON public.ad_accounts
FOR ALL
USING (
  project_id IN (
    SELECT project_id 
    FROM public.project_access 
    WHERE user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  project_id IN (
    SELECT project_id 
    FROM public.project_access 
    WHERE user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Trigger: Update updated_at on modification
CREATE TRIGGER update_ad_accounts_updated_at
  BEFORE UPDATE ON public.ad_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster lookups
CREATE INDEX idx_ad_accounts_project_id ON public.ad_accounts(project_id);
CREATE INDEX idx_ad_accounts_platform ON public.ad_accounts(platform);
