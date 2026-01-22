-- ИСПРАВЛЕНИЕ: Добавление колонки external_id в ad_accounts
-- Выполните этот SQL в Supabase SQL Editor

-- Проверяем, существует ли таблица
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'ad_accounts'
  ) THEN
    -- Создаем таблицу с нуля
    CREATE TABLE public.ad_accounts (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
      platform TEXT NOT NULL CHECK (platform IN ('facebook', 'tiktok', 'google')),
      external_id TEXT NOT NULL,
      name TEXT NOT NULL,
      access_token TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      UNIQUE (project_id, platform, external_id)
    );

    -- Enable RLS
    ALTER TABLE public.ad_accounts ENABLE ROW LEVEL SECURITY;

    -- Index for faster lookups
    CREATE INDEX idx_ad_accounts_project_id ON public.ad_accounts(project_id);
    CREATE INDEX idx_ad_accounts_platform ON public.ad_accounts(platform);

    RAISE NOTICE 'Table ad_accounts created successfully';
  ELSE
    -- Таблица существует, проверяем колонку external_id
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'ad_accounts' 
      AND column_name = 'external_id'
    ) THEN
      -- Добавляем колонку external_id
      ALTER TABLE public.ad_accounts 
      ADD COLUMN external_id TEXT NOT NULL DEFAULT 'default_external_id';

      RAISE NOTICE 'Column external_id added to ad_accounts';
    ELSE
      RAISE NOTICE 'Column external_id already exists';
    END IF;
  END IF;
END $$;

-- Policy: Users can view ad accounts for accessible projects
DROP POLICY IF EXISTS "Users can view ad accounts for accessible projects" ON public.ad_accounts;
CREATE POLICY "Users can view ad accounts for accessible projects"
ON public.ad_accounts
FOR SELECT
USING (
  project_id IN (
    SELECT project_id 
    FROM public.project_access 
    WHERE user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Policy: Users can manage ad accounts for accessible projects
DROP POLICY IF EXISTS "Users can manage ad accounts for accessible projects" ON public.ad_accounts;
CREATE POLICY "Users can manage ad accounts for accessible projects"
ON public.ad_accounts
FOR ALL
USING (
  project_id IN (
    SELECT project_id 
    FROM public.project_access 
    WHERE user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  project_id IN (
    SELECT project_id 
    FROM public.project_access 
    WHERE user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Trigger для updated_at
DROP TRIGGER IF EXISTS update_ad_accounts_updated_at ON public.ad_accounts;
CREATE TRIGGER update_ad_accounts_updated_at
  BEFORE UPDATE ON public.ad_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Проверка результата
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'ad_accounts'
ORDER BY ordinal_position;
