-- Fix: marketing_stats unique constraint must include ad_account_id
-- Previously, rows from different ad accounts with the same campaign_id were being
-- merged into a single row, causing lead counts to be overwritten instead of summed.

-- Drop old constraint (if it exists)
ALTER TABLE marketing_stats
  DROP CONSTRAINT IF EXISTS marketing_stats_project_id_source_date_campaign_id_key;

-- Create the new, correct unique constraint that includes ad_account_id
ALTER TABLE marketing_stats
  ADD CONSTRAINT marketing_stats_project_source_date_campaign_account_key
  UNIQUE (project_id, source, date, campaign_id, ad_account_id);
