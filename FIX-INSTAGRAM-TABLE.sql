-- Удалить старую таблицу если она существует
DROP TABLE IF EXISTS public.instagram_posts_stats;

-- Создать новую таблицу с правильной структурой
CREATE TABLE public.instagram_posts_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  post_id TEXT NOT NULL,
  caption TEXT,
  media_type TEXT,
  media_url TEXT,
  permalink TEXT,
  posted_at DATE NOT NULL,
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

-- Индексы
CREATE INDEX idx_instagram_posts_stats_project_id ON public.instagram_posts_stats(project_id);
CREATE INDEX idx_instagram_posts_stats_posted_at ON public.instagram_posts_stats(posted_at);
CREATE INDEX idx_instagram_posts_stats_post_id ON public.instagram_posts_stats(post_id);

-- RLS
ALTER TABLE public.instagram_posts_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations" ON public.instagram_posts_stats FOR ALL USING (true);

-- Также создадим content_production_stats если её нет
CREATE TABLE IF NOT EXISTS public.content_production_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  publications INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  followers INTEGER DEFAULT 0,
  diagnostics INTEGER DEFAULT 0,
  sales INTEGER DEFAULT 0,
  revenue INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(project_id, period_start, period_end)
);

-- RLS для content_production_stats
ALTER TABLE public.content_production_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all operations" ON public.content_production_stats FOR ALL USING (true);
