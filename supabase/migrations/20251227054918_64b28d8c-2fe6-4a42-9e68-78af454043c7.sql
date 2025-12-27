-- Content Factory table for production pipeline
CREATE TABLE public.content_factory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL DEFAULT 'avatar_video',
  title TEXT NOT NULL,
  
  -- Content fields
  original_script TEXT,
  rewritten_script TEXT,
  caption TEXT,
  source_url TEXT,
  
  -- File URLs from n8n/external services
  audio_url TEXT,
  raw_video_url TEXT,
  final_video_url TEXT,
  carousel_media JSONB DEFAULT '[]'::jsonb,
  
  -- Stage statuses
  status TEXT NOT NULL DEFAULT 'ideation',
  feedback TEXT,
  
  -- Analytics
  competitor_id UUID,
  views_count INTEGER DEFAULT 0,
  followers_gained INTEGER DEFAULT 0,
  revenue_attributed NUMERIC DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Competitor monitoring table
CREATE TABLE public.competitor_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  account_handle TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'instagram',
  last_scanned_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_factory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_monitoring ENABLE ROW LEVEL SECURITY;

-- RLS policies for content_factory
CREATE POLICY "Require auth for content_factory"
  ON public.content_factory FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view content for accessible projects"
  ON public.content_factory FOR SELECT
  USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can manage content for accessible projects"
  ON public.content_factory FOR ALL
  USING (has_project_access(auth.uid(), project_id));

-- RLS policies for competitor_monitoring
CREATE POLICY "Require auth for competitor_monitoring"
  ON public.competitor_monitoring FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view competitors for accessible projects"
  ON public.competitor_monitoring FOR SELECT
  USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can manage competitors for accessible projects"
  ON public.competitor_monitoring FOR ALL
  USING (has_project_access(auth.uid(), project_id));

-- Indexes for performance
CREATE INDEX idx_content_factory_project ON public.content_factory(project_id);
CREATE INDEX idx_content_factory_status ON public.content_factory(status);
CREATE INDEX idx_content_factory_type ON public.content_factory(content_type);
CREATE INDEX idx_competitor_monitoring_project ON public.competitor_monitoring(project_id);

-- Enable realtime for content updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_factory;

-- Update trigger for content_factory
CREATE TRIGGER update_content_factory_updated_at
  BEFORE UPDATE ON public.content_factory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.content_factory IS 'Production pipeline for content creation';
COMMENT ON TABLE public.competitor_monitoring IS 'Competitor accounts for content ideation';
COMMENT ON COLUMN public.content_factory.content_type IS 'avatar_video, ai_video, static_post, carousel, threads, tg_text';
COMMENT ON COLUMN public.content_factory.status IS 'ideation, scripting, voice_ready, avatar_ready, editing_ready, ready_to_send, sent';