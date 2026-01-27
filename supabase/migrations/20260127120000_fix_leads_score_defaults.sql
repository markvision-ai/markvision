-- Fix "invalid input syntax for type integer: ❄️ LOW" on lead insert.
-- Ensure lead_score / score_label have no bad defaults (avoid string->int cast).

ALTER TABLE public.leads
  ALTER COLUMN lead_score SET DEFAULT NULL,
  ALTER COLUMN score_label SET DEFAULT NULL;
