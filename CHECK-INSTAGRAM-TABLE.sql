-- Проверка структуры таблицы instagram_posts_stats
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'instagram_posts_stats'
AND table_schema = 'public'
ORDER BY ordinal_position;
