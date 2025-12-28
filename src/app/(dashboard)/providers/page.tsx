import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getProviders } from '@/actions/providers';
import { getTiers } from '@/actions/tiers';
import { getCurrentUserRole, getSharedProviders } from '@/actions/roles';
import { Button } from '@/components/ui/button';
import { ProviderList } from '@/components/providers/provider-list';

export default async function ProvidersPage() {
  const [providers, tiers, role, sharedProviders] = await Promise.all([
    getProviders(),
    getTiers(),
    getCurrentUserRole(),
    getSharedProviders(),
  ]);

  const isSuperAdmin = role === 'super_admin';
  const sharedProviderIds = sharedProviders.map(sp => sp.provider_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Providers</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {isSuperAdmin
              ? 'Manage your AI provider accounts and API keys'
              : 'View shared AI provider accounts and API keys'}
          </p>
        </div>
        {isSuperAdmin && (
          <Button asChild>
            <Link href="/providers/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Provider
            </Link>
          </Button>
        )}
      </div>

      <ProviderList
        providers={providers}
        tiers={tiers}
        sharedProviderIds={sharedProviderIds}
      />
    </div>
  );
}
