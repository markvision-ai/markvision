-- =====================================================
-- Replace engagement with comments in content_production_stats
-- =====================================================
-- Заменяем поле engagement на comments

-- Добавляем новое поле comments если его нет
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'content_production_stats' 
    AND column_name = 'comments'
  ) THEN
    ALTER TABLE public.content_production_stats 
    ADD COLUMN comments INTEGER DEFAULT 0;
  END IF;
END $$;

-- Если есть engagement, копируем данные (если нужно)
-- Но engagement это %, а comments это количество, так что просто удаляем engagement
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'content_production_stats' 
    AND column_name = 'engagement'
  ) THEN
    ALTER TABLE public.content_production_stats 
    DROP COLUMN engagement;
  END IF;
END $$;

-- Комментарии
COMMENT ON COLUMN public.content_production_stats.comments IS 'Общее количество комментариев';
