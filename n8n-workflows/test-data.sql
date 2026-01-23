-- Test Data & Validation Queries for Facebook Sync
-- Use these queries to test your workflow

-- ============================================
-- 1. CHECK TABLE STRUCTURE
-- ============================================

-- Check if all required columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'marketing_stats'
ORDER BY ordinal_position;

-- Expected columns:
-- id, project_id, date, spend, impressions, clicks, 
-- reach, ctr, cpc, cpm, source, created_at, updated_at


-- ============================================
-- 2. INSERT TEST DATA (optional)
-- ============================================

-- Insert sample data for testing
INSERT INTO marketing_stats (
    project_id, 
    date, 
    spend, 
    impressions, 
    clicks, 
    reach, 
    ctr, 
    cpc, 
    cpm, 
    source
) VALUES 
(
    '64c94e87-630c-470e-8ab1-8f7c8c835efa',
    CURRENT_DATE - 1,
    150.50,
    25000,
    450,
    18000,
    1.8,
    0.33,
    6.02,
    'facebook_ads'
),
(
    '64c94e87-630c-470e-8ab1-8f7c8c835efa',
    CURRENT_DATE - 2,
    200.75,
    32000,
    580,
    24000,
    1.81,
    0.35,
    6.27,
    'facebook_ads'
)
ON CONFLICT DO NOTHING;


-- ============================================
-- 3. VALIDATION QUERIES
-- ============================================

-- Check today's data (should appear after workflow runs)
SELECT 
    id,
    project_id,
    date,
    spend,
    impressions,
    clicks,
    reach,
    ctr,
    cpc,
    cpm,
    source,
    created_at,
    updated_at,
    -- Calculate time since last update
    EXTRACT(EPOCH FROM (NOW() - updated_at))/3600 as hours_since_update
FROM marketing_stats
WHERE date = CURRENT_DATE 
    AND source = 'facebook_ads'
ORDER BY updated_at DESC;


-- Last 7 days of data
SELECT 
    date,
    spend,
    impressions,
    clicks,
    reach,
    ROUND(ctr, 2) as ctr,
    ROUND(cpc, 2) as cpc,
    ROUND(cpm, 2) as cpm,
    TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') as last_updated
FROM marketing_stats
WHERE source = 'facebook_ads'
    AND date >= CURRENT_DATE - 7
ORDER BY date DESC;


-- ============================================
-- 4. CHECK SYNC HEALTH
-- ============================================

-- Use the helper function
SELECT * FROM check_facebook_sync_health('64c94e87-630c-470e-8ab1-8f7c8c835efa');

-- Expected output:
-- last_sync_date | hours_since_update | is_stale | total_spend_7d | total_impressions_7d
-- 2026-01-23     | 0.5                | false    | 1500.00        | 250000


-- ============================================
-- 5. AGGREGATED STATS
-- ============================================

-- Weekly summary
SELECT 
    DATE_TRUNC('week', date) as week,
    COUNT(*) as days_with_data,
    SUM(spend) as total_spend,
    SUM(impressions) as total_impressions,
    SUM(clicks) as total_clicks,
    AVG(ctr) as avg_ctr,
    AVG(cpc) as avg_cpc,
    AVG(cpm) as avg_cpm,
    SUM(spend) / NULLIF(SUM(clicks), 0) as effective_cpc
FROM marketing_stats
WHERE source = 'facebook_ads'
    AND date >= CURRENT_DATE - 30
GROUP BY DATE_TRUNC('week', date)
ORDER BY week DESC;


-- ============================================
-- 6. DETECT ANOMALIES
-- ============================================

-- Find days with unusually high spend
WITH daily_stats AS (
    SELECT 
        date,
        spend,
        AVG(spend) OVER (ORDER BY date ROWS BETWEEN 7 PRECEDING AND 1 PRECEDING) as avg_spend_7d,
        STDDEV(spend) OVER (ORDER BY date ROWS BETWEEN 7 PRECEDING AND 1 PRECEDING) as stddev_spend_7d
    FROM marketing_stats
    WHERE source = 'facebook_ads'
        AND date >= CURRENT_DATE - 30
)
SELECT 
    date,
    spend,
    ROUND(avg_spend_7d, 2) as avg_spend_7d,
    CASE 
        WHEN spend > avg_spend_7d + (2 * stddev_spend_7d) THEN '🔴 HIGH'
        WHEN spend < avg_spend_7d - (2 * stddev_spend_7d) THEN '🟡 LOW'
        ELSE '✅ NORMAL'
    END as anomaly_status
