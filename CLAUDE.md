# Commands

- Dev: npm run dev
- Build: npm run build
- Lint: npm run lint
- DB Push: npx supabase db push
- Gen Types: npx supabase gen types typescript --project-id [YOUR_PROJECT_ID] > types/supabase.ts

# Architecture & Tech Stack

- Framework: Next.js 16 (App Router)
- Language: TypeScript
- Style: Tailwind CSS
- Backend: Supabase (Auth, DB, Realtime)
- Auth: Supabase Auth (SSR package)
- Icons: Lucide React

# Coding Standards

1. **Next.js 16 Specifics**:

   - Use Server Components by default.
   - `params` and `searchParams` in pages/layouts are PROMISES. Await them.
   - `cookies()`, `headers()`, `draftMode()` from `next/headers` are ASYNC. Await them.
   - Use Server Actions for data mutations (form submissions).
   - Use `useActionState` (React 19) for form state management with Server Actions.
   - Use `next/image` for all images.

2. **Supabase & Security**:

   - NEVER query the DB directly from a Client Component. Pass data via props or use a Server Action.
   - Use `@supabase/ssr` for cookie-based auth handling. `cookies()` must be awaited.
   - **Encryption**: Use **Supabase Vault** for storing secrets/API keys (`vault.create_secret()`, `vault.decrypted_secrets` view). Do NOT use `pgsodium` directly (pending deprecation).
   - **RLS**: Every table must have RLS enabled.
   - Note: Supabase projects are encrypted at rest by default.

3. **Code Style**:

   - Use Functional Components with arrow functions.
   - Use `const` over `let`.
   - Name files in `kebab-case` (e.g., `api-key-card.tsx`).
   - Absolute imports: `@/components`, `@/lib`, `@/types`.

4. **Error Handling**:
   - Wrap Server Actions in `try/catch`.
   - Return structured error objects `{ success: boolean, error?: string, data?: T }`.
   - Use `sonner` or `react-hot-toast` for UI feedback.
