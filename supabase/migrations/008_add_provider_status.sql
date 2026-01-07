-- Migration: Add is_active status to providers
-- Allows marking providers as active/inactive (e.g., when a provider goes on hiatus)

-- =============================================================================
-- 1. ADD is_active COLUMN TO PROVIDERS TABLE
-- =============================================================================

ALTER TABLE public.providers
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Create index for filtering by active status
CREATE INDEX idx_providers_is_active ON public.providers(is_active);

-- =============================================================================
-- 2. UPDATE active_providers VIEW
-- =============================================================================
-- The view already filters by deleted_at IS NULL
-- Now also filter by is_active = TRUE

DROP VIEW IF EXISTS public.active_providers;

CREATE VIEW public.active_providers AS
SELECT * FROM public.providers
WHERE deleted_at IS NULL AND is_active = TRUE;

-- =============================================================================
-- 3. UPDATE shared_keys_with_provider VIEW
-- =============================================================================
-- Include is_active field so members can see provider status

DROP VIEW IF EXISTS public.shared_keys_with_provider;

CREATE VIEW public.shared_keys_with_provider AS
SELECT
  ak.id as api_key_id,
  ak.label as api_key_label,
  ak.key_prefix,
  ak.created_at as key_created_at,
  p.id as provider_id,
  p.name as provider_name,
  p.website_url,
  p.tier_id,
  p.remarks as provider_remarks,
  p.is_active as provider_is_active,
  t.name as tier_name,
  t.label as tier_label,
  t.color as tier_color,
  t.sort_order as tier_sort_order,
  sak.shared_by_user_id,
  sak.created_at as shared_at
FROM public.shared_api_keys sak
JOIN public.api_keys ak ON sak.api_key_id = ak.id
JOIN public.providers p ON ak.provider_id = p.id
LEFT JOIN public.tiers t ON p.tier_id = t.id
WHERE sak.shared_with_user_id = auth.uid()
  AND ak.deleted_at IS NULL
  AND p.deleted_at IS NULL;
