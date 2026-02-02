-- Fix for "column 'created_at' of relation 'daily_data' does not exist" error
-- This migration updates the handle_new_lead function to remove the reference to created_at

CREATE OR REPLACE FUNCTION public.handle_new_lead()
RETURNS TRIGGER AS $$
BEGIN
  -- Update daily_data for the current date and project
  -- Uses 'date' column instead of 'day'
  -- Removed created_at from INSERT as it doesn't exist in daily_data
  INSERT INTO public.daily_data (project_id, date, leads, updated_at)
  VALUES (
    NEW.project_id, 
    CURRENT_DATE, 
    1, 
    now()
  )
  ON CONFLICT (project_id, date)
  DO UPDATE SET
    leads = COALESCE(daily_data.leads, 0) + 1,
    updated_at = now();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
