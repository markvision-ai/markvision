-- =====================================================
-- БЫСТРОЕ ОБНОВЛЕНИЕ: Замена engagement на comments
-- =====================================================
-- Скопируй и выполни этот скрипт в Supabase SQL Editor

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
    RAISE NOTICE 'Добавлено поле comments';
  ELSE
    RAISE NOTICE 'Поле comments уже существует';
  END IF;
END $$;

-- Удаляем поле engagement если оно есть
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'content_production_stats' 
    AND column_name = 'engagement'
  ) THEN
    ALTER TABLE public.content_production_stats 
    DROP COLUMN engagement;
    RAISE NOTICE 'Удалено поле engagement';
  ELSE
    RAISE NOTICE 'Поле engagement не существует';
  END IF;
END $$;

-- Комментарии
COMMENT ON COLUMN public.content_production_stats.comments IS 'Общее количество комментариев';

-- Проверка
SELECT 'Таблица content_production_stats успешно обновлена!' AS status;
