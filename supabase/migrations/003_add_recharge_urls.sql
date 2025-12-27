-- Add recharge URL columns to providers
-- Migration: 003_add_recharge_urls.sql

-- Add recharge URL columns
ALTER TABLE public.providers
ADD COLUMN recharge_url TEXT,
ADD COLUMN recharge_url_2 TEXT;

-- Update the active_providers view to include new columns
DROP VIEW IF EXISTS public.active_providers;
CREATE VIEW public.active_providers AS
SELECT * FROM public.providers
WHERE deleted_at IS NULL;
