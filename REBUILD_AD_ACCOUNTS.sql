-- КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Пересоздаём таблицу ad_accounts с нуля

-- 1. УДАЛЯЕМ старую таблицу (если есть проблемы)
DROP TABLE IF EXISTS public.ad_accounts CASCADE;

-- 2. СОЗДАЁМ новую с МИНИМАЛЬНОЙ структурой
CREATE TABLE public.ad_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'tiktok', 'google')),
  external_id TEXT NOT NULL,
  access_token TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (project_id, platform, external_id)
);

-- 3. RLS
ALTER TABLE public.ad_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage ad_accounts for their projects"
  ON public.ad_accounts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.project_access
      WHERE project_access.project_id = ad_accounts.project_id
        AND project_access.user_id = auth.uid()
    )
  );

-- 4. Индекс
CREATE INDEX IF NOT EXISTS idx_ad_accounts_project_id ON public.ad_accounts(project_id);

-- 5. ВСТАВЛЯЕМ твой Facebook токен
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
);

-- 6. ПРОВЕРЯЕМ результат
SELECT 
  id,
  project_id,
  platform,
  external_id,
  status,
  created_at,
  LEFT(access_token, 30) || '...' as token_preview
FROM public.ad_accounts
WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa';
