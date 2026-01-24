-- Add followers column to daily_data table
ALTER TABLE public.daily_data 
ADD COLUMN IF NOT EXISTS followers INTEGER NOT NULL DEFAULT 0;

-- Add followers column to plan_data table
ALTER TABLE public.plan_data 
ADD COLUMN IF NOT EXISTS followers INTEGER NOT NULL DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.daily_data.followers IS 'Количество новых подписчиков за день';
COMMENT ON COLUMN public.plan_data.followers IS 'Плановое количество новых подписчиков за месяц';
