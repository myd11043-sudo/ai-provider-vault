import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { TierForm } from '@/components/tiers/tier-form';

export default function NewTierPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/tiers"
          className="mb-4 inline-flex items-center text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tiers
        </Link>
        <h1 className="text-2xl font-bold">New Tier</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Create a new tier for ranking providers
        </p>
      </div>

      <div className="max-w-2xl">
        <TierForm />
      </div>
    </div>
  );
}
