-- Add unique constraint for daily_data upsert if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'daily_data_project_id_date_unique'
  ) THEN
    ALTER TABLE public.daily_data 
    ADD CONSTRAINT daily_data_project_id_date_unique 
    UNIQUE (project_id, date);
  END IF;
END $$;

-- Add unique constraint for plan_data upsert if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'plan_data_project_id_month_unique'
  ) THEN
    ALTER TABLE public.plan_data 
    ADD CONSTRAINT plan_data_project_id_month_unique 
    UNIQUE (project_id, month);
  END IF;
END $$;