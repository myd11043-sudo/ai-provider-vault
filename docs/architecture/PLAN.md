# Provider Vault - Architectural Specification

## Table of Contents

1. [Database Schema](#1-database-schema)
2. [Project Structure](#2-project-structure)
3. [Security Strategy](#3-security-strategy)
4. [Implementation Checklist](#4-implementation-checklist)

---

## 1. Database Schema

### 1.1 Tables

#### `providers` Table

```sql
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

-- Index for owner queries
CREATE INDEX idx_providers_owner_id ON public.providers(owner_id);
CREATE INDEX idx_providers_deleted_at ON public.providers(deleted_at);
```

#### `api_keys` Table

```sql
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  label TEXT NOT NULL, -- e.g., "Production", "Development"
  vault_secret_id UUID NOT NULL, -- Reference to vault.secrets.id
  key_prefix TEXT, -- First 8 chars for identification (e.g., "sk-proj-...")
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete column
);

-- Indexes
CREATE INDEX idx_api_keys_owner_id ON public.api_keys(owner_id);
CREATE INDEX idx_api_keys_provider_id ON public.api_keys(provider_id);
CREATE INDEX idx_api_keys_deleted_at ON public.api_keys(deleted_at);
```

#### `provider_models` Table (Optional - for tracking available models)

```sql
CREATE TABLE public.provider_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  model_name TEXT NOT NULL,
  model_id TEXT NOT NULL, -- API identifier
  is_free BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(provider_id, model_id)
);

CREATE INDEX idx_provider_models_provider_id ON public.provider_models(provider_id);
```

### 1.2 Soft Delete Views

```sql
-- Active providers view (excludes soft-deleted)
CREATE VIEW public.active_providers AS
SELECT * FROM public.providers
WHERE deleted_at IS NULL;

-- Active API keys view
CREATE VIEW public.active_api_keys AS
SELECT * FROM public.api_keys
WHERE deleted_at IS NULL;
```

### 1.3 Row Level Security (RLS) Policies

```sql
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

-- Provider Models policies (inherit access from provider ownership)
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
```

### 1.4 Supabase Vault Integration

#### Helper Functions for Vault Operations

```sql
-- Create a secret in the Vault (call from Server Action via service_role)
CREATE OR REPLACE FUNCTION public.store_api_key(
  p_owner_id UUID,
  p_provider_id UUID,
  p_label TEXT,
  p_api_key TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges
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
    WHERE id = p_provider_id AND owner_id = p_owner_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Provider does not belong to user';
  END IF;

  -- Store the API key in Vault
  INSERT INTO vault.secrets (secret, name, description)
  VALUES (
    p_api_key,
    'api_key_' || gen_random_uuid()::text,
    'API key for provider ' || p_provider_id::text
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
BEGIN
  -- Get the owner_id and vault_secret_id
  SELECT owner_id, vault_secret_id INTO v_owner_id, v_secret
  FROM api_keys
  WHERE id = p_api_key_id AND deleted_at IS NULL;

  -- Verify ownership
  IF v_owner_id IS NULL OR v_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: API key not found or access denied';
  END IF;

  -- Get decrypted secret from vault
  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets
  WHERE id = (
    SELECT vault_secret_id FROM api_keys WHERE id = p_api_key_id
  );

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
BEGIN
  -- Verify ownership and get vault_secret_id
  SELECT vault_secret_id INTO v_vault_secret_id
  FROM api_keys
  WHERE id = p_api_key_id
    AND owner_id = auth.uid()
    AND deleted_at IS NULL;

  IF v_vault_secret_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: API key not found or access denied';
  END IF;

  -- Delete from Vault
  DELETE FROM vault.secrets WHERE id = v_vault_secret_id;

  -- Soft delete the api_keys record
  UPDATE api_keys
  SET deleted_at = NOW(), vault_secret_id = NULL
  WHERE id = p_api_key_id;

  RETURN TRUE;
END;
$$;
```

### 1.5 Updated At Trigger

```sql
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
```

---

## 2. Project Structure

```
ai_provider_vault/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── providers/
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx          # Provider detail
│   │   │   │   └── edit/
│   │   │   │       └── page.tsx      # Edit provider
│   │   │   ├── new/
│   │   │   │   └── page.tsx          # Create provider
│   │   │   └── page.tsx              # Providers list
│   │   ├── api-keys/
│   │   │   └── page.tsx              # All API keys view
│   │   ├── daily-rewards/
│   │   │   └── page.tsx              # Daily reward tracker
│   │   ├── layout.tsx                # Dashboard layout with sidebar
│   │   └── page.tsx                  # Dashboard home
│   ├── api/
│   │   └── cron/
│   │       └── daily-reward-reminder/
│   │           └── route.ts          # Cron job endpoint
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Landing page
│   └── globals.css
├── actions/
│   ├── auth.ts                       # Login, signup, logout actions
│   ├── providers.ts                  # Provider CRUD actions
│   └── api-keys.ts                   # API key CRUD actions
├── components/
│   ├── ui/                           # Reusable UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── toast.tsx
│   │   └── ...
│   ├── forms/
│   │   ├── provider-form.tsx
│   │   ├── api-key-form.tsx
│   │   └── login-form.tsx
│   ├── providers/
│   │   ├── provider-card.tsx
│   │   ├── provider-list.tsx
│   │   └── provider-detail.tsx
│   ├── api-keys/
│   │   ├── api-key-card.tsx
│   │   ├── api-key-reveal.tsx        # Component to reveal decrypted key
│   │   └── api-key-list.tsx
│   ├── daily-rewards/
│   │   ├── reward-tracker.tsx
│   │   └── reward-item.tsx
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   └── nav-links.tsx
│   └── auth/
│       └── auth-button.tsx
├── lib/
│   ├── supabase/
│   │   ├── server.ts                 # Server-side Supabase client
│   │   ├── client.ts                 # Browser Supabase client
│   │   └── middleware.ts             # Supabase middleware helpers
│   └── utils.ts                      # General utilities
├── types/
│   ├── supabase.ts                   # Generated Supabase types
│   └── index.ts                      # App-specific types
├── middleware.ts                     # Next.js middleware (auth token refresh)
├── vercel.json                       # Cron job configuration
├── tailwind.config.ts
├── next.config.ts
├── package.json
├── tsconfig.json
└── .env.local                        # Environment variables
```

---

## 3. Security Strategy

### 3.1 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT BROWSER                                  │
│                                                                             │
│  ┌─────────────────┐    ┌──────────────────┐    ┌────────────────────┐     │
│  │ Provider Form   │    │ API Key Form     │    │ Reveal Key Button  │     │
│  │ (React Client)  │    │ (React Client)   │    │ (React Client)     │     │
│  └────────┬────────┘    └────────┬─────────┘    └──────────┬─────────┘     │
│           │                      │                         │               │
└───────────┼──────────────────────┼─────────────────────────┼───────────────┘
            │ Form Submit          │ Form Submit             │ onClick
            │ (useActionState)     │ (useActionState)        │ (Server Action)
            ▼                      ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           NEXT.JS SERVER                                     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        SERVER ACTIONS                                │   │
│  │                                                                      │   │
│  │  ┌──────────────────┐  ┌───────────────────┐  ┌──────────────────┐  │   │
│  │  │ createProvider() │  │ storeApiKey()     │  │ revealApiKey()   │  │   │
│  │  │                  │  │                   │  │                  │  │   │
│  │  │ 1. Validate auth │  │ 1. Validate auth  │  │ 1. Validate auth │  │   │
│  │  │ 2. Sanitize data │  │ 2. Sanitize data  │  │ 2. Verify owner  │  │   │
│  │  │ 3. Insert to DB  │  │ 3. Call Vault RPC │  │ 3. Call Vault RPC│  │   │
│  │  │ 4. Revalidate    │  │ 4. Revalidate     │  │ 4. Return key    │  │   │
│  │  └────────┬─────────┘  └─────────┬─────────┘  └────────┬─────────┘  │   │
│  │           │                      │                      │           │   │
│  └───────────┼──────────────────────┼──────────────────────┼───────────┘   │
│              │                      │                      │               │
└──────────────┼──────────────────────┼──────────────────────┼───────────────┘
               │                      │                      │
               ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SUPABASE                                          │
│                                                                             │
│  ┌─────────────────────┐    ┌─────────────────────────────────────────┐    │
│  │     Database        │    │              Vault                       │    │
│  │                     │    │                                         │    │
│  │  ┌───────────────┐  │    │  ┌────────────────────────────────────┐ │    │
│  │  │  providers    │  │    │  │  vault.secrets (encrypted)        │ │    │
│  │  │  (RLS enabled)│  │    │  │                                   │ │    │
│  │  └───────────────┘  │    │  │  - API keys stored encrypted      │ │    │
│  │                     │    │  │  - Decrypted only via view        │ │    │
│  │  ┌───────────────┐  │    │  │                                   │ │    │
│  │  │  api_keys     │◄─┼────┼──┤  vault.decrypted_secrets (view)   │ │    │
│  │  │  (RLS enabled)│  │    │  │  - On-the-fly decryption          │ │    │
│  │  │  vault_ref ───┼──┼────┼──►  - Never stored decrypted        │ │    │
│  │  └───────────────┘  │    │  └────────────────────────────────────┘ │    │
│  │                     │    │                                         │    │
│  └─────────────────────┘    └─────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Row Level Security                                │   │
│  │                                                                      │   │
│  │    owner_id = auth.uid()  →  All queries filtered by user          │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Key Leakage Prevention

| Layer | Protection Measure |
|-------|-------------------|
| **Client** | API keys never sent to client except on explicit reveal request |
| **Server Actions** | Keys pass directly to Vault RPC; never logged or returned in responses |
| **Database** | RLS ensures users only access their own records |
| **Vault** | Keys encrypted at rest; decrypted only in `decrypted_secrets` view |
| **Logs** | Disable Supabase statement logging for Vault operations |
| **Network** | HTTPS enforced; keys transmitted only server-to-Supabase |
| **Display** | Show only `key_prefix` (first 8 chars) in UI by default |

### 3.3 Middleware Auth Token Refresh Pattern

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Use getUser(), NOT getSession()
  // getUser() validates the token with Supabase Auth server
  const { data: { user } } = await supabase.auth.getUser()

  // Protect dashboard routes
  if (!user && request.nextUrl.pathname.startsWith('/providers')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### 3.4 Environment Variables

```env
# .env.local (NEVER commit this file)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-only (for service_role operations)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cron Job Security
CRON_SECRET=your-random-secret-for-cron-verification
```

---

## 4. Implementation Checklist

### Phase 1: Project Setup

- [ ] Initialize Next.js 15 project with TypeScript and Tailwind CSS
- [ ] Install dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `lucide-react`, `sonner`
- [ ] Configure Tailwind CSS with dark mode support
- [ ] Set up project file structure
- [ ] Create `.env.local` with Supabase credentials

### Phase 2: Database Setup

- [ ] Create Supabase project (if not exists)
- [ ] Enable Vault extension in Supabase Dashboard
- [ ] Run SQL migrations for `providers` table
- [ ] Run SQL migrations for `api_keys` table
- [ ] Run SQL migrations for `provider_models` table (optional)
- [ ] Create soft-delete views (`active_providers`, `active_api_keys`)
- [ ] Enable RLS on all tables
- [ ] Create RLS policies for all tables
- [ ] Create Vault helper functions (`store_api_key`, `get_decrypted_api_key`, `delete_api_key`)
- [ ] Create `updated_at` triggers
- [ ] Generate TypeScript types: `npx supabase gen types typescript`

### Phase 3: Authentication

- [ ] Create `lib/supabase/server.ts` (server-side client)
- [ ] Create `lib/supabase/client.ts` (browser client)
- [ ] Implement `middleware.ts` with token refresh
- [ ] Create login page (`app/(auth)/login/page.tsx`)
- [ ] Create signup page (`app/(auth)/signup/page.tsx`)
- [ ] Create auth Server Actions (`actions/auth.ts`)
- [ ] Create auth layout with centered form styling

### Phase 4: Dashboard Layout

- [ ] Create dashboard layout (`app/(dashboard)/layout.tsx`)
- [ ] Build sidebar component with navigation
- [ ] Build header component with user info
- [ ] Implement dark mode toggle (Tailwind `dark:` classes)
- [ ] Create dashboard home page

### Phase 5: Provider CRUD

- [ ] Create Provider Server Actions (`actions/providers.ts`)
  - [ ] `createProvider()`
  - [ ] `updateProvider()`
  - [ ] `softDeleteProvider()`
  - [ ] `restoreProvider()` (optional)
  - [ ] `updateDailyRewardClaim()`
- [ ] Build provider form component
- [ ] Build provider card component
- [ ] Build provider list page
- [ ] Build provider detail page
- [ ] Build provider edit page
- [ ] Build new provider page

### Phase 6: API Key Management

- [ ] Create API Key Server Actions (`actions/api-keys.ts`)
  - [ ] `storeApiKey()` (calls Vault RPC)
  - [ ] `revealApiKey()` (calls Vault RPC)
  - [ ] `softDeleteApiKey()`
- [ ] Build API key form component (with copy-to-clipboard)
- [ ] Build API key card component (shows prefix only)
- [ ] Build API key reveal component (modal with auto-hide)
- [ ] Build API keys list page
- [ ] Integrate API keys into provider detail page

### Phase 7: Daily Reward Tracking

- [ ] Build reward tracker component
- [ ] Build reward item component with claim button
- [ ] Create daily rewards page listing providers with `requires_daily_login = true`
- [ ] Implement claim action that updates `last_reward_claimed_at`

### Phase 8: Cron Job (Optional)

- [ ] Create cron route handler (`app/api/cron/daily-reward-reminder/route.ts`)
- [ ] Implement CRON_SECRET verification
- [ ] Add notification logic (email/webhook) for unclaimed rewards
- [ ] Configure `vercel.json` with cron schedule
- [ ] Test cron job locally and on Vercel

### Phase 9: Testing & Polish

- [ ] Test all CRUD operations
- [ ] Test authentication flow
- [ ] Test API key encryption/decryption
- [ ] Test RLS policies (attempt cross-user access)
- [ ] Add loading states and error handling
- [ ] Add toast notifications for user feedback
- [ ] Responsive design testing
- [ ] Dark mode testing

### Phase 10: Deployment

- [ ] Push code to GitHub
- [ ] Connect repository to Vercel
- [ ] Set environment variables in Vercel Dashboard
- [ ] Deploy to production
- [ ] Verify cron jobs in Vercel Dashboard
- [ ] Final production testing

---

## Notes

- **No `pgsodium` Direct Usage**: All encryption handled via Supabase Vault abstraction
- **Soft Deletes**: Use `deleted_at` timestamp; views filter automatically
- **Key Display**: Only show `key_prefix` in UI; full key revealed on demand
- **Cron Jobs**: Optional feature for reward reminders; can be added later
