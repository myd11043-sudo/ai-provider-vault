# Supabase Setup Guide for Provider Vault

This guide walks you through setting up Supabase for the Provider Vault application.

## Table of Contents

1. [Create Supabase Project](#1-create-supabase-project)
2. [Get API Credentials](#2-get-api-credentials)
3. [Configure Environment Variables](#3-configure-environment-variables)
4. [Enable Vault Extension](#4-enable-vault-extension)
5. [Run Database Migrations](#5-run-database-migrations)
6. [Configure Authentication](#6-configure-authentication)
7. [Test the Setup](#7-test-the-setup)

---

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in (or create an account)
2. Click **"New Project"**
3. Fill in the details:
   - **Organization**: Select or create one
   - **Project name**: `provider-vault` (or your preferred name)
   - **Database Password**: Generate a strong password and **save it securely**
   - **Region**: Choose the closest to your users
4. Click **"Create new project"** and wait for provisioning (~2 minutes)

---

## 2. Get API Credentials

Once your project is ready:

1. Go to **Project Settings** (gear icon in sidebar)
2. Click **API Keys** in the left menu
3. Copy these values:

### From the API Keys tab:

| Dashboard Field | Environment Variable | Description |
|-----------------|---------------------|-------------|
| **Project ID** | Used in Project URL | Reference ID for your project |
| **Publishable key** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Safe for client-side, respects RLS |

Your **Project URL** is: `https://<Project ID>.supabase.co`

### From the Secret keys section:

| Dashboard Field | Environment Variable | Description |
|-----------------|---------------------|-------------|
| **Secret key** | `SUPABASE_SERVICE_ROLE_KEY` | Full access, bypasses RLS |

> **Security Note**: Secret keys have full database access and bypass Row Level Security. Never expose them client-side. Only use in servers, Edge Functions, or other backend components.

### Alternative: Legacy API Keys

If you see a **Legacy API Keys** tab, you can also use:
- `anon` key → Same as Publishable key
- `service_role` key → Same as Secret key

---

## 3. Configure Environment Variables

Create `.env.local` in your project root:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Supabase (from Project Settings > API Keys)
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx...  # or eyJhbG... (legacy)

# Server-only - NEVER expose this client-side
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxx...  # or eyJhbG... (legacy)

# For Vercel Cron Jobs (generate a random string)
CRON_SECRET=your-random-secret-here
```

To generate a random CRON_SECRET:

```bash
openssl rand -base64 32
```

---

## 4. Enable Vault Extension

The Vault extension is required for secure API key storage.

### Option 1: Via Integrations (Recommended)

1. Go to **Integrations** in the sidebar
2. Search for or click on **"Vault"**
3. You should see `supabase_vault` listed under "Required extensions"
4. If not already **INSTALLED**, click to enable it

### Option 2: Via SQL Editor

If you can't find it in Integrations, run this SQL:

```sql
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;
```

> **Note**: Vault is automatically available on Supabase projects. The extension manages encryption keys securely in Supabase's backend systems.

---

## 5. Run Database Migrations

Execute the migrations in the Supabase SQL Editor:

### Step 1: Run Initial Schema

1. Go to **SQL Editor** in the sidebar
2. Click **"New Query"**
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Click **"Run"**

This creates:
- `providers` table
- `api_keys` table
- `provider_models` table
- Soft-delete views (`active_providers`, `active_api_keys`)
- RLS policies
- Update triggers

### Step 2: Run Vault Functions

1. Create a new query
2. Copy the contents of `supabase/migrations/002_vault_functions.sql`
3. Click **"Run"**

This creates:
- `store_api_key()` - Stores encrypted API keys in Vault
- `get_decrypted_api_key()` - Retrieves decrypted keys (owner only)
- `delete_api_key()` - Soft deletes and removes from Vault
- `update_api_key()` - Updates an existing key

### Verify Tables

Run this query to verify:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

You should see:
- `providers`
- `api_keys`
- `provider_models`

---

## 6. Configure Authentication

### Enable Email/Password Auth

1. Go to **Authentication** in the sidebar
2. Click **Providers**
3. Ensure **Email** is enabled (it should be by default)
4. Configure settings:
   - **Confirm email**: Toggle based on preference
   - **Secure email change**: Recommended ON

### Create Admin User

Public signup is disabled in this application. You must create user accounts manually via the Supabase Dashboard:

1. Go to **Authentication** in the sidebar
2. Click **Users**
3. Click **"Add user"** button (top right)
4. Select **"Create new user"**
5. Fill in the details:
   - **Email**: Your admin email address
   - **Password**: A strong password
   - **Auto Confirm User**: Toggle ON (skips email verification)
6. Click **"Create user"**

The user can now log in at your application's `/login` page.

> **Tip**: To create additional users later, repeat these steps. Only you (the admin) can create new accounts.

### Configure Email Templates (Optional)

For SSR auth flow, update the email templates:

1. Go to **Authentication** > **Email Templates**
2. In **Confirm signup** template, change:

   ```
   {{ .ConfirmationURL }}
   ```

   to:

   ```
   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
   ```

### Configure Site URL

1. Go to **Authentication** > **URL Configuration**
2. Set **Site URL** to your domain:
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`
3. Add **Redirect URLs**:
   - `http://localhost:3000/**`
   - `https://your-domain.com/**`

---

## 7. Test the Setup

### Start the Development Server

```bash
npm run dev
```

### Test Authentication

1. Create a user in Supabase Dashboard (see "Create Admin User" section above)
2. Open `http://localhost:3000`
3. Click **"Sign in"**
4. Log in with the credentials you created
5. You should be redirected to `/providers`

### Test Provider Creation

1. Click **"Add Provider"**
2. Fill in the form:
   - Name: `OpenAI`
   - Website: `https://platform.openai.com`
   - Check "Requires daily login" if applicable
3. Click **"Create Provider"**

### Test API Key Storage

1. Click on your new provider
2. Click **"Add Key"**
3. Enter:
   - Label: `Production`
   - API Key: `sk-test-1234567890abcdef`
4. Click **"Store Key"**

### Verify Encryption

In Supabase SQL Editor, run:

```sql
-- This shows encrypted data
SELECT id, secret FROM vault.secrets LIMIT 5;

-- This shows decrypted data (only visible through this view)
SELECT id, name, LEFT(decrypted_secret, 20) as preview
FROM vault.decrypted_secrets
LIMIT 5;
```

The `secret` column should show encrypted gibberish, while `decrypted_secret` shows the actual key.

---

## Troubleshooting

### "Not authenticated" Errors

- Clear your browser cookies
- Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Ensure the middleware is running (check terminal for errors)

### "Failed to store API key" Errors

- Verify the Vault extension is enabled
- Check that `SUPABASE_SERVICE_ROLE_KEY` is set (server-side only)
- Run the Vault functions migration again

### RLS Policy Errors

- Make sure you're authenticated
- Verify RLS policies were created (check Authentication > Policies)
- Ensure `owner_id` matches `auth.uid()`

### Middleware Not Refreshing Tokens

- Check that `middleware.ts` exists in `src/` folder
- Verify the matcher pattern includes your routes
- Check browser dev tools for cookie errors

---

## Production Checklist

Before deploying:

- [ ] Set production `Site URL` in Authentication settings
- [ ] Add production domain to Redirect URLs
- [ ] Set environment variables in Vercel/hosting platform
- [ ] Generate a secure `CRON_SECRET` for production
- [ ] Create admin user account in Supabase Dashboard
- [ ] Review RLS policies for security

---

## Useful SQL Queries

### Check RLS Policies

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

### View All Providers for Current User

```sql
SELECT * FROM active_providers;
```

### Check Vault Secrets (Admin Only)

```sql
SELECT id, name, description, created_at
FROM vault.secrets;
```

---

## Resources

- [Supabase Docs - Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase Vault Documentation](https://supabase.com/docs/guides/database/vault)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js User Management Tutorial](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)
