-- Add super_admin to the app_role enum if not exists
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';