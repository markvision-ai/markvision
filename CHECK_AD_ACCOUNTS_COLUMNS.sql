-- ПРОВЕРКА: Какие колонки есть в ad_accounts?
-- Выполните этот SQL первым, чтобы увидеть структуру таблицы

SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'ad_accounts'
ORDER BY ordinal_position;
