-- Add main thread URL and tier system to providers
-- Migration: 004_add_thread_url_and_tiers.sql

-- Create tier enum type
CREATE TYPE public.provider_tier AS ENUM ('S', 'A', 'B', 'C', 'D');

-- Add new columns
ALTER TABLE public.providers
ADD COLUMN main_thread_url TEXT,
ADD COLUMN tier public.provider_tier DEFAULT 'B';

-- Update the active_providers view to include new columns
DROP VIEW IF EXISTS public.active_providers;
CREATE VIEW public.active_providers AS
SELECT * FROM public.providers
WHERE deleted_at IS NULL;
