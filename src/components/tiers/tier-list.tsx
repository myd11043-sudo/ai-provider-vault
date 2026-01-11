'use client';

import { useState } from 'react';
import { TierCard } from './tier-card';
import { SearchFilter } from '@/components/ui/search-filter';
import { AdvancedFilters, type FilterState } from '@/components/ui/advanced-filters';
import type { Tier } from '@/types/supabase';

type SortOption = 'order' | 'name-asc' | 'name-desc' | 'newest' | 'oldest';

interface TierListProps {
  tiers: Tier[];
}

export const TierList = ({ tiers }: TierListProps) => {
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState<FilterState>({});
  const [sortBy, setSortBy] = useState<SortOption>('order');

  const sortOptions = [
    { value: 'order', label: 'Sort Order' },
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
  ];

  const handleFilterChange = (key: string, value: string | string[]) => {
    setFilterState((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilterState({});
  };

  if (tiers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No tiers yet. Create your first tier or seed default tiers.
        </p>
      </div>
    );
  }

  // Filter tiers by search term
  const searchLower = search.toLowerCase();
  const filteredTiers = tiers.filter((t) =>
    t.name.toLowerCase().includes(searchLower) ||
    t.label.toLowerCase().includes(searchLower) ||
    t.description?.toLowerCase().includes(searchLower)
  );

  // Sort tiers
  const sortedTiers = [...filteredTiers].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'order':
      default:
        return a.sort_order - b.sort_order;
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <SearchFilter
          value={search}
          onChange={setSearch}
          placeholder="Search tiers by name or description..."
        />
        <AdvancedFilters
          filters={[]}
          sortOptions={sortOptions}
          filterState={filterState}
          sortValue={sortBy}
          onFilterChange={handleFilterChange}
          onSortChange={(value) => setSortBy(value as SortOption)}
          onClearFilters={handleClearFilters}
        />
      </div>

      {sortedTiers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="text-zinc-500 dark:text-zinc-400">
            No tiers match &quot;{search}&quot;
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedTiers.map((tier) => (
            <TierCard key={tier.id} tier={tier} />
          ))}
        </div>
      )}
    </div>
  );
};
