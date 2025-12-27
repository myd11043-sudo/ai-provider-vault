'use client';

import { useState } from 'react';
import { RewardItem } from './reward-item';
import { SearchFilter } from '@/components/ui/search-filter';
import type { ProviderWithTier } from '@/actions/providers';

interface RewardTrackerProps {
  providers: ProviderWithTier[];
}

export const RewardTracker = ({ providers }: RewardTrackerProps) => {
  const [search, setSearch] = useState('');

  if (providers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
        <p className="text-zinc-500 dark:text-zinc-400">
          No providers require daily login.
          Enable &quot;Requires daily login&quot; on a provider to track rewards here.
        </p>
      </div>
    );
  }

  // Filter by provider name or tier
  const searchLower = search.toLowerCase();
  const filteredProviders = providers.filter((p) =>
    p.name.toLowerCase().includes(searchLower) ||
    p.tier?.name.toLowerCase().includes(searchLower)
  );

  return (
    <div className="space-y-4">
      <SearchFilter
        value={search}
        onChange={setSearch}
        placeholder="Search by provider name or tier..."
      />

      {filteredProviders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="text-zinc-500 dark:text-zinc-400">
            No rewards match &quot;{search}&quot;
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProviders.map((provider) => (
            <RewardItem key={provider.id} provider={provider} />
          ))}
        </div>
      )}
    </div>
  );
};
