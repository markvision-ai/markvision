-- ✅ ГОТОВЫЙ SQL ДЛЯ ВЫПОЛНЕНИЯ В SUPABASE
-- Скопируй ВСЁ ниже и вставь в Supabase SQL Editor

-- 1. УДАЛЯЕМ старую таблицу
DROP TABLE IF EXISTS public.ad_accounts CASCADE;

-- 2. СОЗДАЁМ новую с правильной структурой
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

-- 3. RLS политики
ALTER TABLE public.ad_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ad_accounts for their projects"
  ON public.ad_accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_access
      WHERE project_access.project_id = ad_accounts.project_id
        AND project_access.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Authenticated users can insert ad_accounts"
  ON public.ad_accounts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update ad_accounts for their projects"
  ON public.ad_accounts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.project_access
      WHERE project_access.project_id = ad_accounts.project_id
        AND project_access.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete ad_accounts"
  ON public.ad_accounts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'super_admin')
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
  'EAAa3xKWvHHYBQnmvSDKWNASV0brrLnJzHtNW54CaaQzt3JQZAyoTpnt6Eku4ZCHInZCvOe7c2cDMXFFopOtOaiyZCjLX1KZBefkrGKCSNOHsAu3kla1zZBSZBDpxUrlYZAoqlQ9czHuNJFEKpVR3MAbXTwPkMtIoxZCZCGt65hZA20Pyq18DYwxHYy2ZCKZB6m2JhPZANT7BQ5shvvp9HLYrhND8AvL3f70N7RA0JNv893uh8bJUha1IptxqQZBktSqfB8u0efK1EyZCOBL5jo4ZD',
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
  'Token length: ' || LENGTH(access_token) || ' chars' as token_info
FROM public.ad_accounts
WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa';

-- ✅ После выполнения должно показать:
-- platform: facebook
-- status: active
-- token_info: Token length: 267 chars
