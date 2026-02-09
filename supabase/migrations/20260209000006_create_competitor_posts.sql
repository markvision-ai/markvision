-- Create competitor_posts table for competitor monitoring
CREATE TABLE IF NOT EXISTS public.competitor_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    competitor_id UUID REFERENCES public.competitors(id) ON DELETE CASCADE,
    
    -- Post metadata
    post_id TEXT,
    platform TEXT DEFAULT 'instagram',
    post_url TEXT,
    posted_at TIMESTAMPTZ,
    
    -- Content
    caption TEXT,
    media_type TEXT, -- IMAGE, VIDEO, CAROUSEL_ALBUM, REELS
    media_url TEXT,
    thumbnail_url TEXT,
    
    -- Engagement metrics
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    
    -- Analysis
    ai_analysis JSONB,
    viral_score INTEGER,
    engagement_rate DECIMAL(5,2),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(project_id, post_id, platform)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_competitor_posts_project 
    ON public.competitor_posts(project_id);
    
CREATE INDEX IF NOT EXISTS idx_competitor_posts_competitor 
    ON public.competitor_posts(competitor_id);
    
CREATE INDEX IF NOT EXISTS idx_competitor_posts_posted_at 
    ON public.competitor_posts(posted_at DESC);

-- RLS policies
ALTER TABLE public.competitor_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view competitor posts for their projects"
    ON public.competitor_posts FOR SELECT
    USING (
        project_id IN (
            SELECT project_id FROM public.user_projects 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert competitor posts for their projects"
    ON public.competitor_posts FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT project_id FROM public.user_projects 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update competitor posts for their projects"
    ON public.competitor_posts FOR UPDATE
    USING (
        project_id IN (
            SELECT project_id FROM public.user_projects 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete competitor posts for their projects"
    ON public.competitor_posts FOR DELETE
    USING (
        project_id IN (
            SELECT project_id FROM public.user_projects 
            WHERE user_id = auth.uid()
        )
    );

COMMENT ON TABLE public.competitor_posts IS 'Posts from competitors for analysis and monitoring';
