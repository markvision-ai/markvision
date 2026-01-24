-- Создать таблицу followers_history
CREATE TABLE IF NOT EXISTS public.followers_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  date DATE NOT NULL,
  followers_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(project_id, date)
);

-- Включить RLS
ALTER TABLE public.followers_history ENABLE ROW LEVEL SECURITY;

-- Создать политику
CREATE POLICY "Allow all operations" ON public.followers_history FOR ALL USING (true);

