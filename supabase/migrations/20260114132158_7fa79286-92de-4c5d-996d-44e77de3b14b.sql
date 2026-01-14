-- Добавляем leads в realtime publication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
EXCEPTION 
  WHEN duplicate_object THEN NULL;
END $$;