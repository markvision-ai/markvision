ALTER TABLE public.agency_project_finances 
ADD COLUMN IF NOT EXISTS other_expenses numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_date date;
