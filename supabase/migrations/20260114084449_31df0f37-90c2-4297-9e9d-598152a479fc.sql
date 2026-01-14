-- Add onboarding_status to projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'pending';

-- Create project_context table for AI training data
CREATE TABLE IF NOT EXISTS public.project_context (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  content TEXT,
  product_info TEXT,
  pricing_info TEXT,
  sales_scripts TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id)
);

-- Enable RLS
ALTER TABLE public.project_context ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_context
CREATE POLICY "Users can view own project context"
  ON public.project_context
  FOR SELECT
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can insert own project context"
  ON public.project_context
  FOR INSERT
  WITH CHECK (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can update own project context"
  ON public.project_context
  FOR UPDATE
  USING (public.has_project_access(auth.uid(), project_id));

-- Add whatsapp_config to integrations if needed
-- We'll store GreenAPI credentials in the integrations table with type='whatsapp'

-- Trigger for updated_at
CREATE TRIGGER update_project_context_updated_at
  BEFORE UPDATE ON public.project_context
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();