-- Добавляем колонки для лидов и переписок
ALTER TABLE marketing_stats
ADD COLUMN IF NOT EXISTS leads INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS conversations INTEGER DEFAULT 0;

-- Создаем индексы для быстрых запросов
CREATE INDEX IF NOT EXISTS idx_marketing_stats_leads 
ON marketing_stats(project_id, date, leads) 
WHERE leads > 0;

CREATE INDEX IF NOT EXISTS idx_marketing_stats_conversations 
ON marketing_stats(project_id, date, conversations) 
WHERE conversations > 0;

-- Обновляем представление для дашборда
CREATE OR REPLACE VIEW marketing_stats_summary AS
SELECT 
  project_id,
  date,
  source,
  SUM(spend) as total_spend,
  SUM(impressions) as total_impressions,
  SUM(clicks) as total_clicks,
  SUM(reach) as total_reach,
  SUM(leads) as total_leads,
  SUM(conversations) as total_conversations,
  CASE 
    WHEN SUM(impressions) > 0 THEN (SUM(clicks)::float / SUM(impressions)::float * 100)
    ELSE 0 
  END as ctr,
  CASE 
    WHEN SUM(clicks) > 0 THEN (SUM(spend) / SUM(clicks))
    ELSE 0 
  END as cpc,
  CASE 
    WHEN SUM(leads) > 0 THEN (SUM(spend) / SUM(leads))
    ELSE 0 
  END as cpl,
  CASE 
    WHEN SUM(conversations) > 0 THEN (SUM(spend) / SUM(conversations))
    ELSE 0 
  END as cpc_conversation
FROM marketing_stats
GROUP BY project_id, date, source;

-- Комментарии для документации
COMMENT ON COLUMN marketing_stats.leads IS 'Количество лидов (форм, заявок) - action_type: lead, leadgen_grouped';
COMMENT ON COLUMN marketing_stats.conversations IS 'Количество начатых переписок - action_type: messaging_conversation_started_7d';
