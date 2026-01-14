-- Add platform spend columns to daily_data
ALTER TABLE public.daily_data 
ADD COLUMN IF NOT EXISTS spend_fb numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS spend_google numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS spend_tiktok numeric DEFAULT 0;

-- Add LTV and last_action_at to leads
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS ltv numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_action_at timestamptz;

-- Create diagnostic_results table for funnel tracking
CREATE TABLE IF NOT EXISTS public.diagnostic_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  diagnostic_type text,
  result text,
  notes text,
  completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.diagnostic_results ENABLE ROW LEVEL SECURITY;

-- RLS policies for diagnostic_results
CREATE POLICY "Users can view diagnostic results for accessible projects"
ON public.diagnostic_results
FOR SELECT
USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can insert diagnostic results for accessible projects"
ON public.diagnostic_results
FOR INSERT
WITH CHECK (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can update diagnostic results for accessible projects"
ON public.diagnostic_results
FOR UPDATE
USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can delete diagnostic results for accessible projects"
ON public.diagnostic_results
FOR DELETE
USING (public.has_project_access(auth.uid(), project_id));

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_diagnostic_results_lead ON public.diagnostic_results(lead_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_results_project ON public.diagnostic_results(project_id);

-- Enable realtime for automation_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.automation_logs;