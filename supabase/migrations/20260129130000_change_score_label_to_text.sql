-- Change score_label to TEXT to support values like "❄️ LOW" or "🔥 HOT"
ALTER TABLE public.leads ALTER COLUMN score_label TYPE text;
