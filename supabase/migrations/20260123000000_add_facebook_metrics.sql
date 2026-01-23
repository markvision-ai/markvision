-- Migration: Add Facebook Ads extended metrics to marketing_stats
-- Date: 2026-01-23
-- Description: Добавляет дополнительные метрики для более полной аналитики FB Ads

-- Add new columns if they don't exist
ALTER TABLE marketing_stats
ADD COLUMN IF NOT EXISTS reach INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ctr NUMERIC(10,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cpc NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cpm NUMERIC(10,2) DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN marketing_stats.reach IS 'Number of unique users who saw the ad';
COMMENT ON COLUMN marketing_stats.ctr IS 'Click-through rate (clicks/impressions * 100)';
COMMENT ON COLUMN marketing_stats.cpc IS 'Cost per click';
COMMENT ON COLUMN marketing_stats.cpm IS 'Cost per thousand impressions';

-- Create index for faster queries by source
CREATE INDEX IF NOT EXISTS idx_marketing_stats_source_date 
ON marketing_stats(source, date DESC);

-- Create index for project_id + date + source (for upsert operations)
CREATE INDEX IF NOT EXISTS idx_marketing_stats_unique_record 
ON marketing_stats(project_id, date, source);

-- Update RLS policies if needed (только если у вас есть RLS)
-- ALTER POLICY IF EXISTS "Users can view marketing stats" ON marketing_stats
-- USING (project_id IN (SELECT id FROM projects WHERE organization_id = auth.uid()));

-- Create view for easy FB stats access
CREATE OR REPLACE VIEW facebook_stats_daily AS
SELECT 
  project_id,
  date,
  spend,
  impressions,
  clicks,
  reach,
  ctr,
  cpc,
  cpm,
  CASE 
    WHEN impressions > 0 THEN (clicks::NUMERIC / impressions * 100)
    ELSE 0 
  END as calculated_ctr,
  CASE 
    WHEN clicks > 0 THEN (spend / clicks)
    ELSE 0 
  END as calculated_cpc,
  CASE 
    WHEN impressions > 0 THEN (spend / impressions * 1000)
    ELSE 0 
  END as calculated_cpm,
  created_at,
  updated_at
FROM marketing_stats
WHERE source = 'facebook_ads'
ORDER BY date DESC;

COMMENT ON VIEW facebook_stats_daily IS 'Daily Facebook Ads statistics with calculated metrics';

-- Function to check data freshness
CREATE OR REPLACE FUNCTION check_facebook_sync_health(p_project_id UUID)
RETURNS TABLE (
  last_sync_date DATE,
  hours_since_update NUMERIC,
  is_stale BOOLEAN,
  total_spend_7d NUMERIC,
  total_impressions_7d BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    MAX(ms.date) as last_sync_date,
    EXTRACT(EPOCH FROM (NOW() - MAX(ms.updated_at)))/3600 as hours_since_update,
    EXTRACT(EPOCH FROM (NOW() - MAX(ms.updated_at)))/3600 > 2 as is_stale,
    SUM(CASE WHEN ms.date >= CURRENT_DATE - 7 THEN ms.spend ELSE 0 END) as total_spend_7d,
    SUM(CASE WHEN ms.date >= CURRENT_DATE - 7 THEN ms.impressions ELSE 0 END)::BIGINT as total_impressions_7d
  FROM marketing_stats ms
  WHERE ms.project_id = p_project_id
    AND ms.source = 'facebook_ads';
END;
$$;

COMMENT ON FUNCTION check_facebook_sync_health IS 'Check health and freshness of Facebook data sync';

-- Grant permissions (adjust based on your RLS setup)
-- GRANT SELECT ON facebook_stats_daily TO authenticated;
-- GRANT EXECUTE ON FUNCTION check_facebook_sync_health TO authenticated;
