'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import { initializeSuperAdmin } from '@/actions/roles';

export const InitRoleButton = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInit = async () => {
    setLoading(true);
    setError(null);

    const result = await initializeSuperAdmin();

    if (!result.success) {
      setError(result.error || 'Failed to initialize');
    }

    setLoading(false);

    if (result.success) {
      window.location.reload();
    }
  };

  return (
    <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
          <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">Become Super Admin</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            As the first user, you can initialize yourself as the Super Admin.
            This gives you full control over the vault and member management.
          </p>
        </div>
        <Button onClick={handleInit} disabled={loading}>
          {loading ? 'Initializing...' : 'Initialize as Super Admin'}
        </Button>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};
