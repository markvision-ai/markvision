
-- Create ad_insights table for Meta Ads sync
CREATE TABLE IF NOT EXISTS public.ad_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    ad_account_id TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('campaign', 'adset', 'ad', 'account')),
    entity_name TEXT,
    spend NUMERIC DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    actions JSONB DEFAULT '[]'::jsonb,
    leads INTEGER DEFAULT 0, -- Extracted from actions for easier querying
    date_start DATE NOT NULL,
    date_stop DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure we don't duplicate stats for the same entity and period
    CONSTRAINT ad_insights_entity_period_key UNIQUE (entity_id, date_start, date_stop)
);

-- Enable RLS
ALTER TABLE public.ad_insights ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable all for users" ON public.ad_insights FOR ALL USING (true);
