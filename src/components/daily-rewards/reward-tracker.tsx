'use client';

import { useState, useMemo } from 'react';
import { RewardItem } from './reward-item';
import { SearchFilter } from '@/components/ui/search-filter';
import { AdvancedFilters, type FilterState } from '@/components/ui/advanced-filters';
import { isToday } from '@/lib/utils';
import type { ProviderWithTier } from '@/actions/providers';

type SortOption = 'tier' | 'name-asc' | 'name-desc' | 'unclaimed-first' | 'claimed-first';

interface RewardTrackerProps {
  providers: ProviderWithTier[];
}

export const RewardTracker = ({ providers }: RewardTrackerProps) => {
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState<FilterState>({});
  const [sortBy, setSortBy] = useState<SortOption>('unclaimed-first');

  // Build tier filter options
  const tierFilterOptions = useMemo(() => {
    const uniqueTiers = new Map<string, { name: string; color: string }>();
    providers.forEach((p) => {
      if (p.tier && !uniqueTiers.has(p.tier.id)) {
        uniqueTiers.set(p.tier.id, { name: p.tier.name, color: p.tier.color });
      }
    });
    const options = Array.from(uniqueTiers.entries()).map(([id, { name, color }]) => ({
      value: id,
      label: name,
      color,
    })).sort((a, b) => a.label.localeCompare(b.label));
    options.unshift({ value: 'no-tier', label: 'No Tier', color: '#71717a' });
    return options;
  }, [providers]);

  const filterConfigs = useMemo(() => [
    {
      key: 'tier',
      label: 'Tier',
      options: tierFilterOptions,
      multiple: true,
    },
    {
      key: 'claimStatus',
      label: 'Status',
      options: [
        { value: 'unclaimed', label: 'Unclaimed' },
        { value: 'claimed', label: 'Claimed' },
      ],
    },
  ], [tierFilterOptions]);

  const sortOptions = [
    { value: 'unclaimed-first', label: 'Unclaimed First' },
    { value: 'claimed-first', label: 'Claimed First' },
    { value: 'tier', label: 'Tier Order' },
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
  ];

  const handleFilterChange = (key: string, value: string | string[]) => {
    setFilterState((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilterState({});
  };

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

  // Helper to check if reward is claimed today
  const isClaimedToday = (p: ProviderWithTier) =>
    p.last_reward_claimed_at && isToday(p.last_reward_claimed_at);

  // Filter by search, tier, and claim status
  const searchLower = search.toLowerCase();
  const filteredProviders = providers.filter((p) => {
    // Tier filter
    const tierFilter = filterState.tier;
    if (tierFilter && (Array.isArray(tierFilter) ? tierFilter.length > 0 : tierFilter)) {
      const tierValues = Array.isArray(tierFilter) ? tierFilter : [tierFilter];
      const hasTier = p.tier && tierValues.includes(p.tier.id);
      const hasNoTier = !p.tier && tierValues.includes('no-tier');
      if (!hasTier && !hasNoTier) return false;
    }

    // Claim status filter
    const claimStatusFilter = filterState.claimStatus;
    if (claimStatusFilter) {
      const claimed = isClaimedToday(p);
      if (claimStatusFilter === 'claimed' && !claimed) return false;
      if (claimStatusFilter === 'unclaimed' && claimed) return false;
    }

    // Search filter
    return (
      p.name.toLowerCase().includes(searchLower) ||
      p.tier?.name.toLowerCase().includes(searchLower)
    );
  });

  // Sort providers
  const sortedProviders = [...filteredProviders].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'claimed-first': {
        const aClaimedToday = isClaimedToday(a);
        const bClaimedToday = isClaimedToday(b);
        if (aClaimedToday !== bClaimedToday) return aClaimedToday ? -1 : 1;
        const aTierOrder = a.tier?.sort_order ?? Number.MAX_SAFE_INTEGER;
        const bTierOrder = b.tier?.sort_order ?? Number.MAX_SAFE_INTEGER;
        return aTierOrder - bTierOrder;
      }
      case 'unclaimed-first': {
        const aClaimedToday = isClaimedToday(a);
        const bClaimedToday = isClaimedToday(b);
        if (aClaimedToday !== bClaimedToday) return aClaimedToday ? 1 : -1;
        const aTierOrder = a.tier?.sort_order ?? Number.MAX_SAFE_INTEGER;
        const bTierOrder = b.tier?.sort_order ?? Number.MAX_SAFE_INTEGER;
        return aTierOrder - bTierOrder;
      }
      case 'tier':
      default: {
        const aTierOrder = a.tier?.sort_order ?? Number.MAX_SAFE_INTEGER;
        const bTierOrder = b.tier?.sort_order ?? Number.MAX_SAFE_INTEGER;
        if (aTierOrder !== bTierOrder) return aTierOrder - bTierOrder;
        return a.name.localeCompare(b.name);
      }
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <SearchFilter
          value={search}
          onChange={setSearch}
          placeholder="Search by provider name or tier..."
        />
        <AdvancedFilters
          filters={filterConfigs}
          sortOptions={sortOptions}
          filterState={filterState}
          sortValue={sortBy}
          onFilterChange={handleFilterChange}
          onSortChange={(value) => setSortBy(value as SortOption)}
          onClearFilters={handleClearFilters}
        />
      </div>

      {sortedProviders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="text-zinc-500 dark:text-zinc-400">
            No rewards match your filters
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedProviders.map((provider) => (
            <RewardItem key={provider.id} provider={provider} />
          ))}
        </div>
      )}
    </div>
  );
};
