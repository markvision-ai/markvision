-- Create table for report templates
CREATE TABLE public.report_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  period_preset TEXT, -- 'week', 'lastWeek', 'month', 'lastMonth', 'custom'
  custom_days INTEGER, -- for custom periods like "last 30 days"
  include_comparison BOOLEAN DEFAULT false,
  comparison_preset TEXT, -- preset for comparison period
  selected_metrics JSONB DEFAULT '["spend", "leads", "sales", "revenue", "cpl", "romi"]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Deny anonymous access to report_templates"
ON public.report_templates
AS RESTRICTIVE
FOR ALL
USING (false);

CREATE POLICY "Users can view templates for accessible projects"
ON public.report_templates
FOR SELECT
USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can manage templates for accessible projects"
ON public.report_templates
FOR ALL
USING (has_project_access(auth.uid(), project_id));

-- Add trigger for updated_at
CREATE TRIGGER update_report_templates_updated_at
BEFORE UPDATE ON public.report_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();