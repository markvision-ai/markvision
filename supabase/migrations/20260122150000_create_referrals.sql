-- Create referrals table for viral loop functionality
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  referrer_lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  referee_name TEXT NOT NULL,
  referee_phone TEXT NOT NULL,
  certificate_value NUMERIC DEFAULT 10000,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'opened', 'converted', 'cancelled')),
  sent_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE,
  converted_lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view referrals for accessible projects
CREATE POLICY "Users can view referrals for accessible projects"
ON public.referrals
FOR SELECT
USING (
  project_id IN (
    SELECT project_id 
    FROM public.project_access 
    WHERE user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Policy: Users can manage referrals for accessible projects
CREATE POLICY "Users can manage referrals for accessible projects"
ON public.referrals
FOR ALL
USING (
  project_id IN (
    SELECT project_id 
    FROM public.project_access 
    WHERE user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  project_id IN (
    SELECT project_id 
    FROM public.project_access 
    WHERE user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Trigger: Update updated_at on modification
CREATE TRIGGER update_referrals_updated_at
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_referrals_project_id ON public.referrals(project_id);
CREATE INDEX idx_referrals_referrer_lead_id ON public.referrals(referrer_lead_id);
CREATE INDEX idx_referrals_status ON public.referrals(status);
CREATE INDEX idx_referrals_created_at ON public.referrals(created_at DESC);
