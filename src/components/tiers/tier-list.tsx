'use client';

import { useState } from 'react';
import { TierCard } from './tier-card';
import { SearchFilter } from '@/components/ui/search-filter';
import type { Tier } from '@/types/supabase';

interface TierListProps {
  tiers: Tier[];
}

export const TierList = ({ tiers }: TierListProps) => {
  const [search, setSearch] = useState('');

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

  return (
    <div className="space-y-4">
      <SearchFilter
        value={search}
        onChange={setSearch}
        placeholder="Search tiers by name or description..."
      />

      {filteredTiers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="text-zinc-500 dark:text-zinc-400">
            No tiers match &quot;{search}&quot;
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTiers.map((tier) => (
            <TierCard key={tier.id} tier={tier} />
          ))}
        </div>
      )}
    </div>
  );
};
