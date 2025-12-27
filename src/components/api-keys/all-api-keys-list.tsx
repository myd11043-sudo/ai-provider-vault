'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ApiKeyCard } from './api-key-card';
import { SearchFilter } from '@/components/ui/search-filter';
import type { ApiKey } from '@/types';

interface ApiKeyWithProvider extends ApiKey {
  provider_name?: string;
}

interface AllApiKeysListProps {
  apiKeys: ApiKeyWithProvider[];
}

export const AllApiKeysList = ({ apiKeys }: AllApiKeysListProps) => {
  const [search, setSearch] = useState('');

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

  // Filter by provider name or label
  const searchLower = search.toLowerCase();
  const filteredKeys = apiKeys.filter((key) =>
    key.provider_name?.toLowerCase().includes(searchLower) ||
    key.label.toLowerCase().includes(searchLower)
  );

  return (
    <div className="space-y-4">
      <SearchFilter
        value={search}
        onChange={setSearch}
        placeholder="Search by provider name or label..."
      />

      {filteredKeys.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="text-zinc-500 dark:text-zinc-400">
            No API keys match &quot;{search}&quot;
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredKeys.map((key) => (
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
