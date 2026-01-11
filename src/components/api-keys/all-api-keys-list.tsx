'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ApiKeyCard } from './api-key-card';
import { SearchFilter } from '@/components/ui/search-filter';
import { AdvancedFilters, type FilterState } from '@/components/ui/advanced-filters';
import type { ApiKeyWithProvider } from '@/actions/api-keys';

type SortOption = 'newest' | 'oldest' | 'provider-asc' | 'provider-desc' | 'label-asc' | 'label-desc';

interface AllApiKeysListProps {
  apiKeys: ApiKeyWithProvider[];
}

export const AllApiKeysList = ({ apiKeys }: AllApiKeysListProps) => {
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState<FilterState>({});
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Build provider filter options
  const providerFilterOptions = useMemo(() => {
    const uniqueProviders = new Map<string, string>();
    apiKeys.forEach((key) => {
      if (!uniqueProviders.has(key.provider_id)) {
        uniqueProviders.set(key.provider_id, key.provider_name);
      }
    });
    return Array.from(uniqueProviders.entries()).map(([id, name]) => ({
      value: id,
      label: name,
    })).sort((a, b) => a.label.localeCompare(b.label));
  }, [apiKeys]);

  // Build tier filter options
  const tierFilterOptions = useMemo(() => {
    const uniqueTiers = new Map<string, { name: string; color: string }>();
    apiKeys.forEach((key) => {
      if (key.tier_id && key.tier_name && !uniqueTiers.has(key.tier_id)) {
        uniqueTiers.set(key.tier_id, { name: key.tier_name, color: key.tier_color || '#71717a' });
      }
    });
    const options = Array.from(uniqueTiers.entries()).map(([id, { name, color }]) => ({
      value: id,
      label: name,
      color,
    })).sort((a, b) => a.label.localeCompare(b.label));
    options.unshift({ value: 'no-tier', label: 'No Tier', color: '#71717a' });
    return options;
  }, [apiKeys]);

  const filterConfigs = useMemo(() => [
    {
      key: 'provider',
      label: 'Provider',
      options: providerFilterOptions,
      multiple: true,
    },
    {
      key: 'tier',
      label: 'Tier',
      options: tierFilterOptions,
      multiple: true,
    },
  ], [providerFilterOptions, tierFilterOptions]);

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'provider-asc', label: 'Provider (A-Z)' },
    { value: 'provider-desc', label: 'Provider (Z-A)' },
    { value: 'label-asc', label: 'Label (A-Z)' },
    { value: 'label-desc', label: 'Label (Z-A)' },
  ];

  const handleFilterChange = (key: string, value: string | string[]) => {
    setFilterState((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilterState({});
  };

  if (apiKeys.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
        <p className="text-zinc-500 dark:text-zinc-400">
          No API keys stored yet.{' '}
          <Link href="/providers" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">
            Add a provider
          </Link>{' '}
          to get started.
        </p>
      </div>
    );
  }

  // Filter by search, provider, and tier
  const searchLower = search.toLowerCase();
  const filteredKeys = apiKeys.filter((key) => {
    // Provider filter
    const providerFilter = filterState.provider;
    if (providerFilter && (Array.isArray(providerFilter) ? providerFilter.length > 0 : providerFilter)) {
      const providerValues = Array.isArray(providerFilter) ? providerFilter : [providerFilter];
      if (!providerValues.includes(key.provider_id)) return false;
    }

    // Tier filter
    const tierFilter = filterState.tier;
    if (tierFilter && (Array.isArray(tierFilter) ? tierFilter.length > 0 : tierFilter)) {
      const tierValues = Array.isArray(tierFilter) ? tierFilter : [tierFilter];
      const hasTier = key.tier_id && tierValues.includes(key.tier_id);
      const hasNoTier = !key.tier_id && tierValues.includes('no-tier');
      if (!hasTier && !hasNoTier) return false;
    }

    // Search filter
    return (
      key.provider_name.toLowerCase().includes(searchLower) ||
      key.label.toLowerCase().includes(searchLower) ||
      key.tier_name?.toLowerCase().includes(searchLower)
    );
  });

  // Sort keys
  const sortedKeys = [...filteredKeys].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'provider-asc':
        return a.provider_name.localeCompare(b.provider_name);
      case 'provider-desc':
        return b.provider_name.localeCompare(a.provider_name);
      case 'label-asc':
        return a.label.localeCompare(b.label);
      case 'label-desc':
        return b.label.localeCompare(a.label);
      case 'newest':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <SearchFilter
          value={search}
          onChange={setSearch}
          placeholder="Search by provider name, label, or tier..."
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

      {sortedKeys.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="text-zinc-500 dark:text-zinc-400">
            No API keys match your filters
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedKeys.map((key) => (
            <ApiKeyCard
              key={key.id}
              apiKey={key}
              showProvider
              providerName={key.provider_name}
            />
          ))}
        </div>
      )}
    </div>
  );
};
