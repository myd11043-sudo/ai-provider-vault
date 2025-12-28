'use client';

import { useState } from 'react';
import { ProviderCard } from './provider-card';
import { SearchFilter } from '@/components/ui/search-filter';
import type { Provider, Tier } from '@/types';

interface ProviderListProps {
  providers: Provider[];
  tiers: Tier[];
  sharedProviderIds?: string[];
}

export const ProviderList = ({ providers, tiers, sharedProviderIds = [] }: ProviderListProps) => {
  const [search, setSearch] = useState('');
  const sharedSet = new Set(sharedProviderIds);

  if (providers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
        <p className="text-zinc-500 dark:text-zinc-400">
          No providers yet. Add your first provider to get started.
        </p>
      </div>
    );
  }

  // Create a map for quick tier lookup
  const tierMap = new Map(tiers.map((t) => [t.id, t]));

  // Filter providers by search term
  const searchLower = search.toLowerCase();
  const filteredProviders = providers.filter((p) => {
    const tier = p.tier_id ? tierMap.get(p.tier_id) : null;
    return (
      p.name.toLowerCase().includes(searchLower) ||
      tier?.name.toLowerCase().includes(searchLower) ||
      p.remarks?.toLowerCase().includes(searchLower)
    );
  });

  // Sort providers by tier sort_order, then by name
  const sortedProviders = [...filteredProviders].sort((a, b) => {
    const tierA = a.tier_id ? tierMap.get(a.tier_id) : null;
    const tierB = b.tier_id ? tierMap.get(b.tier_id) : null;
    const orderA = tierA?.sort_order ?? 999;
    const orderB = tierB?.sort_order ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-4">
      <SearchFilter
        value={search}
        onChange={setSearch}
        placeholder="Search providers by name, tier, or remarks..."
      />

      {sortedProviders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="text-zinc-500 dark:text-zinc-400">
            No providers match &quot;{search}&quot;
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedProviders.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              tier={provider.tier_id ? tierMap.get(provider.tier_id) : null}
              isReadOnly={sharedSet.has(provider.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
