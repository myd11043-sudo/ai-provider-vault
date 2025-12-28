-- Migration: API Key Sharing System
-- Replaces provider-level sharing with granular API key sharing
-- Members can only see specific keys shared with them (not entire providers)

-- =============================================================================
-- 1. CREATE SHARED_API_KEYS TABLE
-- =============================================================================
-- Junction table for sharing individual API keys with members

CREATE TABLE public.shared_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(api_key_id, shared_with_user_id)
);

-- Enable RLS
ALTER TABLE public.shared_api_keys ENABLE ROW LEVEL SECURITY;

-- Users can view shares relevant to them (as owner or recipient)
CREATE POLICY "Users can view their api key shares"
  ON public.shared_api_keys FOR SELECT
  USING (
    shared_by_user_id = auth.uid()
    OR shared_with_user_id = auth.uid()
  );

-- Only super_admin (API key owner) can create shares
CREATE POLICY "Super admin can share api keys"
  ON public.shared_api_keys FOR INSERT
  WITH CHECK (
    shared_by_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
    AND EXISTS (
      SELECT 1 FROM public.api_keys
      WHERE id = api_key_id AND owner_id = auth.uid() AND deleted_at IS NULL
    )
  );

-- Only super_admin can delete shares
CREATE POLICY "Super admin can unshare api keys"
  ON public.shared_api_keys FOR DELETE
  USING (
    shared_by_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- =============================================================================
-- 2. UPDATE PROVIDERS RLS POLICIES
-- =============================================================================
-- Members can see provider info only if they have at least one shared key from it

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view own or shared providers" ON public.providers;

-- New SELECT policy: owners see all, members see providers with shared keys
CREATE POLICY "Users can view own or shared providers"
  ON public.providers FOR SELECT
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.shared_api_keys sak
      JOIN public.api_keys ak ON sak.api_key_id = ak.id
      WHERE ak.provider_id = providers.id
        AND sak.shared_with_user_id = auth.uid()
        AND ak.deleted_at IS NULL
    )
  );

-- =============================================================================
-- 3. UPDATE API_KEYS RLS POLICIES
-- =============================================================================
-- Members can only see specifically shared keys (not all keys of shared providers)

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view own or shared api_keys" ON public.api_keys;

-- New SELECT policy: owners see all their keys, members see only shared keys
CREATE POLICY "Users can view own or shared api_keys"
  ON public.api_keys FOR SELECT
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.shared_api_keys sak
      WHERE sak.api_key_id = api_keys.id AND sak.shared_with_user_id = auth.uid()
    )
  );

-- =============================================================================
-- 4. UPDATE VAULT FUNCTION FOR SHARED KEY ACCESS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_decrypted_api_key(p_api_key_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vault_secret_id UUID;
  v_owner_id UUID;
  v_decrypted_key TEXT;
  v_is_shared BOOLEAN;
BEGIN
  -- Get the API key record
  SELECT vault_secret_id, owner_id
  INTO v_vault_secret_id, v_owner_id
  FROM public.api_keys
  WHERE id = p_api_key_id AND deleted_at IS NULL;

  IF v_vault_secret_id IS NULL THEN
    RAISE EXCEPTION 'API key not found';
  END IF;

  -- Check if user is owner
  IF v_owner_id = auth.uid() THEN
    -- Owner has access
    NULL;
  ELSE
    -- Check if this specific key is shared with this user
    SELECT EXISTS (
      SELECT 1 FROM public.shared_api_keys
      WHERE api_key_id = p_api_key_id AND shared_with_user_id = auth.uid()
    ) INTO v_is_shared;

    IF NOT v_is_shared THEN
      RAISE EXCEPTION 'Access denied';
    END IF;
  END IF;

  -- Retrieve the decrypted secret from Vault
  SELECT decrypted_secret INTO v_decrypted_key
  FROM vault.decrypted_secrets
  WHERE id = v_vault_secret_id;

  RETURN v_decrypted_key;
END;
$$;

-- =============================================================================
-- 5. VIEW FOR SHARED KEYS WITH PROVIDER INFO (for members)
-- =============================================================================
-- Returns minimal provider info for members viewing shared keys

CREATE OR REPLACE VIEW public.shared_keys_with_provider AS
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

-- =============================================================================
-- 6. MIGRATE EXISTING DATA (if any)
-- =============================================================================
-- Convert existing shared_providers to shared_api_keys
-- This shares ALL keys of previously shared providers (user can unshare later)

INSERT INTO public.shared_api_keys (api_key_id, shared_with_user_id, shared_by_user_id)
SELECT DISTINCT
  ak.id,
  sp.shared_with_user_id,
  sp.shared_by_user_id
FROM public.shared_providers sp
JOIN public.api_keys ak ON ak.provider_id = sp.provider_id
WHERE ak.deleted_at IS NULL
ON CONFLICT (api_key_id, shared_with_user_id) DO NOTHING;

-- =============================================================================
-- 7. DROP OLD SHARED_PROVIDERS TABLE
-- =============================================================================
-- Keep the table for now in case rollback is needed
-- Can be dropped in a future migration after confirming everything works

-- DROP TABLE IF EXISTS public.shared_providers;
-- For now, just rename it to mark as deprecated
ALTER TABLE public.shared_providers RENAME TO shared_providers_deprecated;

-- =============================================================================
-- 8. INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX idx_shared_api_keys_api_key_id ON public.shared_api_keys(api_key_id);
CREATE INDEX idx_shared_api_keys_shared_with ON public.shared_api_keys(shared_with_user_id);
CREATE INDEX idx_shared_api_keys_shared_by ON public.shared_api_keys(shared_by_user_id);
