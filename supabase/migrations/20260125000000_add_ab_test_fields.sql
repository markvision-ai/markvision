-- Add fields to ab_tests table for page path and variant content
ALTER TABLE public.ab_tests
ADD COLUMN IF NOT EXISTS page_path TEXT,
ADD COLUMN IF NOT EXISTS variant_a_title TEXT,
ADD COLUMN IF NOT EXISTS variant_a_text TEXT,
ADD COLUMN IF NOT EXISTS variant_b_title TEXT,
ADD COLUMN IF NOT EXISTS variant_b_text TEXT;

-- Add fields to leads table for A/B test tracking
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS ab_test_id UUID REFERENCES public.ab_tests(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS ab_test_variant TEXT CHECK (ab_test_variant IN ('a', 'b') OR ab_test_variant IS NULL);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_ab_test ON public.leads(ab_test_id, ab_test_variant);
CREATE INDEX IF NOT EXISTS idx_ab_tests_page_path ON public.ab_tests(page_path) WHERE page_path IS NOT NULL;
