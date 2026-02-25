-- Создаем SQL View для агрегации метрик "на лету" из clients_config и leads
CREATE OR REPLACE VIEW public.agency_metrics_view AS
WITH crm_metrics AS (
    SELECT 
        fb_ad_account_id,
        COUNT(id) AS crm_leads,
        -- Квалифицированные лиды (статусы: qualified, visit, paid и т.д.)
        COUNT(id) FILTER (WHERE lower(status) IN ('qualified', 'hot', 'warm', 'квалифицирован', 'визит', 'оплатил', 'visit', 'show_up', 'paid', 'success')) AS qualified_leads,
        -- Визиты
        COUNT(id) FILTER (WHERE lower(status) IN ('visit', 'show_up', 'визит', 'оплатил', 'paid', 'success')) AS visits,
        -- Продажи
        COUNT(id) FILTER (WHERE lower(status) IN ('paid', 'success', 'оплатил')) AS sales,
        -- Общая выручка по кабинету
        COALESCE(SUM(revenue), 0) AS total_revenue
    FROM public.leads
    GROUP BY fb_ad_account_id
)
SELECT 
    cc.id,
    cc.project_id,
    cc.fb_ad_account_id AS account_id,
    COALESCE(cc.client_name, 'Неизвестный кабинет') AS account_name,
    COALESCE(cc.spend, 0) AS spend,
    COALESCE(cc.meta_leads, 0) AS meta_leads,
    COALESCE(crm.crm_leads, 0) AS crm_leads,
    COALESCE(crm.qualified_leads, 0) AS qualified_leads,
    COALESCE(crm.visits, 0) AS visits,
    COALESCE(crm.sales, 0) AS sales,
    COALESCE(crm.total_revenue, 0) AS revenue,
    
    -- Формулы прямо в SQL (с обработкой деления на 0)
    CASE WHEN COALESCE(cc.meta_leads, 0) > 0 THEN COALESCE(cc.spend, 0) / cc.meta_leads ELSE 0 END AS cpl,
    CASE WHEN COALESCE(crm.qualified_leads, 0) > 0 THEN COALESCE(cc.spend, 0) / crm.qualified_leads ELSE 0 END AS cpql,
    CASE WHEN COALESCE(crm.visits, 0) > 0 THEN COALESCE(cc.spend, 0) / crm.visits ELSE 0 END AS cpv,
    CASE WHEN COALESCE(crm.sales, 0) > 0 THEN COALESCE(cc.spend, 0) / crm.sales ELSE 0 END AS cac,
    CASE WHEN COALESCE(cc.spend, 0) > 0 THEN ((COALESCE(crm.total_revenue, 0) - COALESCE(cc.spend, 0)) / COALESCE(cc.spend, 0)) * 100 ELSE 0 END AS romi
FROM 
    public.clients_config cc
LEFT JOIN 
    crm_metrics crm ON cc.fb_ad_account_id = crm.fb_ad_account_id;
