-- Расширение таблицы ab_tests для полноценного A/B тестирования
-- Включает: типы тестов, Facebook Ads интеграцию, метрики, автоматизацию

-- Добавляем новые колонки
ALTER TABLE ab_tests
ADD COLUMN IF NOT EXISTS test_category VARCHAR(50) DEFAULT 'page',
ADD COLUMN IF NOT EXISTS description TEXT,

-- Facebook Ads интеграция
ADD COLUMN IF NOT EXISTS facebook_account_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS facebook_campaign_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS facebook_ad_ids JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS facebook_adset_ids JSONB DEFAULT '[]'::jsonb,

-- Варианты (расширенные)
ADD COLUMN IF NOT EXISTS variant_a_name VARCHAR(255) DEFAULT 'Control',
ADD COLUMN IF NOT EXISTS variant_b_name VARCHAR(255) DEFAULT 'Variant B',
ADD COLUMN IF NOT EXISTS variant_a_title TEXT,
ADD COLUMN IF NOT EXISTS variant_b_title TEXT,
ADD COLUMN IF NOT EXISTS variant_a_text TEXT,
ADD COLUMN IF NOT EXISTS variant_b_text TEXT,

-- Метрики посетителей и конверсий
ADD COLUMN IF NOT EXISTS variant_a_visitors INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS variant_b_visitors INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS variant_a_conversions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS variant_b_conversions INTEGER DEFAULT 0,

-- Facebook Ads метрики
ADD COLUMN IF NOT EXISTS variant_a_spend DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS variant_b_spend DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS variant_a_leads INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS variant_b_leads INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS variant_a_impressions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS variant_b_impressions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS variant_a_clicks INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS variant_b_clicks INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS variant_a_cpl DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS variant_b_cpl DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS variant_a_ctr DECIMAL(6,4),
ADD COLUMN IF NOT EXISTS variant_b_ctr DECIMAL(6,4),

-- Статистика и автоматизация
ADD COLUMN IF NOT EXISTS confidence_level DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_sample_size INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS min_days INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS auto_winner_threshold DECIMAL(5,2) DEFAULT 95,

-- Результаты
ADD COLUMN IF NOT EXISTS winner VARCHAR(10), -- 'a', 'b', или NULL
ADD COLUMN IF NOT EXISTS winner_reason TEXT,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP WITH TIME ZONE,

-- AI рекомендации
ADD COLUMN IF NOT EXISTS ai_recommendation TEXT,
ADD COLUMN IF NOT EXISTS ai_updated_at TIMESTAMP WITH TIME ZONE,

-- Страница для тестов типа 'page'
ADD COLUMN IF NOT EXISTS page_path VARCHAR(255);

-- Добавляем комментарии к колонкам
COMMENT ON COLUMN ab_tests.test_category IS 'Тип теста: page, creative, copy, audience';
COMMENT ON COLUMN ab_tests.confidence_level IS 'Статистическая значимость 0-100%';
COMMENT ON COLUMN ab_tests.auto_winner_threshold IS 'Порог confidence для авто-определения победителя';
COMMENT ON COLUMN ab_tests.facebook_ad_ids IS 'JSON массив ID объявлений [variant_a_id, variant_b_id]';

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_ab_tests_project_status ON ab_tests(project_id, status);
CREATE INDEX IF NOT EXISTS idx_ab_tests_category ON ab_tests(test_category);
CREATE INDEX IF NOT EXISTS idx_ab_tests_running ON ab_tests(status) WHERE status = 'running';

-- Enum для статусов (если не существует)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ab_test_status') THEN
    CREATE TYPE ab_test_status AS ENUM ('draft', 'running', 'paused', 'completed');
  END IF;
END $$;

-- Проверка что всё создалось
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'ab_tests'
ORDER BY ordinal_position;
