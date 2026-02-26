-- Create the daily metrics table
CREATE TABLE IF NOT EXISTS public.daily_ad_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_account_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    spend NUMERIC DEFAULT 0,
    meta_leads INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ad_account_id, date)
);

-- Enable RLS and setup permissive policy for Edge Function/Service Role insert
ALTER TABLE public.daily_ad_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.daily_ad_metrics FOR SELECT USING (true);
CREATE POLICY "Enable insert/update for service role" ON public.daily_ad_metrics FOR ALL USING (true) WITH CHECK (true);

-- Update the view to aggregate only current month's data from daily_ad_metrics
DROP VIEW IF EXISTS public.agency_metrics_view;
CREATE VIEW public.agency_metrics_view AS
WITH current_month_ads AS (
    SELECT 
        ad_account_id,
        SUM(spend) AS spend,
        SUM(meta_leads) AS meta_leads
    FROM public.daily_ad_metrics
    WHERE date >= date_trunc('month', CURRENT_DATE)
    GROUP BY ad_account_id
),
crm_metrics AS (
    SELECT 
        fb_ad_account_id,
        COUNT(id) AS crm_leads,
        COUNT(id) FILTER (WHERE lower(status) IN ('qualified', 'hot', 'warm', 'квалифицирован', 'визит', 'оплатил', 'visit', 'show_up', 'paid', 'success')) AS qualified_leads,
        COUNT(id) FILTER (WHERE lower(status) IN ('visit', 'show_up', 'визит', 'оплатил', 'paid', 'success')) AS visits,
        COUNT(id) FILTER (WHERE lower(status) IN ('paid', 'success', 'оплатил')) AS sales,
        COALESCE(SUM(revenue), 0) AS total_revenue
    FROM public.leads
    GROUP BY fb_ad_account_id
)
SELECT 
    cc.id,
    cc.project_id,
    cc.ad_account_id AS account_id,
    COALESCE(cc.client_name, 'Неизвестный кабинет') AS account_name,
    COALESCE(cma.spend, 0) AS spend,
    COALESCE(cma.meta_leads, 0) AS meta_leads,
    COALESCE(crm.crm_leads, 0) AS crm_leads,
    COALESCE(crm.qualified_leads, 0) AS qualified_leads,
    COALESCE(crm.visits, 0) AS visits,
    COALESCE(crm.sales, 0) AS sales,
    COALESCE(crm.total_revenue, 0) AS revenue,
    CASE WHEN COALESCE(cma.meta_leads, 0) > 0 THEN COALESCE(cma.spend, 0) / cma.meta_leads ELSE 0 END AS cpl,
    CASE WHEN COALESCE(crm.qualified_leads, 0) > 0 THEN COALESCE(cma.spend, 0) / crm.qualified_leads ELSE 0 END AS cpql,
    CASE WHEN COALESCE(crm.visits, 0) > 0 THEN COALESCE(cma.spend, 0) / crm.visits ELSE 0 END AS cpv,
    CASE WHEN COALESCE(crm.sales, 0) > 0 THEN COALESCE(cma.spend, 0) / crm.sales ELSE 0 END AS cac,
    CASE WHEN COALESCE(cma.spend, 0) > 0 THEN ((COALESCE(crm.total_revenue, 0) - COALESCE(cma.spend, 0)) / COALESCE(cma.spend, 0)) * 100 ELSE 0 END AS romi
FROM 
    public.clients_config cc
LEFT JOIN 
    current_month_ads cma ON cc.ad_account_id = cma.ad_account_id
LEFT JOIN 
    crm_metrics crm ON cc.ad_account_id = crm.fb_ad_account_id;
