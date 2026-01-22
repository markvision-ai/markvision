-- ПРОСТОЕ ИСПРАВЛЕНИЕ: Создаем/обновляем ad_accounts и добавляем токен
-- Скопируйте весь этот код в Supabase SQL Editor и нажмите Run

-- Шаг 1: Проверяем структуру таблицы
DO $$ 
BEGIN
  -- Создаем таблицу если её нет
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'ad_accounts'
  ) THEN
    CREATE TABLE public.ad_accounts (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
      platform TEXT NOT NULL,
      external_id TEXT NOT NULL,
      access_token TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      UNIQUE (project_id, platform, external_id)
    );
    
    ALTER TABLE public.ad_accounts ENABLE ROW LEVEL SECURITY;
    CREATE INDEX IF NOT EXISTS idx_ad_accounts_project_id ON public.ad_accounts(project_id);
    
    RAISE NOTICE 'Table ad_accounts created';
  ELSE
    -- Добавляем external_id если его нет
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'ad_accounts' AND column_name = 'external_id'
    ) THEN
      ALTER TABLE public.ad_accounts ADD COLUMN external_id TEXT NOT NULL DEFAULT 'default';
      RAISE NOTICE 'Column external_id added';
    END IF;
  END IF;
END $$;

-- Шаг 2: Добавляем ваш Facebook токен
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
  access_token = EXCLUDED.access_token,
  updated_at = now();

-- Шаг 3: Проверяем результат
SELECT 
  id,
  project_id,
  platform,
  external_id,
  status,
  created_at
FROM public.ad_accounts
WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa'
  AND platform = 'facebook';
