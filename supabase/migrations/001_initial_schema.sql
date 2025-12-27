-- Provider Vault Database Schema
-- Migration: 001_initial_schema.sql

-- ============================================
-- TABLES
-- ============================================

-- Providers table
CREATE TABLE public.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website_url TEXT,
  remarks TEXT,
  requires_daily_login BOOLEAN DEFAULT FALSE,
  last_reward_claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete column
);

-- Indexes for providers
CREATE INDEX idx_providers_owner_id ON public.providers(owner_id);
CREATE INDEX idx_providers_deleted_at ON public.providers(deleted_at);

-- API Keys table
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  vault_secret_id UUID, -- Reference to vault.secrets.id (nullable after soft delete)
  key_prefix TEXT, -- First 8 chars for identification
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete column
);

-- Indexes for api_keys
CREATE INDEX idx_api_keys_owner_id ON public.api_keys(owner_id);
CREATE INDEX idx_api_keys_provider_id ON public.api_keys(provider_id);
CREATE INDEX idx_api_keys_deleted_at ON public.api_keys(deleted_at);

-- Provider Models table (optional - for tracking available models)
CREATE TABLE public.provider_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  model_name TEXT NOT NULL,
  model_id TEXT NOT NULL,
  is_free BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(provider_id, model_id)
);

CREATE INDEX idx_provider_models_provider_id ON public.provider_models(provider_id);

-- ============================================
-- VIEWS (Soft Delete Filters)
-- ============================================

-- Active providers view (excludes soft-deleted)
CREATE VIEW public.active_providers AS
SELECT * FROM public.providers
WHERE deleted_at IS NULL;

-- Active API keys view
CREATE VIEW public.active_api_keys AS
SELECT * FROM public.api_keys
WHERE deleted_at IS NULL;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_models ENABLE ROW LEVEL SECURITY;

-- Providers policies
CREATE POLICY "Users can view own providers"
  ON public.providers FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own providers"
  ON public.providers FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own providers"
  ON public.providers FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- API Keys policies
CREATE POLICY "Users can view own api_keys"
  ON public.api_keys FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own api_keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own api_keys"
  ON public.api_keys FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Provider Models policies
CREATE POLICY "Users can view models for own providers"
  ON public.provider_models FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE providers.id = provider_models.provider_id
      AND providers.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert models for own providers"
  ON public.provider_models FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE providers.id = provider_models.provider_id
      AND providers.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update models for own providers"
  ON public.provider_models FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE providers.id = provider_models.provider_id
      AND providers.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE providers.id = provider_models.provider_id
      AND providers.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete models for own providers"
  ON public.provider_models FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE providers.id = provider_models.provider_id
      AND providers.owner_id = auth.uid()
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================

-- Automatic updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_providers_updated_at
  BEFORE UPDATE ON public.providers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
