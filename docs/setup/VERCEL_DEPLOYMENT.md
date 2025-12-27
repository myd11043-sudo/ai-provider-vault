# Vercel Deployment Guide for Provider Vault

This guide walks you through deploying the Provider Vault application to Vercel.

## Prerequisites

- Git repository pushed to GitHub/GitLab/Bitbucket
- Supabase project set up (see [`SUPABASE_SETUP.md`](../setup/SUPABASE_SETUP.md))
- Vercel account (free tier works)

---

## Step 1: Import Project to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Select your Git provider (GitHub, GitLab, Bitbucket)
4. Find and select your `ai_provider_vault` repository
5. Click **"Import"**

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Run from your project directory
vercel

# Follow the prompts to link your project
```

---

## Step 2: Configure Environment Variables

Before deploying, you need to add environment variables in Vercel:

1. In your project dashboard, go to **Settings** → **Environment Variables**
2. Add the following variables:

| Name                            | Value                              | Environment |
| ------------------------------- | ---------------------------------- | ----------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | `https://<project-id>.supabase.co` | All         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Publishable key               | All         |
| `SUPABASE_SERVICE_ROLE_KEY`     | Your Secret key                    | All         |
| `CRON_SECRET`                   | Random 32+ character string        | All         |

### Generate CRON_SECRET

Use one of these methods:

```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Or use a password manager like 1Password
```

### Environment Scopes

- **Production**: Used for your main domain
- **Preview**: Used for PR preview deployments
- **Development**: Used when running `vercel dev` locally

> **Tip**: For most variables, select all three environments.

---

## Step 3: Configure Project Settings

Vercel auto-detects Next.js, but verify these settings:

1. Go to **Settings** → **General**
2. Confirm:
   - **Framework Preset**: Next.js
   - **Build Command**: `next build` (or leave default)
   - **Output Directory**: `.next` (or leave default)
   - **Install Command**: `npm install` (or leave default)

---

## Step 4: Deploy

### Initial Deployment

1. Click **"Deploy"** in your project dashboard
2. Wait for the build to complete (~2-3 minutes)
3. Once deployed, you'll get a URL like `your-project.vercel.app`

### Automatic Deployments

After initial setup:

- **Production**: Pushes to `main` branch auto-deploy
- **Preview**: Pull requests get preview URLs automatically

---

## Step 5: Configure Cron Jobs

Your `vercel.json` is already configured for the daily reward reminder:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-reward-reminder",
      "schedule": "0 8 * * *"
    }
  ]
}
```

This runs daily at 8:00 AM UTC.

### Verify Cron Job Setup

1. Go to **Settings** → **Cron Jobs** in your Vercel dashboard
2. You should see your cron job listed
3. You can manually trigger it with **"Run"** to test

### How Cron Security Works

Your cron endpoint already verifies requests:

```typescript
// Vercel sends: Authorization: Bearer <CRON_SECRET>
const authHeader = request.headers.get("authorization");
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

---

## Step 6: Configure Domain (Optional)

### Add Custom Domain

1. Go to **Settings** → **Domains**
2. Enter your domain (e.g., `vault.yourdomain.com`)
3. Follow the DNS configuration instructions

### Update Supabase Settings

After adding a custom domain, update Supabase:

1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. Update **Site URL** to your production domain
3. Add your domain to **Redirect URLs**:
   - `https://yourdomain.com/**`

---

## Step 7: Verify Deployment

### Test the Application

1. Open your Vercel deployment URL
2. Create an admin user in Supabase Dashboard (see [`SUPABASE_SETUP.md`](../setup/SUPABASE_SETUP.md))
3. Sign in with your admin credentials
4. Add a provider and API key
5. Verify everything works

### Check Cron Job

1. Go to Vercel Dashboard → **Settings** → **Cron Jobs**
2. Click **"Run"** to trigger manually
3. Click **"View Log"** to check execution

---

## Common Cron Schedules

| Schedule          | Cron Expression | Description                   |
| ----------------- | --------------- | ----------------------------- |
| Every hour        | `0 * * * *`     | At minute 0                   |
| Every 6 hours     | `0 */6 * * *`   | At 00:00, 06:00, 12:00, 18:00 |
| Daily at 8 AM     | `0 8 * * *`     | 8:00 AM UTC                   |
| Daily at midnight | `0 0 * * *`     | 00:00 UTC                     |
| Weekdays at 9 AM  | `0 9 * * 1-5`   | Mon-Fri at 9 AM UTC           |

> **Note**: All cron jobs run in **UTC timezone**.

---

## Troubleshooting

### Build Fails

1. Check **Deployments** → Click failed deployment → **View Build Logs**
2. Common issues:
   - Missing environment variables
   - TypeScript errors
   - Missing dependencies

### Environment Variables Not Working

1. Verify variables are set for correct environment (Production/Preview)
2. Redeploy after adding new variables
3. Check for typos in variable names

### Cron Job Not Running

1. Verify `CRON_SECRET` is set in environment variables
2. Check cron job is listed in Settings → Cron Jobs
3. Manually trigger and check logs for errors

### Authentication Issues

1. Verify Supabase URL and keys are correct
2. Check Supabase Authentication → URL Configuration
3. Ensure redirect URLs include your Vercel domain

---

## Useful Vercel CLI Commands

```bash
# Pull environment variables locally
vercel env pull .env.local

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View deployment logs
vercel logs <deployment-url>

# List all deployments
vercel ls
```

---

## Production Checklist

Before going live:

- [ ] All environment variables set in Vercel
- [ ] Custom domain configured (optional)
- [ ] Supabase Site URL and Redirect URLs updated
- [ ] Admin user created in Supabase Dashboard
- [ ] Cron job verified working
- [ ] SSL certificate active (automatic with Vercel)
- [ ] Test full user flow (login, add provider, add key)

---

## Resources

- [Vercel Next.js Documentation](https://vercel.com/docs/frameworks/nextjs)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
