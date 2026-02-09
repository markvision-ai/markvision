-- SQL query for January 2026 report (MarkVision AI)
--
-- Replace `:project_id` with an actual project UUID before running.
-- Example:
--   project_id = '00000000-0000-0000-0000-000000000000'

-- 1. Overall stats
SELECT
  count(*) as total_posts,
  sum(reach) as total_reach,
  sum(comments_count) as total_comments,
  sum(likes_count) as total_likes,
  CASE
    WHEN sum(reach) > 0 THEN
      ((sum(comments_count) + sum(likes_count))::float / sum(reach)::float) * 100
    ELSE 0
  END as avg_er
FROM instagram_content_stats
WHERE
  project_id = :project_id
  AND published_at >= '2026-01-01'
  AND published_at <= '2026-01-31';

-- 2. Top 3 posts by reach
SELECT
  caption,
  reach,
  comments_count,
  likes_count,
  published_at,
  permalink
FROM instagram_content_stats
WHERE
  project_id = :project_id
  AND published_at >= '2026-01-01'
  AND published_at <= '2026-01-31'
ORDER BY reach DESC
LIMIT 3;

-- 3. Daily dynamics
SELECT
  date_trunc('day', published_at) as day,
  count(*) as posts_count,
  sum(reach) as daily_reach
FROM instagram_content_stats
WHERE
  project_id = :project_id
  AND published_at >= '2026-01-01'
  AND published_at <= '2026-01-31'
GROUP BY 1
ORDER BY 1;
