import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getTier } from '@/actions/tiers';
import { TierForm } from '@/components/tiers/tier-form';

interface EditTierPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTierPage({ params }: EditTierPageProps) {
  const { id } = await params;
  const tier = await getTier(id);

  if (!tier) {
    notFound();
  }

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
        <h1 className="text-2xl font-bold">Edit Tier</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Update tier information
        </p>
      </div>

      <div className="max-w-2xl">
        <TierForm tier={tier} />
      </div>
    </div>
  );
}
