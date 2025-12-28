# AI Provider Vault

A secure, self-hosted application for managing AI provider API keys and tracking daily login rewards. Built with Next.js 16, Supabase, and Tailwind CSS.

## Features

- **Secure API Key Storage** - Keys are encrypted at rest using Supabase Vault
- **Provider Management** - Organize your AI providers with tiers and metadata
- **Daily Reward Tracking** - Track and claim daily login rewards from providers
- **Roles & Sharing** - Super Admin and Member roles with provider sharing
- **Search & Filter** - Quickly find providers, tiers, and API keys
- **Dark Mode** - Clean, minimalist UI with dark mode support
- **Self-Hosted** - Your data stays on your own Supabase instance

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, Server Actions) |
| Backend | Supabase (Auth, Database, Vault) |
| Auth | `@supabase/ssr` (cookie-based SSR auth) |
| Styling | Tailwind CSS 4 |
| Icons | Lucide React |
| Hosting | Vercel (recommended) |

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- A [Supabase](https://supabase.com) account (free tier works)
- A [Vercel](https://vercel.com) account (optional, for deployment)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ai-provider-vault.git
cd ai-provider-vault
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Wait for the project to provision (~2 minutes)
3. Go to **Project Settings** > **General** and note down:
   - Project URL: `https://<project-id>.supabase.co`
4. Go to **Project Settings** > **API Keys** and note down:
   - Publishable key (anon key)
   - Secret key (service_role key)

### 3. Enable Vault Extension

1. In Supabase, go to **SQL Editor**
2. Run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;
   ```

### 4. Run Database Migrations

Execute each migration file in order via the SQL Editor:

1. `supabase/migrations/001_initial_schema.sql` - Core tables and RLS
2. `supabase/migrations/002_vault_functions.sql` - Vault helper functions
3. `supabase/migrations/003_add_recharge_urls.sql` - Recharge URL fields
4. `supabase/migrations/004_add_thread_url_and_tiers.sql` - Thread URL field
5. `supabase/migrations/005_tiers_table.sql` - Tiers table
6. `supabase/migrations/006_roles_and_sharing.sql` - User roles and provider sharing

### 5. Configure Environment Variables

Create `.env.local` in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-only (never expose client-side)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# For Vercel Cron Jobs
CRON_SECRET=your-random-secret
```

Generate a random `CRON_SECRET`:
```bash
openssl rand -base64 32
```

### 6. Create Your User Account

This app does not have public signup. Create users manually:

1. Go to Supabase Dashboard > **Authentication** > **Users**
2. Click **Add user** > **Create new user**
3. Enter email and password
4. Toggle **Auto Confirm User** ON
5. Click **Create user**

### 7. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with your credentials.

### 8. Initialize Super Admin Role

The first user to sign in should initialize themselves as Super Admin:

1. Sign in with your account
2. Go to **Admin** > **Members** in the sidebar
3. Click **Initialize as Super Admin**

This is a one-time setup. The Super Admin role cannot be changed or overtaken.

## Usage

### Managing Providers

1. Click **Add Provider** to create a new provider
2. Fill in details:
   - **Name**: Provider name (e.g., "OpenAI")
   - **Tier**: Priority tier for sorting
   - **Website URL**: Main website link
   - **Recharge URL(s)**: Links to claim daily rewards
   - **Requires daily login**: Enable for reward tracking
3. View and manage providers from the dashboard

### Storing API Keys

1. Click on a provider to view details
2. Click **Add Key** to store a new API key
3. Keys are encrypted and stored in Supabase Vault
4. Click the eye icon to reveal a key (auto-hides after 30s)

### Tracking Daily Rewards

1. Go to **Daily Rewards** in the sidebar
2. Providers are sorted by tier priority (lower sort order = higher priority)
3. Click **Recharge** links to claim rewards
4. Click **Mark Claimed** after claiming

### Managing Tiers

1. Go to **Tiers** in the sidebar
2. Create custom tiers with:
   - Name and label
   - Sort order (0 = highest priority)
   - Color (Tailwind CSS classes)
3. Or click **Seed Default Tiers** for S/A/B/C/D tiers

### Roles & Sharing (Super Admin Only)

**Managing Members:**
1. Go to **Admin** > **Members**
2. Add members by their email (they must already have a Supabase user account)
3. Members have read-only access to shared providers

**Sharing Providers:**
1. Go to **Admin** > **Sharing**
2. Toggle checkboxes to share/unshare providers with members
3. Shared providers appear in members' provider lists with a "Shared" badge

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project at [vercel.com](https://vercel.com)
3. Add environment variables:
   - Option A: Import your `.env.local` file directly via **Settings** > **Environment Variables** > **Import**
   - Option B: Add each variable manually in **Settings** > **Environment Variables**
4. Deploy

### Configure Supabase for Production

1. Go to Supabase > **Authentication** > **URL Configuration**
2. Set **Site URL** to your production domain
3. Add redirect URLs:
   - `https://yourdomain.com/**`

### Cron Jobs

The app includes a daily reminder cron job. After deploying to Vercel:

1. The `vercel.json` configures the cron to run at 8 AM UTC
2. Verify in Vercel Dashboard > **Settings** > **Cron Jobs**

## Project Structure

```
src/
├── actions/          # Server Actions
├── app/              # Next.js App Router pages
│   ├── (dashboard)/  # Authenticated routes
│   │   └── admin/    # Admin-only routes
│   └── api/          # API routes (cron jobs)
├── components/       # React components
│   ├── ui/           # Reusable UI components
│   ├── forms/        # Form components
│   ├── providers/    # Provider-related components
│   ├── tiers/        # Tier-related components
│   ├── api-keys/     # API key components
│   ├── daily-rewards/# Daily rewards components
│   └── admin/        # Admin components
├── lib/              # Utilities and Supabase clients
└── types/            # TypeScript types
```

## Security

- **API keys are encrypted at rest** using Supabase Vault
- **Row Level Security (RLS)** ensures users can only access their own data
- **Role-based access control** - Super Admin and Member roles
- **Super Admin immutability** - Cannot be changed or overtaken at database level
- **Server-side validation** on all mutations
- **Soft deletes** preserve data history
- **No public signup** - users must be created by admin

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Generate Supabase types (after schema changes)
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) for details.

This project is free and open source. You can use, modify, and distribute it however you want.
