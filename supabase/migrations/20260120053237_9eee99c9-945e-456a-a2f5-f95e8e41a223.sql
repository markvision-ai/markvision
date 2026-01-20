-- Create agency_finances table for tracking project profitability
CREATE TABLE public.agency_finances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  month DATE NOT NULL DEFAULT date_trunc('month', CURRENT_DATE),
  tariff TEXT NOT NULL DEFAULT 'Pro',
  package_cost NUMERIC NOT NULL DEFAULT 0,
  team_members TEXT[] DEFAULT '{}',
  team_costs NUMERIC NOT NULL DEFAULT 0,
  additional_costs NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT agency_finances_project_month_unique UNIQUE (project_id, month),
  CONSTRAINT agency_finances_tariff_check CHECK (tariff IN ('Lite', 'Pro', 'Legacy', 'Custom'))
);

-- Enable RLS
ALTER TABLE public.agency_finances ENABLE ROW LEVEL SECURITY;

-- RLS policies - only admins and project owners can view/manage
CREATE POLICY "Admins can manage all agency finances"
ON public.agency_finances AS RESTRICTIVE
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Project owners can view own finances"
ON public.agency_finances FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = agency_finances.project_id
    AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "Project owners can manage own finances"
ON public.agency_finances FOR ALL
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = agency_finances.project_id
    AND p.owner_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = agency_finances.project_id
    AND p.owner_id = auth.uid()
  )
);

-- Add updated_at trigger
CREATE TRIGGER update_agency_finances_updated_at
BEFORE UPDATE ON public.agency_finances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.agency_finances;