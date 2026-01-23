-- =====================================================
-- Fix timestamp column name in instagram_posts_stats
-- =====================================================
-- Переименовываем timestamp в posted_at (timestamp - зарезервированное слово)

DO $$ 
BEGIN
  -- Проверяем существует ли колонка timestamp
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'instagram_posts_stats' 
    AND column_name = 'timestamp'
  ) THEN
    -- Переименовываем колонку
    ALTER TABLE public.instagram_posts_stats 
    RENAME COLUMN timestamp TO posted_at;
    
    -- Пересоздаем индекс
    DROP INDEX IF EXISTS idx_instagram_posts_timestamp;
    CREATE INDEX IF NOT EXISTS idx_instagram_posts_posted_at 
    ON public.instagram_posts_stats(posted_at DESC);
  END IF;
END $$;
