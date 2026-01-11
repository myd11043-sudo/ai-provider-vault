import Link from 'next/link';
import { KeyRound, Shield, Clock, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getUser } from '@/actions/auth';

export default async function HomePage() {
  const user = await getUser();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-6 w-6" />
            <span className="text-lg font-bold">Provider Vault</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Button asChild>
                <Link href="/providers">Dashboard</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/login">Sign in</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Secure API Key Management
          <br />
          <span className="text-zinc-500 dark:text-zinc-400">
            for AI Providers
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
          Store, manage, and organize your API keys from OpenAI, Anthropic, Google AI,
          and other providers. All encrypted at rest with Supabase Vault.
        </p>
        {!user && (
          <div className="mt-10">
            <Button size="lg" asChild>
              <Link href="/login">Get Started</Link>
            </Button>
          </div>
        )}
      </section>

      {/* Features */}
      <section className="border-t border-zinc-200 bg-white py-24 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold">Features</h2>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">Encrypted Storage</h3>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                API keys are encrypted at rest using Supabase Vault. Your secrets stay secret.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                <Key className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">Multi-Provider</h3>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                Organize keys by provider with labels, notes, and website links.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">Daily Rewards</h3>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                Track daily login rewards and never miss free credits again.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-8 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-zinc-500">
          Provider Vault - Secure API Key Management
        </div>
      </footer>
    </div>
  );
}
