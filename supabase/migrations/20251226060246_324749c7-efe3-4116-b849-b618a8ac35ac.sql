-- Create campaigns table for Quantom Ads module
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'tiktok', 'google')),
  external_id TEXT,
  name TEXT NOT NULL,
  status BOOLEAN NOT NULL DEFAULT true,
  budget NUMERIC NOT NULL DEFAULT 0,
  spent_today NUMERIC NOT NULL DEFAULT 0,
  autopilot_enabled BOOLEAN NOT NULL DEFAULT false,
  rules JSONB DEFAULT '{"max_cpa": null, "min_roas": null, "max_daily_spend": null}'::jsonb,
  ai_log JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Require authentication for campaigns"
ON public.campaigns
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view campaigns for accessible projects"
ON public.campaigns
FOR SELECT
USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can manage campaigns for accessible projects"
ON public.campaigns
FOR ALL
USING (has_project_access(auth.uid(), project_id));

-- Trigger for updated_at
CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_campaigns_project_id ON public.campaigns(project_id);
CREATE INDEX idx_campaigns_platform ON public.campaigns(platform);