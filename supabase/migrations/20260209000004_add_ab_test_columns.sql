ALTER TABLE ab_tests ADD COLUMN IF NOT EXISTS facebook_ad_a_id text;
ALTER TABLE ab_tests ADD COLUMN IF NOT EXISTS facebook_ad_b_id text;
ALTER TABLE ab_tests ADD COLUMN IF NOT EXISTS facebook_adset_a_id text;
ALTER TABLE ab_tests ADD COLUMN IF NOT EXISTS facebook_adset_b_id text;
ALTER TABLE ab_tests ADD COLUMN IF NOT EXISTS min_sample_size integer DEFAULT 1000;
ALTER TABLE ab_tests ADD COLUMN IF NOT EXISTS auto_winner_threshold integer DEFAULT 95;
ALTER TABLE ab_tests ADD COLUMN IF NOT EXISTS traffic_allocation integer DEFAULT 50;
