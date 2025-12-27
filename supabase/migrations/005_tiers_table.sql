-- Create tiers table for customizable tier management
-- Migration: 005_tiers_table.sql

-- First drop the view that depends on the tier column
DROP VIEW IF EXISTS public.active_providers;

-- Drop the enum type constraint from providers
ALTER TABLE public.providers DROP COLUMN IF EXISTS tier;

-- Drop the enum type if exists
DROP TYPE IF EXISTS public.provider_tier;

-- Create tiers table
CREATE TABLE public.tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., 'S', 'A', 'B', 'C', 'D'
  label TEXT NOT NULL, -- e.g., 'S Tier', 'A Tier'
  description TEXT,
  color TEXT NOT NULL DEFAULT 'bg-zinc-500 text-white', -- Tailwind classes
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(owner_id, name)
);

-- Create index
CREATE INDEX idx_tiers_owner_id ON public.tiers(owner_id);

-- Add tier_id to providers
ALTER TABLE public.providers
ADD COLUMN tier_id UUID REFERENCES public.tiers(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.tiers ENABLE ROW LEVEL SECURITY;

-- Tiers policies
CREATE POLICY "Users can view own tiers"
  ON public.tiers FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own tiers"
  ON public.tiers FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own tiers"
  ON public.tiers FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own tiers"
  ON public.tiers FOR DELETE
  USING (auth.uid() = owner_id);

-- Trigger for updated_at
CREATE TRIGGER set_tiers_updated_at
  BEFORE UPDATE ON public.tiers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Update active_providers view to include tier info
DROP VIEW IF EXISTS public.active_providers;
CREATE VIEW public.active_providers AS
SELECT * FROM public.providers
WHERE deleted_at IS NULL;
