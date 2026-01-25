-- Create scoring_insights table for AI recommendations
CREATE TABLE IF NOT EXISTS public.scoring_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  recommendation_type TEXT NOT NULL, -- 'add_rule', 'modify_rule', 'remove_rule'
  suggested_field TEXT,
  suggested_operator TEXT,
  suggested_value TEXT,
  suggested_score_delta INTEGER,
  confidence_score DECIMAL(3, 2) DEFAULT 0.5, -- 0.00 to 1.00
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'dismissed')),
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_scoring_insights_project ON public.scoring_insights(project_id, status);
CREATE INDEX IF NOT EXISTS idx_scoring_insights_status ON public.scoring_insights(status) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.scoring_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scoring_insights
CREATE POLICY "Users can view scoring_insights for accessible projects" ON public.scoring_insights
FOR SELECT USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can manage scoring_insights for accessible projects" ON public.scoring_insights
FOR ALL USING (has_project_access(auth.uid(), project_id));
