-- ШАГ 1: Проверяем структуру таблицы
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'instagram_posts_stats' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ШАГ 2: Добавляем недостающую колонку project_id (если таблицы нет - создадим её)
-- Сперва попробуем добавить колонку
DO $$
BEGIN
    -- Проверяем, существует ли колонка
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'instagram_posts_stats' 
        AND column_name = 'project_id'
    ) THEN
        -- Добавляем колонку
        ALTER TABLE public.instagram_posts_stats ADD COLUMN project_id UUID;
        
        -- Заполняем значения по умолчанию
        UPDATE public.instagram_posts_stats SET project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa' WHERE project_id IS NULL;
        
        -- Делаем колонку NOT NULL
        ALTER TABLE public.instagram_posts_stats ALTER COLUMN project_id SET NOT NULL;
        
        RAISE NOTICE 'Колонка project_id добавлена успешно';
    ELSE
        RAISE NOTICE 'Колонка project_id уже существует';
    END IF;
END $$;

-- ШАГ 3: Если таблица не существует вообще - создаем её
CREATE TABLE IF NOT EXISTS public.instagram_posts_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL DEFAULT '64c94e87-630c-470e-8ab1-8f7c8c835efa',
  post_id TEXT NOT NULL,
  caption TEXT,
  media_type TEXT,
  media_url TEXT,
  permalink TEXT,
  posted_at DATE,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  leads_count INTEGER DEFAULT 0,
  paid_leads INTEGER DEFAULT 0,
  revenue INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id)
);

-- ШАГ 4: Создаем индексы
CREATE INDEX IF NOT EXISTS idx_instagram_posts_stats_project_id ON public.instagram_posts_stats(project_id);
CREATE INDEX IF NOT EXISTS idx_instagram_posts_stats_posted_at ON public.instagram_posts_stats(posted_at);

-- ШАГ 5: Настраиваем RLS
ALTER TABLE public.instagram_posts_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON public.instagram_posts_stats;
CREATE POLICY "Allow all operations" ON public.instagram_posts_stats FOR ALL USING (true);

-- ШАГ 6: Проверяем результат
SELECT 'Таблица instagram_posts_stats готова к работе!' as status, COUNT(*) as posts_count FROM public.instagram_posts_stats;
