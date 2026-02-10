-- Ensure table exists
CREATE TABLE IF NOT EXISTS public.agency_project_finances (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    project_name text,
    tier text DEFAULT 'pro'::text,
    package_revenue numeric DEFAULT 0,
    team_members text,
    team_salaries numeric DEFAULT 0,
    software_costs numeric DEFAULT 0,
    other_expenses numeric DEFAULT 0,
    payment_date date,
    yuri_net_profit numeric GENERATED ALWAYS AS (package_revenue - (team_salaries + software_costs + other_expenses)) STORED,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(project_id)
);

-- Ensure columns exist (idempotent)
DO $$ 
BEGIN 
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_project_finances' AND column_name = 'other_expenses') THEN
        ALTER TABLE public.agency_project_finances ADD COLUMN other_expenses numeric DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_project_finances' AND column_name = 'payment_date') THEN
        ALTER TABLE public.agency_project_finances ADD COLUMN payment_date date;
    END IF;

    -- Recreating generated column if needed (postgres doesn't support IF NOT EXISTS for ADD COLUMN with GENERATED ALWAYS easily in one line without dropping first)
    -- But since we use IF NOT EXISTS for table creation, we assume if table exists, it might be old schema.
    -- Let's check if yuri_net_profit exists, if not add it.
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_project_finances' AND column_name = 'yuri_net_profit') THEN
        ALTER TABLE public.agency_project_finances ADD COLUMN yuri_net_profit numeric GENERATED ALWAYS AS (package_revenue - (team_salaries + software_costs + other_expenses)) STORED;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.agency_project_finances ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agency_project_finances' AND policyname = 'Enable all access for users') THEN
        CREATE POLICY "Enable all access for users" ON public.agency_project_finances FOR ALL USING (true);
    END IF;
END $$;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