FROM daily_stats
WHERE stddev_spend_7d IS NOT NULL
ORDER BY date DESC;


-- ============================================
-- 7. CHECK FOR DUPLICATES
-- ============================================

-- Should return 0 rows (no duplicates)
SELECT 
    project_id, 
    date, 
    source,
    COUNT(*) as duplicate_count
FROM marketing_stats
WHERE source = 'facebook_ads'
GROUP BY project_id, date, source
HAVING COUNT(*) > 1;


-- ============================================
-- 8. PERFORMANCE CHECK
-- ============================================

-- Check if indexes are being used
EXPLAIN ANALYZE
SELECT * FROM marketing_stats
WHERE source = 'facebook_ads'
    AND date = CURRENT_DATE
    AND project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa';

-- Should show "Index Scan" for good performance


-- ============================================
-- 9. DATA QUALITY CHECKS
-- ============================================

-- Find records with suspicious data
SELECT 
    date,
    spend,
    impressions,
    clicks,
    reach,
    ctr,
    CASE 
        WHEN spend < 0 THEN '❌ Negative spend'
        WHEN clicks > impressions THEN '❌ Clicks > Impressions'
        WHEN reach > impressions THEN '⚠️ Reach > Impressions (possible)'
        WHEN ctr > 100 THEN '❌ CTR > 100%'
        WHEN spend > 0 AND impressions = 0 THEN '⚠️ Spend but no impressions'
        ELSE '✅ OK'
    END as quality_check
FROM marketing_stats
WHERE source = 'facebook_ads'
    AND date >= CURRENT_DATE - 7
ORDER BY date DESC;


-- ============================================
-- 10. CLEANUP OLD TEST DATA (optional)
-- ============================================

-- Delete test data older than 90 days
-- UNCOMMENT TO RUN:
-- DELETE FROM marketing_stats
-- WHERE source = 'facebook_ads'
--     AND date < CURRENT_DATE - 90;


-- ============================================
-- 11. VIEW USAGE EXAMPLE
-- ============================================

-- Use the convenient view
SELECT 
    date,
    spend,
    impressions,
    clicks,
    calculated_ctr,
    calculated_cpc,
    calculated_cpm
FROM facebook_stats_daily
WHERE date >= CURRENT_DATE - 7
ORDER BY date DESC;


-- ============================================
-- 12. REAL-TIME MONITORING QUERY
-- ============================================

-- Run this every hour to monitor sync
SELECT 
    'Facebook Sync Status' as check_name,
    CASE 
        WHEN MAX(date) = CURRENT_DATE THEN '✅ Up to date'
        WHEN MAX(date) = CURRENT_DATE - 1 THEN '⚠️ Yesterday data'
        ELSE '🔴 Outdated'
    END as status,
    MAX(date) as last_data_date,
    MAX(updated_at) as last_sync_time,
    COUNT(DISTINCT date) as days_with_data,
    SUM(spend) as total_spend,
    SUM(clicks) as total_clicks
FROM marketing_stats
WHERE source = 'facebook_ads'
    AND date >= CURRENT_DATE - 7;


-- ============================================
-- 13. EXPECTED N8N WORKFLOW BEHAVIOR
-- ============================================

/*
FIRST RUN (no data for today):
1. Check If Exists → returns 0 rows
2. Merge Data → exists: false, recordId: null
3. If Record Exists → goes to FALSE branch
4. Create Record → inserts new row
5. Result: 1 new record in database

SECOND RUN (data exists for today):
1. Check If Exists → returns 1 row with ID
2. Merge Data → exists: true, recordId: "uuid-here"
3. If Record Exists → goes to TRUE branch
4. Update Record → updates existing row
5. Result: same record updated, updated_at changed

ERROR CASE (no data from Facebook):
1. Transform Data → returns { skip: true }
2. Check If Data Valid → goes to FALSE branch
3. Error Handler → logs error
4. Workflow ends gracefully
*/


-- ============================================
-- 14. TROUBLESHOOTING QUERIES
-- ============================================

-- If workflow runs but no data appears, check RLS policies:
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'marketing_stats';

-- Check table permissions:
SELECT 
    grantee, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'marketing_stats';
