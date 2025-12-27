import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getProviders } from '@/actions/providers';
import { getTiers } from '@/actions/tiers';
import { Button } from '@/components/ui/button';
import { ProviderList } from '@/components/providers/provider-list';

export default async function ProvidersPage() {
  const [providers, tiers] = await Promise.all([
    getProviders(),
    getTiers(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Providers</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Manage your AI provider accounts and API keys
          </p>
        </div>
        <Button asChild>
          <Link href="/providers/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Provider
          </Link>
        </Button>
      </div>

      <ProviderList providers={providers} tiers={tiers} />
    </div>
  );
}
