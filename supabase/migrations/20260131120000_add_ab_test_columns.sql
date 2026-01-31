-- Add missing columns for A/B testing
ALTER TABLE ab_tests
ADD COLUMN IF NOT EXISTS variant_a_title text,
ADD COLUMN IF NOT EXISTS variant_a_text text,
ADD COLUMN IF NOT EXISTS variant_b_title text,
ADD COLUMN IF NOT EXISTS variant_b_text text;

-- Add comments for documentation
COMMENT ON COLUMN ab_tests.variant_a_title IS 'Title for Variant A';
COMMENT ON COLUMN ab_tests.variant_a_text IS 'Text content for Variant A';
COMMENT ON COLUMN ab_tests.variant_b_title IS 'Title for Variant B';
COMMENT ON COLUMN ab_tests.variant_b_text IS 'Text content for Variant B';
