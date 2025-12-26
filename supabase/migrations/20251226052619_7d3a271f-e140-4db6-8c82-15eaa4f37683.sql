-- Fix update_updated_at_column function - add search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix handle_new_user function - add search_path (already has SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    'active'
  );
  RETURN NEW;
END;
$$;

-- Fix extract_json_path function - add search_path
CREATE OR REPLACE FUNCTION public.extract_json_path(data jsonb, path text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  parts TEXT[];
  result JSONB := data;
  part TEXT;
BEGIN
  parts := string_to_array(path, '.');
  FOREACH part IN ARRAY parts
  LOOP
    IF result IS NULL THEN
      RETURN NULL;
    END IF;
    result := result -> part;
  END LOOP;
  RETURN result #>> '{}';
END;
$$;