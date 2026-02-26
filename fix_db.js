import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import * as dotenv from 'dotenv';

const envConfig = dotenv.parse(fs.readFileSync('.env'))

const supabase = createClient(
    envConfig.VITE_SUPABASE_URL,
    envConfig.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function runSQL() {
    const rawSql = `
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients_config' AND column_name = 'fb_ad_account_id') THEN
        ALTER TABLE public.clients_config RENAME COLUMN fb_ad_account_id TO ad_account_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients_config' AND column_name = 'access_token') THEN
        ALTER TABLE public.clients_config RENAME COLUMN access_token TO fb_token;
    END IF;
END $$;

ALTER TABLE public.clients_config DROP CONSTRAINT IF EXISTS clients_config_fb_ad_account_id_key;
ALTER TABLE public.clients_config DROP CONSTRAINT IF EXISTS clients_config_ad_account_id_key;
ALTER TABLE public.clients_config ADD CONSTRAINT clients_config_ad_account_id_key UNIQUE (ad_account_id);

CREATE OR REPLACE VIEW public.agency_metrics_view AS
WITH crm_metrics AS (
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
    COALESCE(cc.spend, 0) AS spend,
    COALESCE(cc.meta_leads, 0) AS meta_leads,
    COALESCE(crm.crm_leads, 0) AS crm_leads,
    COALESCE(crm.qualified_leads, 0) AS qualified_leads,
    COALESCE(crm.visits, 0) AS visits,
    COALESCE(crm.sales, 0) AS sales,
    COALESCE(crm.total_revenue, 0) AS revenue,
    
    CASE WHEN COALESCE(cc.meta_leads, 0) > 0 THEN COALESCE(cc.spend, 0) / cc.meta_leads ELSE 0 END AS cpl,
    CASE WHEN COALESCE(crm.qualified_leads, 0) > 0 THEN COALESCE(cc.spend, 0) / crm.qualified_leads ELSE 0 END AS cpql,
    CASE WHEN COALESCE(crm.visits, 0) > 0 THEN COALESCE(cc.spend, 0) / crm.visits ELSE 0 END AS cpv,
    CASE WHEN COALESCE(crm.sales, 0) > 0 THEN COALESCE(cc.spend, 0) / crm.sales ELSE 0 END AS cac,
    CASE WHEN COALESCE(cc.spend, 0) > 0 THEN ((COALESCE(crm.total_revenue, 0) - COALESCE(cc.spend, 0)) / COALESCE(cc.spend, 0)) * 100 ELSE 0 END AS romi
FROM 
    public.clients_config cc
LEFT JOIN 
    crm_metrics crm ON cc.ad_account_id = crm.fb_ad_account_id;
    `;
    
    // Supabase JS doesn't have a direct raw SQL execution method via the client unless exposed via an RPC. 
    // We will simulate it by calling an RPC if one exists, but usually we just print it.
    console.log("SQL to execute manually in Supabase SQL Editor:");
    console.log(rawSql);
}
runSQL();
