-- Fix for "column 'day' of relation 'daily_data' does not exist" error
-- This migration drops the incorrect trigger/function and recreates them with the correct 'date' column

-- 1. Drop existing trigger and function if they exist (handling potential name variations)
DROP TRIGGER IF EXISTS on_lead_created ON public.leads;
DROP FUNCTION IF EXISTS public.handle_new_lead();

-- 2. Create the correct function
CREATE OR REPLACE FUNCTION public.handle_new_lead()
RETURNS TRIGGER AS $$
BEGIN
  -- Update daily_data for the current date and project
  -- Uses 'date' column instead of 'day'
  INSERT INTO public.daily_data (project_id, date, leads, created_at, updated_at)
  VALUES (
    NEW.project_id, 
    CURRENT_DATE, 
    1, 
    now(), 
    now()
  )
  ON CONFLICT (project_id, date)
  DO UPDATE SET
    leads = COALESCE(daily_data.leads, 0) + 1,
    updated_at = now();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Recreate the trigger
CREATE TRIGGER on_lead_created
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_lead();

-- 4. Verify/Fix daily_data table structure if needed (ensure 'date' column exists)
-- This is just a safety check, usually not needed if schema is correct
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_data' AND column_name = 'date') THEN
        ALTER TABLE public.daily_data RENAME COLUMN day TO date;
    END IF;
END
$$;
