-- Drop ineffective RESTRICTIVE policies that use USING (false)
-- These are redundant since other policies already require authentication via has_project_access() which uses auth.uid()

DROP POLICY IF EXISTS "Deny anonymous access to webhook_logs" ON public.webhook_logs;
DROP POLICY IF EXISTS "Deny anonymous access to visits" ON public.visits;
DROP POLICY IF EXISTS "Deny anonymous access to touchpoints" ON public.touchpoints;
DROP POLICY IF EXISTS "Deny anonymous access to attribution_results" ON public.attribution_results;
DROP POLICY IF EXISTS "Deny anonymous access to custom_attribution_settings" ON public.custom_attribution_settings;
DROP POLICY IF EXISTS "Deny anonymous access to webhook_configs" ON public.webhook_configs;
DROP POLICY IF EXISTS "Deny anonymous access to report_templates" ON public.report_templates;
DROP POLICY IF EXISTS "Deny anonymous access to user_permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Deny anonymous access to projects" ON public.projects;
DROP POLICY IF EXISTS "Deny anonymous access to user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Deny anonymous access to project_access" ON public.project_access;
DROP POLICY IF EXISTS "Deny anonymous access to plan_data" ON public.plan_data;
DROP POLICY IF EXISTS "Deny anonymous access to daily_data" ON public.daily_data;