
-- Create lead_status_history table
CREATE TABLE IF NOT EXISTS public.lead_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    changed_by_name TEXT,
    deal_amount_change NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_status_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.lead_status_history
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.lead_status_history
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
