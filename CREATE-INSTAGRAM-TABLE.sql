-- =====================================================
-- БЫСТРОЕ СОЗДАНИЕ ТАБЛИЦЫ instagram_posts_stats
-- =====================================================
-- Скопируй и выполни этот скрипт в Supabase SQL Editor

-- Удаляем таблицу если существует (ОСТОРОЖНО: удалит все данные!)
DROP TABLE IF EXISTS public.instagram_posts_stats CASCADE;

-- Создаем таблицу
CREATE TABLE public.instagram_posts_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id TEXT UNIQUE NOT NULL,
  caption TEXT,
  media_type TEXT,
  media_url TEXT,
  permalink TEXT,
  posted_at TIMESTAMPTZ,
  
  -- Метрики Instagram
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  
  -- Бизнес-метрики
  leads_count INTEGER DEFAULT 0,
  paid_leads INTEGER DEFAULT 0,
  revenue INTEGER DEFAULT 0,
  
  -- Служебные поля
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX idx_instagram_posts_post_id ON public.instagram_posts_stats(post_id);
CREATE INDEX idx_instagram_posts_posted_at ON public.instagram_posts_stats(posted_at DESC);
CREATE INDEX idx_instagram_posts_revenue ON public.instagram_posts_stats(revenue DESC);

-- RLS (Row Level Security)
ALTER TABLE public.instagram_posts_stats ENABLE ROW LEVEL SECURITY;

-- Политика: все могут читать
CREATE POLICY "Enable read access for all users" ON public.instagram_posts_stats
  FOR SELECT USING (true);

-- Политика: все могут вставлять/обновлять
CREATE POLICY "Enable insert for all users" ON public.instagram_posts_stats
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.instagram_posts_stats
  FOR UPDATE USING (true);

-- Комментарии
COMMENT ON TABLE public.instagram_posts_stats IS 'Статистика постов Instagram с привязкой к лидам и выручке';
COMMENT ON COLUMN public.instagram_posts_stats.post_id IS 'ID поста в Instagram';
COMMENT ON COLUMN public.instagram_posts_stats.impressions IS 'Количество показов';
COMMENT ON COLUMN public.instagram_posts_stats.reach IS 'Охват (уникальные пользователи)';
COMMENT ON COLUMN public.instagram_posts_stats.leads_count IS 'Количество лидов с этого поста';
COMMENT ON COLUMN public.instagram_posts_stats.paid_leads IS 'Количество оплаченных лидов';
COMMENT ON COLUMN public.instagram_posts_stats.revenue IS 'Выручка с этого поста (в тенге, без копеек)';

-- Проверка
SELECT 'Таблица instagram_posts_stats успешно создана!' AS status;
