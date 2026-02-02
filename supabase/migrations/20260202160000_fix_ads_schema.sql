-- Fix campaigns and marketing_stats tables to support Meta Ads Sync

-- 1. Update campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS status BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS budget NUMERIC,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add unique constraint for upsert
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaigns_project_id_external_id_key') THEN
        ALTER TABLE public.campaigns ADD CONSTRAINT campaigns_project_id_external_id_key UNIQUE (project_id, external_id);
    END IF;
END $$;


-- 2. Update marketing_stats table
ALTER TABLE public.marketing_stats
ADD COLUMN IF NOT EXISTS campaign_id TEXT,
ADD COLUMN IF NOT EXISTS campaign_name TEXT,
ADD COLUMN IF NOT EXISTS ad_account_id TEXT,
ADD COLUMN IF NOT EXISTS raw_data JSONB,
ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS purchases INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS revenue NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS roi NUMERIC DEFAULT 0;

-- Add unique constraint for upsert
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'marketing_stats_project_source_date_campaign_key') THEN
        ALTER TABLE public.marketing_stats ADD CONSTRAINT marketing_stats_project_source_date_campaign_key UNIQUE (project_id, source, date, campaign_id);
    END IF;
END $$;

-- Enable RLS just in case
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_stats ENABLE ROW LEVEL SECURITY;

-- Policies (permissive for now, similar to existing ones)
CREATE POLICY "Enable all for users" ON public.campaigns FOR ALL USING (true);
CREATE POLICY "Enable all for users" ON public.marketing_stats FOR ALL USING (true);
