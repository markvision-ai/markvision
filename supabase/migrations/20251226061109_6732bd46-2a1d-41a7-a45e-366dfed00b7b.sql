-- Create ad_assets table for storing creatives
CREATE TABLE public.ad_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  
  -- Asset info
  asset_type TEXT NOT NULL CHECK (asset_type IN ('image', 'video')),
  file_url TEXT NOT NULL,
  file_name TEXT,
  aspect_ratio TEXT, -- '1:1', '4:5', '9:16', '16:9'
  platform TEXT CHECK (platform IN ('facebook', 'tiktok', 'google', 'all')),
  
  -- AI generated content
  ai_headlines JSONB DEFAULT '[]'::jsonb,
  ai_descriptions JSONB DEFAULT '[]'::jsonb,
  ai_primary_text TEXT,
  ai_hashtags TEXT[],
  
  -- Scoring & status
  ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ad_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Require authentication for ad_assets"
ON public.ad_assets
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view assets for accessible projects"
ON public.ad_assets
FOR SELECT
USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can manage assets for accessible projects"
ON public.ad_assets
FOR ALL
USING (has_project_access(auth.uid(), project_id));

-- Add trigger for updated_at
CREATE TRIGGER update_ad_assets_updated_at
  BEFORE UPDATE ON public.ad_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add new columns to campaigns for enhanced autopilot
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS autopilot_rules JSONB DEFAULT '{
  "stop_loss": {"enabled": false, "max_spend": null, "min_leads": 0, "hours": 24},
  "scale_up": {"enabled": false, "min_roi": 300, "budget_increase_percent": 20},
  "creative_refresh": {"enabled": false, "min_ctr": 0.5, "days": 3}
}'::jsonb;