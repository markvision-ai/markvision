-- SQL запрос для отчета за Январь 2026 (MarkVision AI)

-- 1. Общая статистика
SELECT 
  count(*) as total_posts,
  sum(reach) as total_reach,
  sum(comments_count) as total_comments,
  sum(likes_count) as total_likes,
  -- Engagement Rate = (Interactions / Reach) * 100
  CASE 
    WHEN sum(reach) > 0 THEN 
      ((sum(comments_count) + sum(likes_count))::float / sum(reach)::float) * 100 
    ELSE 0 
  END as avg_er
FROM instagram_content_stats
WHERE 
  project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa'
  AND published_at >= '2026-01-01'
  AND published_at <= '2026-01-31';

-- 2. Топ 3 публикации по охвату
SELECT 
  caption,
  reach,
  comments_count,
  likes_count,
  published_at,
  permalink
FROM instagram_content_stats
WHERE 
  project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa'
  AND published_at >= '2026-01-01'
  AND published_at <= '2026-01-31'
ORDER BY reach DESC
LIMIT 3;

-- 3. Динамика по дням (для графика)
SELECT 
  date_trunc('day', published_at) as day,
  count(*) as posts_count,
  sum(reach) as daily_reach
FROM instagram_content_stats
WHERE 
  project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa'
  AND published_at >= '2026-01-01'
  AND published_at <= '2026-01-31'
GROUP BY 1
ORDER BY 1;
