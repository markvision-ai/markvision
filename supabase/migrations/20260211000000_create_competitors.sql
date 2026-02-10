-- Create competitors table for monitoring (missing dependency for competitor_posts)
CREATE TABLE IF NOT EXISTS public.competitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    
    -- Identity
    handle TEXT NOT NULL,
    platform TEXT DEFAULT 'instagram',
    avatar_url TEXT,
    display_name TEXT,
    url TEXT,
    
    -- Status & Stats
    status TEXT DEFAULT 'active', -- active, paused, error
    last_scanned_at TIMESTAMPTZ,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    
    -- Metadata
    description TEXT,
    website TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(project_id, platform, handle)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_competitors_project ON public.competitors(project_id);
CREATE INDEX IF NOT EXISTS idx_competitors_platform ON public.competitors(platform);

-- RLS policies
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view competitors for their projects"
    ON public.competitors FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM public.projects
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert competitors for their projects"
    ON public.competitors FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM public.projects
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update competitors for their projects"
    ON public.competitors FOR UPDATE
    USING (
        project_id IN (
            SELECT id FROM public.projects
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete competitors for their projects"
    ON public.competitors FOR DELETE
    USING (
        project_id IN (
            SELECT id FROM public.projects
            WHERE user_id = auth.uid()
        )
    );

-- Comment
COMMENT ON TABLE public.competitors IS 'Competitor profiles for monitoring and analysis';
