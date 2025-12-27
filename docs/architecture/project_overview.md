# Provider Vault App - Refined Prompt

## PROJECT OVERVIEW

Build a **"Provider Vault"** application for securely storing API keys and managing AI provider metadata (models, remarks, daily login reward tracking).

---

## TECH STACK

| Layer     | Technology                              |
| --------- | --------------------------------------- |
| Framework | Next.js 15 (App Router, Server Actions) |
| Backend   | Supabase (Auth, Database, Realtime)     |
| Auth      | `@supabase/ssr` (cookie-based SSR auth) |
| Hosting   | Vercel                                  |
| Styling   | Tailwind CSS (Dark Mode, Minimalist)    |

---

## CRITICAL CONSTRAINTS

1. **Encryption at Rest:**

   - Store API keys using **Supabase Vault** (`vault.create_secret()`, `vault.decrypted_secrets` view).
   - **Do NOT use `pgsodium` directly** (pending deprecation per Supabase guidance).
   - Decryption must only occur on explicit, authenticated Admin request.

2. **Row Level Security (RLS):**

   - Mandatory on all tables.
   - Policy: Only the `owner_id` (authenticated user) can `SELECT`, `INSERT`, `UPDATE` their own records.

3. **Soft Deletes:**

   - Implement a `deleted_at TIMESTAMPTZ` column instead of permanent `DELETE`.
   - Create a view (e.g., `active_providers`) that filters `WHERE deleted_at IS NULL`.

4. **Daily Reward Tracking:**
   - Schema must include:
     - `requires_daily_login BOOLEAN DEFAULT FALSE`
     - `last_reward_claimed_at TIMESTAMPTZ`
   - Purpose: Identify providers requiring manual daily login checks.

---

## TASK 1: RESEARCH PHASE

**Objective:** Gather up-to-date documentation before architectural planning.

**Search Topics (use Tavily/Context7 MCP):**

| Topic                                               | Focus Area                                      |
| --------------------------------------------------- | ----------------------------------------------- |
| Next.js 15 App Router Server Actions best practices | `useActionState`, form handling, error patterns |
| Supabase SSR package Next.js 15 implementation      | `@supabase/ssr`, middleware token refresh       |
| Supabase Vault secrets management guide             | `vault.create_secret()`, `decrypted_secrets`    |
| Vercel Cron Jobs with Next.js App Router            | Route Handlers, `vercel.json` cron config       |

**Deliverable:** A concise **Research Summary** (bullet points per topic).

---

## TASK 2: ARCHITECTURAL SPECIFICATION

**Objective:** Generate a comprehensive [`PLAN.md`](PLAN.md) document.

**Required Sections:**

### 1. Database Schema (SQL)

- Tables: `providers`, `api_keys` (linked to Vault), `users`
- Supabase Vault integration for key storage
- RLS policies per table
- Soft delete column + filtered view

### 2. Project Structure

- Next.js 15 App Router file tree
- Include: `lib/supabase/server.ts`, `lib/supabase/client.ts`, `middleware.ts`, `actions/`, `components/`

### 3. Security Strategy

- Data flow diagram (text-based): `Client Form → Server Action → Supabase Vault`
- Explicit steps to prevent key leakage in logs/network
- Middleware auth token refresh pattern

### 4. Implementation Checklist

- Step-by-step build order (e.g., DB setup → Auth → CRUD → Cron)
- Markdown checklist format (`- [ ] Task`)

---

## OUTPUT CONSTRAINTS

- **Do NOT write implementation code yet.**
- Present the **Research Summary** first.
- Then present the full **[`PLAN.md`](PLAN.md)** content.
- Await user review before proceeding to code generation.

---

_This prompt is optimized for Architect or Code mode execution._
