'use client';

import { useState, useMemo } from 'react';
import { CheckSquare, Square, Play, Pause, X } from 'lucide-react';
import { ProviderCard } from './provider-card';
import { SearchFilter } from '@/components/ui/search-filter';
import { AdvancedFilters, type FilterState } from '@/components/ui/advanced-filters';
import { Button } from '@/components/ui/button';
import { bulkUpdateProviderStatus } from '@/actions/providers';
import type { Provider, Tier } from '@/types';

type StatusFilter = 'all' | 'active' | 'inactive';
type SortOption = 'tier' | 'name-asc' | 'name-desc' | 'newest' | 'oldest';

interface ProviderListProps {
  providers: Provider[];
  tiers: Tier[];
}

export const ProviderList = ({ providers, tiers }: ProviderListProps) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [filterState, setFilterState] = useState<FilterState>({});
  const [sortBy, setSortBy] = useState<SortOption>('tier');

  // Build tier filter options
  const tierFilterOptions = useMemo(() => {
    const options = tiers.map((t) => ({
      value: t.id,
      label: t.name,
      color: t.color,
    }));
    options.unshift({ value: 'no-tier', label: 'No Tier', color: '#71717a' });
    return options;
  }, [tiers]);

  const filterConfigs = useMemo(() => [
    {
      key: 'tier',
      label: 'Tier',
      options: tierFilterOptions,
      multiple: true,
    },
    {
      key: 'dailyLogin',
      label: 'Daily Login',
      options: [
        { value: 'required', label: 'Required' },
        { value: 'not-required', label: 'Not Required' },
      ],
    },
  ], [tierFilterOptions]);

  const sortOptions = [
    { value: 'tier', label: 'Tier Order' },
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

  // Filter providers by search term, status, and advanced filters
  const searchLower = search.toLowerCase();
  const filteredProviders = providers.filter((p) => {
    // Status filter
    if (statusFilter === 'active' && !p.is_active) return false;
    if (statusFilter === 'inactive' && p.is_active) return false;

    // Tier filter
    const tierFilter = filterState.tier;
    if (tierFilter && (Array.isArray(tierFilter) ? tierFilter.length > 0 : tierFilter)) {
      const tierValues = Array.isArray(tierFilter) ? tierFilter : [tierFilter];
      const hasTier = p.tier_id && tierValues.includes(p.tier_id);
      const hasNoTier = !p.tier_id && tierValues.includes('no-tier');
      if (!hasTier && !hasNoTier) return false;
    }

    // Daily login filter
    const dailyLoginFilter = filterState.dailyLogin;
    if (dailyLoginFilter) {
      if (dailyLoginFilter === 'required' && !p.requires_daily_login) return false;
      if (dailyLoginFilter === 'not-required' && p.requires_daily_login) return false;
    }

    // Search filter
    const tier = p.tier_id ? tierMap.get(p.tier_id) : null;
    return (
      p.name.toLowerCase().includes(searchLower) ||
      tier?.name.toLowerCase().includes(searchLower) ||
      p.remarks?.toLowerCase().includes(searchLower)
    );
  });

  // Sort providers based on sortBy option
  const sortedProviders = [...filteredProviders].sort((a, b) => {
    // Active providers come first (when showing all)
    if (statusFilter === 'all') {
      if (a.is_active !== b.is_active) {
        return a.is_active ? -1 : 1;
      }
    }

    switch (sortBy) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'tier':
      default: {
        const tierA = a.tier_id ? tierMap.get(a.tier_id) : null;
        const tierB = b.tier_id ? tierMap.get(b.tier_id) : null;
        const orderA = tierA?.sort_order ?? 999;
        const orderB = tierB?.sort_order ?? 999;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
      }
    }
  });

  // Count active and inactive providers
  const activeCount = providers.filter((p) => p.is_active).length;
  const inactiveCount = providers.length - activeCount;

  const handleSelectChange = (id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === sortedProviders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedProviders.map((p) => p.id)));
    }
  };

  const handleBulkStatusUpdate = async (isActive: boolean) => {
    if (selectedIds.size === 0) return;
    setBulkUpdating(true);
    await bulkUpdateProviderStatus(Array.from(selectedIds), isActive);
    setSelectedIds(new Set());
    setSelectMode(false);
    setBulkUpdating(false);
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchFilter
            value={search}
            onChange={setSearch}
            placeholder="Search providers by name, tier, or remarks..."
          />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectMode ? exitSelectMode() : setSelectMode(true)}
            >
              {selectMode ? (
                <>
                  <X className="mr-1 h-4 w-4" />
                  Cancel
                </>
              ) : (
                <>
                  <CheckSquare className="mr-1 h-4 w-4" />
                  Select
                </>
              )}
            </Button>
            <div className="flex items-center gap-1 rounded-lg border border-zinc-200 p-1 dark:border-zinc-800">
              <button
                onClick={() => setStatusFilter('all')}
                className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                }`}
              >
                All ({providers.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  statusFilter === 'active'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                }`}
              >
                Active ({activeCount})
              </button>
              <button
                onClick={() => setStatusFilter('inactive')}
                className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  statusFilter === 'inactive'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                }`}
              >
                Inactive ({inactiveCount})
              </button>
            </div>
          </div>
        </div>
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

      {/* Bulk actions bar */}
      {selectMode && (
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {selectedIds.size === sortedProviders.length ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              {selectedIds.size === sortedProviders.length ? 'Deselect all' : 'Select all'}
            </button>
            <span className="text-sm text-zinc-500">
              {selectedIds.size} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={selectedIds.size === 0 || bulkUpdating}
              onClick={() => handleBulkStatusUpdate(true)}
            >
              <Play className="mr-1 h-4 w-4" />
              {bulkUpdating ? 'Updating...' : 'Set Active'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={selectedIds.size === 0 || bulkUpdating}
              onClick={() => handleBulkStatusUpdate(false)}
            >
              <Pause className="mr-1 h-4 w-4" />
              {bulkUpdating ? 'Updating...' : 'Set Inactive'}
            </Button>
          </div>
        </div>
      )}

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
              selectable={selectMode}
              selected={selectedIds.has(provider.id)}
              onSelectChange={(selected) => handleSelectChange(provider.id, selected)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
