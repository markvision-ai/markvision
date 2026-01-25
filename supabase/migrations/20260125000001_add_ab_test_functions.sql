-- Function to increment AB test visitors counter
CREATE OR REPLACE FUNCTION increment_ab_test_visitors(
  test_id UUID,
  variant_name TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF variant_name = 'variant_a_visitors' THEN
    UPDATE ab_tests
    SET variant_a_visitors = variant_a_visitors + 1
    WHERE id = test_id;
  ELSIF variant_name = 'variant_b_visitors' THEN
    UPDATE ab_tests
    SET variant_b_visitors = variant_b_visitors + 1
    WHERE id = test_id;
  END IF;
END;
$$;

-- Function to increment AB test conversions counter
CREATE OR REPLACE FUNCTION increment_ab_test_conversions(
  test_id UUID,
  variant_name TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF variant_name = 'variant_a_conversions' THEN
    UPDATE ab_tests
    SET variant_a_conversions = variant_a_conversions + 1
    WHERE id = test_id;
  ELSIF variant_name = 'variant_b_conversions' THEN
    UPDATE ab_tests
    SET variant_b_conversions = variant_b_conversions + 1
    WHERE id = test_id;
  END IF;
END;
$$;
