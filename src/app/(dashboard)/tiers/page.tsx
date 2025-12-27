import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getTiers } from '@/actions/tiers';
import { Button } from '@/components/ui/button';
import { TierList } from '@/components/tiers/tier-list';
import { SeedTiersButton } from '@/components/tiers/seed-tiers-button';

export default async function TiersPage() {
  const tiers = await getTiers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tiers</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Manage your provider tier rankings
          </p>
        </div>
        <div className="flex gap-3">
          {tiers.length === 0 && <SeedTiersButton />}
          <Button asChild>
            <Link href="/tiers/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Tier
            </Link>
          </Button>
        </div>
      </div>

      <TierList tiers={tiers} />
    </div>
  );
}
