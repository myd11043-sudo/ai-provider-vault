'use client';

import Link from 'next/link';
import { Edit, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { deleteTier } from '@/actions/tiers';
import type { Tier } from '@/types/supabase';
import { useState } from 'react';

interface TierCardProps {
  tier: Tier;
}

export const TierCard = ({ tier }: TierCardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this tier?')) return;
    setDeleting(true);
    setError(null);
    const result = await deleteTier(tier.id);
    if (!result.success) {
      setError(result.error || 'Failed to delete');
    }
    setDeleting(false);
  };

  return (
    <Card className="group relative">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold"
            style={{ backgroundColor: tier.color, color: tier.text_color }}
          >
            {tier.name}
          </div>
          <div>
            <CardTitle className="text-base">
              <Link href={`/tiers/${tier.id}/edit`} className="hover:underline">
                {tier.label}
              </Link>
            </CardTitle>
            <p className="text-xs text-zinc-500">Sort order: {tier.sort_order}</p>
          </div>
        </div>

        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-8 z-20 w-36 rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
                <Link
                  href={`/tiers/${tier.id}/edit`}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  onClick={() => setShowMenu(false)}
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <p className="mb-2 text-sm text-red-600">{error}</p>
        )}
        {tier.description && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {tier.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
