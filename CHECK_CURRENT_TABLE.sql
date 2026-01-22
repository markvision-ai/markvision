-- КРИТИЧЕСКАЯ ПРОВЕРКА: Что реально есть в таблице ad_accounts

-- 1. Проверяем существование таблицы
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'ad_accounts'
) as table_exists;

-- 2. Смотрим ВСЕ колонки
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'ad_accounts'
ORDER BY ordinal_position;

-- 3. Смотрим ВСЕ constraints
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'ad_accounts' AND tc.table_schema = 'public';

-- 4. Смотрим текущие данные
SELECT * FROM public.ad_accounts;
