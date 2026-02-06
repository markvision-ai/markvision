
ALTER TABLE public.monthly_financial_plans 
ADD COLUMN IF NOT EXISTS rationale_best text,
ADD COLUMN IF NOT EXISTS rationale_avg text,
ADD COLUMN IF NOT EXISTS rationale_worst text;
