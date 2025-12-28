-- Migration: Roles and Sharing System
-- Adds Super Admin and Member roles with provider sharing functionality

-- =============================================================================
-- 1. USER ROLES TABLE
-- =============================================================================
-- Stores role assignments for users
-- First user to sign up becomes super_admin, subsequent users are members

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'member')) DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Everyone can read roles (needed for UI to check permissions)
CREATE POLICY "Users can view all roles"
  ON public.user_roles FOR SELECT
  USING (true);

-- Only super_admin can insert roles (members only, not other super_admins)
-- Exception: First user can create their own super_admin role
CREATE POLICY "Super admin can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    (
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'super_admin'
      )
      AND role = 'member' -- Can only add members, not other super_admins
    )
    OR NOT EXISTS (SELECT 1 FROM public.user_roles) -- First user can create their own role as super_admin
  );

-- Super admin role cannot be changed (no updates allowed on super_admin records)
CREATE POLICY "Super admin can update member roles only"
  ON public.user_roles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
    AND role = 'member' -- Can only update member records, not super_admin
  )
  WITH CHECK (
    role = 'member' -- Cannot change anyone to super_admin
  );

-- Super admin cannot delete their own role, and cannot delete other super_admins
CREATE POLICY "Super admin can delete members only"
  ON public.user_roles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
    AND user_id != auth.uid() -- Cannot delete own role
    AND role = 'member' -- Can only delete members, not other super_admins
  );

-- Trigger for updated_at
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- 2. SHARED PROVIDERS TABLE
-- =============================================================================
-- Junction table for sharing providers with members

CREATE TABLE public.shared_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider_id, shared_with_user_id)
);

-- Enable RLS
ALTER TABLE public.shared_providers ENABLE ROW LEVEL SECURITY;

-- Users can view shares relevant to them (as owner or recipient)
CREATE POLICY "Users can view their shares"
  ON public.shared_providers FOR SELECT
  USING (
    shared_by_user_id = auth.uid()
    OR shared_with_user_id = auth.uid()
  );

-- Only super_admin (provider owner) can create shares
CREATE POLICY "Super admin can share providers"
  ON public.shared_providers FOR INSERT
  WITH CHECK (
    shared_by_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
    AND EXISTS (
      SELECT 1 FROM public.providers
      WHERE id = provider_id AND owner_id = auth.uid()
    )
  );

-- Only super_admin can delete shares
CREATE POLICY "Super admin can unshare providers"
  ON public.shared_providers FOR DELETE
  USING (
    shared_by_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- =============================================================================
-- 3. UPDATE PROVIDERS RLS POLICIES
-- =============================================================================
-- Allow members to view shared providers

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view own providers" ON public.providers;

-- New SELECT policy: owners + shared members can view
CREATE POLICY "Users can view own or shared providers"
  ON public.providers FOR SELECT
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.shared_providers sp
      WHERE sp.provider_id = providers.id AND sp.shared_with_user_id = auth.uid()
    )
  );

-- =============================================================================
-- 4. UPDATE API_KEYS RLS POLICIES
-- =============================================================================
-- Allow members to view API keys of shared providers

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view own api_keys" ON public.api_keys;

-- New SELECT policy: owners + shared members can view
CREATE POLICY "Users can view own or shared api_keys"
  ON public.api_keys FOR SELECT
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.shared_providers sp
      WHERE sp.provider_id = api_keys.provider_id AND sp.shared_with_user_id = auth.uid()
    )
  );

-- =============================================================================
-- 5. HELPER FUNCTIONS
-- =============================================================================

-- Function to check if user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id AND role = 'super_admin'
  );
END;
$$;

-- Function to check if user is member
CREATE OR REPLACE FUNCTION public.is_member(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id AND role = 'member'
  );
END;
$$;

-- Function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role(check_user_id UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = check_user_id;

  RETURN COALESCE(user_role, 'none');
END;
$$;

-- =============================================================================
-- 6. UPDATE VAULT FUNCTION FOR SHARED ACCESS
-- =============================================================================

-- Update get_decrypted_api_key to allow shared access
CREATE OR REPLACE FUNCTION public.get_decrypted_api_key(p_api_key_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vault_secret_id UUID;
  v_owner_id UUID;
  v_provider_id UUID;
  v_decrypted_key TEXT;
  v_is_shared BOOLEAN;
BEGIN
  -- Get the API key record
  SELECT vault_secret_id, owner_id, provider_id
  INTO v_vault_secret_id, v_owner_id, v_provider_id
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
    -- Check if provider is shared with this user
    SELECT EXISTS (
      SELECT 1 FROM public.shared_providers
      WHERE provider_id = v_provider_id AND shared_with_user_id = auth.uid()
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
-- 7. VIEW FOR MEMBERS TO SEE THEIR ACCESSIBLE PROVIDERS
-- =============================================================================

CREATE OR REPLACE VIEW public.accessible_providers AS
SELECT
  p.*,
  CASE
    WHEN p.owner_id = auth.uid() THEN 'owner'
    ELSE 'shared'
  END as access_type
FROM public.providers p
WHERE p.deleted_at IS NULL
  AND (
    p.owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.shared_providers sp
      WHERE sp.provider_id = p.id AND sp.shared_with_user_id = auth.uid()
    )
  );

-- =============================================================================
-- 8. INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_shared_providers_provider_id ON public.shared_providers(provider_id);
CREATE INDEX idx_shared_providers_shared_with ON public.shared_providers(shared_with_user_id);
CREATE INDEX idx_shared_providers_shared_by ON public.shared_providers(shared_by_user_id);
