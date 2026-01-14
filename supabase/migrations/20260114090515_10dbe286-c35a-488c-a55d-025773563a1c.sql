-- Create marketing_stats table for storing ad spend data
CREATE TABLE public.marketing_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  source TEXT NOT NULL, -- 'facebook', 'google', 'tiktok', 'instagram'
  date DATE NOT NULL,
  spend DECIMAL(12, 2) DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  cpm DECIMAL(10, 2) DEFAULT 0,
  cpc DECIMAL(10, 2) DEFAULT 0,
  ctr DECIMAL(6, 4) DEFAULT 0,
  campaign_id TEXT,
  campaign_name TEXT,
  ad_account_id TEXT,
  raw_data JSONB,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(project_id, source, date, campaign_id)
);

-- Create instagram_content_stats table for Reels/Posts analytics
CREATE TABLE public.instagram_content_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL,
  media_type TEXT, -- 'REELS', 'IMAGE', 'VIDEO', 'CAROUSEL_ALBUM'
  caption TEXT,
  permalink TEXT,
  thumbnail_url TEXT,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagement DECIMAL(6, 4) DEFAULT 0,
  posted_at TIMESTAMP WITH TIME ZONE,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(project_id, media_id)
);

-- Enable RLS
ALTER TABLE public.marketing_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_content_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketing_stats
CREATE POLICY "Users can view marketing stats for their projects"
  ON public.marketing_stats FOR SELECT
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can insert marketing stats for their projects"
  ON public.marketing_stats FOR INSERT
  WITH CHECK (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can update marketing stats for their projects"
  ON public.marketing_stats FOR UPDATE
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can delete marketing stats for their projects"
  ON public.marketing_stats FOR DELETE
  USING (public.has_project_access(auth.uid(), project_id));

-- RLS Policies for instagram_content_stats
CREATE POLICY "Users can view instagram stats for their projects"
  ON public.instagram_content_stats FOR SELECT
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can insert instagram stats for their projects"
  ON public.instagram_content_stats FOR INSERT
  WITH CHECK (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can update instagram stats for their projects"
  ON public.instagram_content_stats FOR UPDATE
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can delete instagram stats for their projects"
  ON public.instagram_content_stats FOR DELETE
  USING (public.has_project_access(auth.uid(), project_id));

-- Create indexes for performance
CREATE INDEX idx_marketing_stats_project_date ON public.marketing_stats(project_id, date DESC);
CREATE INDEX idx_marketing_stats_source ON public.marketing_stats(source);
CREATE INDEX idx_instagram_stats_project ON public.instagram_content_stats(project_id);

-- Add trigger for updated_at
CREATE TRIGGER update_marketing_stats_updated_at
  BEFORE UPDATE ON public.marketing_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();