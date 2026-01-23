-- =====================================================
-- ПРОВЕРКА ДАННЫХ INSTAGRAM
-- =====================================================
-- Выполни этот скрипт в Supabase SQL Editor

-- 1. Проверь что таблица существует
SELECT 
  'Таблица существует' AS status,
  COUNT(*) AS total_posts
FROM instagram_posts_stats;

-- 2. Посмотри структуру таблицы
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'instagram_posts_stats'
ORDER BY ordinal_position;

-- 3. Проверь RLS политики
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'instagram_posts_stats';

-- 4. Проверь есть ли данные
SELECT 
  COUNT(*) AS total_posts,
  COUNT(DISTINCT post_id) AS unique_posts,
  MIN(posted_at) AS oldest_post,
  MAX(posted_at) AS newest_post
FROM instagram_posts_stats;

-- 5. Посмотри последние посты (если есть)
SELECT 
  post_id,
  LEFT(caption, 50) AS caption_preview,
  impressions,
  reach,
  likes,
  comments,
  leads_count,
  revenue,
  posted_at
FROM instagram_posts_stats 
ORDER BY posted_at DESC 
LIMIT 10;

-- 6. Если данных нет - это нормально, нужно запустить workflow в n8n!
