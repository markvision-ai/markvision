-- =====================================================
-- Add post_id to leads table
-- =====================================================
-- Добавляем колонку post_id для связи лидов с постами Instagram/Facebook

-- Добавляем колонку если её нет
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'leads' 
    AND column_name = 'post_id'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN post_id TEXT;
  END IF;
END $$;

-- Создаем индекс для быстрого поиска по post_id
CREATE INDEX IF NOT EXISTS idx_leads_post_id ON public.leads(post_id);

-- Комментарий
COMMENT ON COLUMN public.leads.post_id IS 'ID поста в Instagram/Facebook, откуда пришел лид';
