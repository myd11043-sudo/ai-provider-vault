-- Vault Helper Functions
-- Migration: 002_vault_functions.sql
-- NOTE: Ensure Vault extension is enabled in Supabase Dashboard before running

-- ============================================
-- VAULT HELPER FUNCTIONS
-- ============================================

-- Store an API key in the Vault
-- Called via service_role from Server Actions
CREATE OR REPLACE FUNCTION public.store_api_key(
  p_owner_id UUID,
  p_provider_id UUID,
  p_label TEXT,
  p_api_key TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_secret_id UUID;
  v_key_prefix TEXT;
  v_api_key_id UUID;
BEGIN
  -- Verify the provider belongs to the user
  IF NOT EXISTS (
    SELECT 1 FROM providers
    WHERE id = p_provider_id
    AND owner_id = p_owner_id
    AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Provider does not belong to user or is deleted';
  END IF;

  -- Store the API key in Vault
  INSERT INTO vault.secrets (secret, name, description)
  VALUES (
    p_api_key,
    'api_key_' || gen_random_uuid()::text,
    'API key for provider ' || p_provider_id::text || ' owned by ' || p_owner_id::text
  )
  RETURNING id INTO v_secret_id;

  -- Extract prefix for display (first 8 chars + ...)
  v_key_prefix := LEFT(p_api_key, 8) || '...';

  -- Create the api_keys record
  INSERT INTO api_keys (owner_id, provider_id, label, vault_secret_id, key_prefix)
  VALUES (p_owner_id, p_provider_id, p_label, v_secret_id, v_key_prefix)
  RETURNING id INTO v_api_key_id;

  RETURN v_api_key_id;
END;
$$;

-- Retrieve decrypted API key (only for authenticated owner)
CREATE OR REPLACE FUNCTION public.get_decrypted_api_key(p_api_key_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_secret TEXT;
  v_owner_id UUID;
  v_vault_secret_id UUID;
BEGIN
  -- Get the owner_id and vault_secret_id
  SELECT owner_id, vault_secret_id
  INTO v_owner_id, v_vault_secret_id
  FROM api_keys
  WHERE id = p_api_key_id AND deleted_at IS NULL;

  -- Verify ownership
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'API key not found';
  END IF;

  IF v_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Access denied';
  END IF;

  IF v_vault_secret_id IS NULL THEN
    RAISE EXCEPTION 'API key has been deleted from vault';
  END IF;

  -- Get decrypted secret from vault
  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets
  WHERE id = v_vault_secret_id;

  IF v_secret IS NULL THEN
    RAISE EXCEPTION 'Secret not found in vault';
  END IF;

  RETURN v_secret;
END;
$$;

-- Soft delete an API key (also removes from Vault)
CREATE OR REPLACE FUNCTION public.delete_api_key(p_api_key_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_vault_secret_id UUID;
  v_owner_id UUID;
BEGIN
  -- Verify ownership and get vault_secret_id
  SELECT vault_secret_id, owner_id
  INTO v_vault_secret_id, v_owner_id
  FROM api_keys
  WHERE id = p_api_key_id
    AND deleted_at IS NULL;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'API key not found';
  END IF;

  IF v_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Access denied';
  END IF;

  -- Delete from Vault if exists
  IF v_vault_secret_id IS NOT NULL THEN
    DELETE FROM vault.secrets WHERE id = v_vault_secret_id;
  END IF;

  -- Soft delete the api_keys record
  UPDATE api_keys
  SET deleted_at = NOW(), vault_secret_id = NULL
  WHERE id = p_api_key_id;

  RETURN TRUE;
END;
$$;

-- Update an existing API key (replaces the vault secret)
CREATE OR REPLACE FUNCTION public.update_api_key(
  p_api_key_id UUID,
  p_new_api_key TEXT,
  p_new_label TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_old_vault_secret_id UUID;
  v_new_secret_id UUID;
  v_owner_id UUID;
  v_provider_id UUID;
  v_key_prefix TEXT;
BEGIN
  -- Get current record and verify ownership
  SELECT vault_secret_id, owner_id, provider_id
  INTO v_old_vault_secret_id, v_owner_id, v_provider_id
  FROM api_keys
  WHERE id = p_api_key_id AND deleted_at IS NULL;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'API key not found';
  END IF;

  IF v_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Access denied';
  END IF;

  -- Delete old secret from vault
  IF v_old_vault_secret_id IS NOT NULL THEN
    DELETE FROM vault.secrets WHERE id = v_old_vault_secret_id;
  END IF;

  -- Store new API key in Vault
  INSERT INTO vault.secrets (secret, name, description)
  VALUES (
    p_new_api_key,
    'api_key_' || gen_random_uuid()::text,
    'API key for provider ' || v_provider_id::text || ' owned by ' || v_owner_id::text
  )
  RETURNING id INTO v_new_secret_id;

  -- Extract new prefix
  v_key_prefix := LEFT(p_new_api_key, 8) || '...';

  -- Update the api_keys record
  UPDATE api_keys
  SET
    vault_secret_id = v_new_secret_id,
    key_prefix = v_key_prefix,
    label = COALESCE(p_new_label, label),
    updated_at = NOW()
  WHERE id = p_api_key_id;

  RETURN TRUE;
END;
$$;
