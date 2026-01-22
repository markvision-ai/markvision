-- МИНИМАЛЬНЫЙ SQL: Только необходимые колонки
-- Скопируйте и выполните в Supabase SQL Editor

-- Шаг 1: Добавляем external_id если его нет
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'ad_accounts'
  ) THEN
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'ad_accounts' AND column_name = 'external_id'
    ) THEN
      ALTER TABLE public.ad_accounts ADD COLUMN external_id TEXT;
      RAISE NOTICE 'Column external_id added';
    END IF;
  END IF;
END $$;

-- Шаг 2: Вставляем ваш токен (ТОЛЬКО существующие колонки)
INSERT INTO public.ad_accounts (
  project_id, 
  platform, 
  external_id, 
  access_token, 
  status
)
VALUES (
  '64c94e87-630c-470e-8ab1-8f7c8c835efa',
  'facebook',
  'facebook_manual_token',
  'EAAa3xKWvHHYBQqZC8dx2ak915FmdlfuGN2Ma37x5Nq5gbSamnSwY07EJ08wlhX2vvgsHx5VKbkCO0HgwKNhTIqVxtQyJJQuhPIZApPRFf1J5AVP9BT9SdTmJddxQZAJYWrtGVp2kO519iGemsa9kqSEgXt75o32jZAsKs86ldJ3OWp4qO5lTWx5kBw9dSFZAKzZCiqXVLOAIabuqms6Qn0xDSu4IJVGVguCrfMFw4CaoJ9TrVqMT5jmPJwKcBbaea7QWcEtb7TuEv7igTGZB7qb',
  'active'
)
ON CONFLICT (project_id, platform, external_id) 
DO UPDATE SET 
  access_token = EXCLUDED.access_token;

-- Шаг 3: Проверяем результат
SELECT * FROM public.ad_accounts
WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa'
  AND platform = 'facebook';
