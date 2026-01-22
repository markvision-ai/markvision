-- Create agency_project_finances table
CREATE TABLE IF NOT EXISTS public.agency_project_finances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- Project info
  project_name TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'pro' CHECK (tier IN ('lite', 'pro', 'legacy')),
  
  -- Revenue
  package_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
  
  -- Expenses (combined: salaries + software)
  team_members TEXT,
  total_expenses DECIMAL(12,2) NOT NULL DEFAULT 0,
  
  -- Calculated net profit for Yuri
  yuri_net_profit DECIMAL(12,2) GENERATED ALWAYS AS (
    package_revenue - total_expenses
  ) STORED,
  
  -- Period
  month DATE NOT NULL DEFAULT date_trunc('month', CURRENT_DATE),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE (project_id, month)
);

-- Enable RLS
ALTER TABLE public.agency_project_finances ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only super admin can access
CREATE POLICY "Only super admin can view agency finances"
ON public.agency_project_finances
FOR SELECT
USING (
  auth.uid() = 'd94043b0-1c76-4017-84de-df0dbf00a2c9'::uuid
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  )
);

CREATE POLICY "Only super admin can manage agency finances"
ON public.agency_project_finances
FOR ALL
USING (
  auth.uid() = 'd94043b0-1c76-4017-84de-df0dbf00a2c9'::uuid
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  )
)
WITH CHECK (
  auth.uid() = 'd94043b0-1c76-4017-84de-df0dbf00a2c9'::uuid
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_agency_project_finances_updated_at
  BEFORE UPDATE ON public.agency_project_finances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_agency_finances_project_month ON public.agency_project_finances(project_id, month);
CREATE INDEX idx_agency_finances_month ON public.agency_project_finances(month);

-- Comments
COMMENT ON TABLE public.agency_project_finances IS 'Agency-level financial analytics for Yuri (super admin only)';
COMMENT ON COLUMN public.agency_project_finances.yuri_net_profit IS 'Auto-calculated: package_revenue - total_expenses';
