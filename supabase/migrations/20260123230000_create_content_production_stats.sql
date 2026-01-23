-- =====================================================
-- Content Production Stats Table
-- =====================================================
-- Таблица для хранения агрегированных метрик контент-производства
-- за определенные периоды

CREATE TABLE IF NOT EXISTS public.content_production_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Метрики контента
  publications INTEGER DEFAULT 0,  -- Публикации (все кроме Stories)
  stories INTEGER DEFAULT 0,      -- Сторис
  reach INTEGER DEFAULT 0,          -- Охват
  engagement DECIMAL(10, 2) DEFAULT 0,  -- Вовлеченность (%)
  followers INTEGER DEFAULT 0,     -- Новые подписчики
  
  -- Бизнес-метрики
  diagnostics INTEGER DEFAULT 0,  -- Диагностики
  sales INTEGER DEFAULT 0,         -- Продажи
  revenue INTEGER DEFAULT 0,       -- Сумма продаж (в тенге, без копеек)
  
  -- Служебные поля
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Уникальный индекс: один период на проект
  UNIQUE(project_id, period_start, period_end)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_content_production_stats_project ON public.content_production_stats(project_id);
CREATE INDEX IF NOT EXISTS idx_content_production_stats_period ON public.content_production_stats(period_start, period_end DESC);

-- RLS
ALTER TABLE public.content_production_stats ENABLE ROW LEVEL SECURITY;

-- Политики
CREATE POLICY "Enable read access for all users" ON public.content_production_stats
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.content_production_stats
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only" ON public.content_production_stats
  FOR UPDATE USING (true);

-- Комментарии
COMMENT ON TABLE public.content_production_stats IS 'Агрегированные метрики контент-производства за периоды';
COMMENT ON COLUMN public.content_production_stats.publications IS 'Количество публикаций (все кроме Stories)';
COMMENT ON COLUMN public.content_production_stats.stories IS 'Количество Stories';
COMMENT ON COLUMN public.content_production_stats.reach IS 'Общий охват';
COMMENT ON COLUMN public.content_production_stats.engagement IS 'Вовлеченность в процентах';
COMMENT ON COLUMN public.content_production_stats.revenue IS 'Сумма продаж в тенге (без копеек)';
