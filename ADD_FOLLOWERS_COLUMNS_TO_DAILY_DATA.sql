-- Добавление колонок для Instagram подписчиков в таблицу daily_data
-- Выполнить этот SQL в Supabase для исправления ошибки "Could not find the 'followers_today' column"

ALTER TABLE public.daily_data
ADD COLUMN IF NOT EXISTS followers_today INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS followers_yesterday INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS new_followers INTEGER DEFAULT 0;

-- Обновление updated_at триггера для новой колонки
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Создание индексов для новых колонок (опционально, для производительности)
CREATE INDEX IF NOT EXISTS idx_daily_data_followers_today ON public.daily_data(followers_today);
CREATE INDEX IF NOT EXISTS idx_daily_data_new_followers ON public.daily_data(new_followers);

-- Проверка структуры таблицы
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'daily_data' AND table_schema = 'public'
ORDER BY ordinal_position;