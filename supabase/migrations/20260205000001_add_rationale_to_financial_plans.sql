alter table public.monthly_financial_plans
add column if not exists rationale_best text default '',
add column if not exists rationale_avg text default '',
add column if not exists rationale_worst text default '';
