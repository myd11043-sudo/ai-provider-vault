'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { seedDefaultTiers } from '@/actions/tiers';

export const SeedTiersButton = () => {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSeed = async () => {
    setPending(true);
    setError(null);
    const result = await seedDefaultTiers();
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error || 'Failed to seed tiers');
    }
    setPending(false);
  };

  return (
    <div>
      <Button variant="outline" onClick={handleSeed} disabled={pending}>
        <Sparkles className="mr-2 h-4 w-4" />
        {pending ? 'Creating...' : 'Seed Default Tiers'}
      </Button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
};
