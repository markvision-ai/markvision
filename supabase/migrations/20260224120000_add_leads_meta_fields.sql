-- Migration: Add fb_ad_account_id and fb_campaign_id to leads table
-- Enables Meta Analytics module to group leads by ad account for CPL/LQR/CPQL/CPV/CAC/ROMI

ALTER TABLE leads ADD COLUMN IF NOT EXISTS fb_ad_account_id text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS fb_campaign_id text;

-- Index for fast aggregation in useMetaAccountAnalytics
CREATE INDEX IF NOT EXISTS idx_leads_fb_ad_account_id ON leads(fb_ad_account_id);
CREATE INDEX IF NOT EXISTS idx_leads_fb_campaign_id ON leads(fb_campaign_id);
