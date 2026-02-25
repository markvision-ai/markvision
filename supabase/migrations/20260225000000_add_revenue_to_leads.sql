-- Migration: Add revenue column to leads table
-- Enables accurate ROMI and CAC calculations for the Agency Accounts Analytics module

ALTER TABLE leads ADD COLUMN IF NOT EXISTS revenue numeric(12,2) DEFAULT 0;

COMMENT ON COLUMN leads.revenue IS 'Сумма выручки, принесенная лидом (для расчета ROMI и CAC)';
