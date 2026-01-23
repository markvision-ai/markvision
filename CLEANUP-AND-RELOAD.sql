-- ========================================
-- 🗑️ ОЧИСТКА ДАННЫХ И ПОВТОРНАЯ ЗАГРУЗКА
-- ========================================

-- ШАГ 1: Удаляем ВСЕ данные за январь 2026
-- ========================================

-- Удаляем из daily_data
DELETE FROM daily_data
WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa'
AND date >= '2026-01-01' 
AND date < '2026-02-01';

-- Удаляем из marketing_stats (опционально)
DELETE FROM marketing_stats
WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa'
AND date >= '2026-01-01'
AND date < '2026-02-01';

-- Проверка: должно быть 0
SELECT 
  COUNT(*) as daily_data_count
FROM daily_data
WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa'
AND date >= '2026-01-01';

SELECT 
  COUNT(*) as marketing_stats_count
FROM marketing_stats
WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa'
AND date >= '2026-01-01';


-- ========================================
-- ШАГ 2: Загрузка через n8n (ВАРИАНТ 1)
-- ========================================

/*
1. Открой n8n
2. Импортируй workflow: ULTRA-SIMPLE-facebook.json
   (он загрузит ВСЕ данные за январь сразу)
3. Execute Workflow вручную
4. Проверь результат ниже
*/


-- ========================================
-- ШАГ 3: Проверка после загрузки
-- ========================================

-- Должно быть ~20-23 записи (дни января с данными)
SELECT 
  date,
  spend,
  impressions,
  clicks,
  leads
FROM daily_data
WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa'
AND date >= '2026-01-01'
ORDER BY date;

-- Итоги за январь
SELECT 
  COUNT(*) as days,
  SUM(spend)::numeric(10,2) as total_spend,
  SUM(impressions) as total_impressions,
  SUM(clicks) as total_clicks,
  SUM(leads) as total_leads,
  CASE 
    WHEN SUM(leads) > 0 THEN ROUND(SUM(spend) / SUM(leads), 2)
    ELSE 0 
  END as cpl,
  CASE 
    WHEN SUM(clicks) > 0 THEN ROUND(SUM(spend) / SUM(clicks), 2)
    ELSE 0 
  END as cpc
FROM daily_data
WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa'
AND date >= '2026-01-01';


-- ========================================
-- ШАГ 4: Если нужно вручную загрузить из marketing_stats
-- ========================================

-- Копируем данные из marketing_stats в daily_data
-- С конвертацией валюты (если в marketing_stats уже в ₸)
INSERT INTO daily_data (
  project_id,
  date,
  spend,
  impressions,
  clicks,
  leads,
  diagnostics,
  sales,
  revenue
)
SELECT 
  project_id,
  date,
  spend,  -- Если уже в ₸, оставляем как есть
  impressions,
  clicks,
  COALESCE(leads, 0) + COALESCE(conversations, 0) as leads,
  0,
  0,
  0
FROM marketing_stats
WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa'
AND date >= '2026-01-01'
ON CONFLICT (project_id, date) 
DO UPDATE SET 
  spend = EXCLUDED.spend,
  impressions = EXCLUDED.impressions,
  clicks = EXCLUDED.clicks,
  leads = EXCLUDED.leads,
  updated_at = NOW();


-- ========================================
-- 🔄 ШАГ 5: Автоматическая синхронизация (настройка)
-- ========================================

/*
После очистки и загрузки настрой автоматическую синхронизацию:

1. Открой n8n
2. Импортируй workflow: DAILY-AUTO-SYNC-01AM.json
3. Activate (переключатель вверху)
4. Готово! Каждый день в 01:00 будут загружаться данные за вчера

Workflow автоматически:
- ✅ Получает курс НБК за вчерашний день
- ✅ Загружает данные Facebook за вчера
- ✅ Конвертирует $ → ₸
- ✅ Объединяет leads + conversations
- ✅ Сохраняет в daily_data
*/


-- ========================================
-- 📊 ПОЛЕЗНЫЕ ЗАПРОСЫ
-- ========================================

-- Сравнение по дням (топ 10 по расходам)
SELECT 
  date,
  TO_CHAR(date, 'Dy') as day_of_week,
  spend,
  impressions,
  clicks,
  leads,
  CASE 
    WHEN leads > 0 THEN ROUND(spend / leads, 2)
    ELSE 0 
  END as cpl
FROM daily_data
WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa'
AND date >= '2026-01-01'
ORDER BY spend DESC
LIMIT 10;

-- Средние показатели
SELECT 
  ROUND(AVG(spend), 2) as avg_spend_per_day,
  ROUND(AVG(impressions), 0) as avg_impressions_per_day,
  ROUND(AVG(clicks), 0) as avg_clicks_per_day,
  ROUND(AVG(leads), 1) as avg_leads_per_day,
  ROUND(AVG(CASE WHEN leads > 0 THEN spend / leads ELSE 0 END), 2) as avg_cpl
FROM daily_data
WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa'
AND date >= '2026-01-01'
AND leads > 0;

-- Тренд по неделям
SELECT 
  DATE_TRUNC('week', date) as week,
  SUM(spend)::numeric(10,2) as weekly_spend,
  SUM(leads) as weekly_leads,
  CASE 
    WHEN SUM(leads) > 0 THEN ROUND(SUM(spend) / SUM(leads), 2)
    ELSE 0 
  END as weekly_cpl
FROM daily_data
WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa'
AND date >= '2026-01-01'
GROUP BY DATE_TRUNC('week', date)
ORDER BY week;
