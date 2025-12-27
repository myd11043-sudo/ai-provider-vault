'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { ApiKeyCard } from './api-key-card';
import { ApiKeyForm } from '@/components/forms/api-key-form';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { ApiKey } from '@/types';

interface ApiKeyListProps {
  apiKeys: ApiKey[];
  providerId: string;
}

export const ApiKeyList = ({ apiKeys, providerId }: ApiKeyListProps) => {
  const searchParams = useSearchParams();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (searchParams.get('addKey') === 'true') {
      setShowForm(true);
    }
  }, [searchParams]);

  if (apiKeys.length === 0 && !showForm) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No API keys stored yet.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setShowForm(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add your first key
          </Button>
        </div>
        <ApiKeyForm
          providerId={providerId}
          open={showForm}
          onOpenChange={setShowForm}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {apiKeys.map((key) => (
        <ApiKeyCard key={key.id} apiKey={key} />
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowForm(true)}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add another key
      </Button>

      <ApiKeyForm
        providerId={providerId}
        open={showForm}
        onOpenChange={setShowForm}
      />
    </div>
  );
};
