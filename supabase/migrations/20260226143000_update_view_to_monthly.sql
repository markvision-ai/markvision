-- Update agency_metrics_view to support monthly filtering
DROP VIEW IF EXISTS public.agency_metrics_view;

CREATE VIEW public.agency_metrics_view AS
WITH monthly_ads AS (
    SELECT 
        ad_account_id,
        date_trunc('month', date) AS month_start,
        SUM(spend) AS spend,
        SUM(meta_leads) AS meta_leads
    FROM public.daily_ad_metrics
    GROUP BY ad_account_id, date_trunc('month', date)
),
crm_metrics AS (
    SELECT 
        fb_ad_account_id,
        date_trunc('month', created_at) AS month_start,
        COUNT(id) AS crm_leads,
        COUNT(id) FILTER (WHERE lower(status) IN ('qualified', 'hot', 'warm', 'квалифицирован', 'визит', 'оплатил', 'visit', 'show_up', 'paid', 'success')) AS qualified_leads,
        COUNT(id) FILTER (WHERE lower(status) IN ('visit', 'show_up', 'визит', 'оплатил', 'paid', 'success')) AS visits,
        COUNT(id) FILTER (WHERE lower(status) IN ('paid', 'success', 'оплатил')) AS sales,
        COALESCE(SUM(revenue), 0) AS total_revenue
    FROM public.leads
    GROUP BY fb_ad_account_id, date_trunc('month', created_at)
),
combined_metrics AS (
    SELECT 
        COALESCE(ma.ad_account_id, crm.fb_ad_account_id) AS ad_account_id,
        COALESCE(ma.month_start, crm.month_start) AS month_start,
        COALESCE(ma.spend, 0) AS spend,
        COALESCE(ma.meta_leads, 0) AS meta_leads,
        COALESCE(crm.crm_leads, 0) AS crm_leads,
        COALESCE(crm.qualified_leads, 0) AS qualified_leads,
        COALESCE(crm.visits, 0) AS visits,
        COALESCE(crm.sales, 0) AS sales,
        COALESCE(crm.total_revenue, 0) AS revenue
    FROM monthly_ads ma
    FULL OUTER JOIN crm_metrics crm 
        ON ma.ad_account_id = crm.fb_ad_account_id 
        AND ma.month_start = crm.month_start
)
SELECT 
    cc.id,
    cc.project_id,
    cc.ad_account_id AS account_id,
    COALESCE(cc.client_name, 'Неизвестный кабинет') AS account_name,
    cm.month_start,
    cm.spend,
    cm.meta_leads,
    cm.crm_leads,
    cm.qualified_leads,
    cm.visits,
    cm.sales,
    cm.revenue,
    CASE WHEN cm.meta_leads > 0 THEN cm.spend / cm.meta_leads ELSE 0 END AS cpl,
    CASE WHEN cm.qualified_leads > 0 THEN cm.spend / cm.qualified_leads ELSE 0 END AS cpql,
    CASE WHEN cm.visits > 0 THEN cm.spend / cm.visits ELSE 0 END AS cpv,
    CASE WHEN cm.sales > 0 THEN cm.spend / cm.sales ELSE 0 END AS cac,
    CASE WHEN cm.spend > 0 THEN ((cm.revenue - cm.spend) / cm.spend) * 100 ELSE 0 END AS romi
FROM 
    public.clients_config cc
JOIN 
    combined_metrics cm ON cc.ad_account_id = cm.ad_account_id;
