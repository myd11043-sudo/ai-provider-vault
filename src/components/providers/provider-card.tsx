'use client';

import Link from 'next/link';
import { Server, ExternalLink, Gift, MoreVertical, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { deleteProvider } from '@/actions/providers';
import { formatDate, isToday } from '@/lib/utils';
import type { Provider, Tier } from '@/types';
import { useState } from 'react';

interface ProviderCardProps {
  provider: Provider;
  tier?: Tier | null;
}

export const ProviderCard = ({ provider, tier }: ProviderCardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this provider?')) return;
    setDeleting(true);
    await deleteProvider(provider.id);
    setDeleting(false);
  };

  const rewardClaimedToday = provider.last_reward_claimed_at
    ? isToday(provider.last_reward_claimed_at)
    : false;

  return (
    <Card className="group relative">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">
                <Link
                  href={`/providers/${provider.id}`}
                  className="hover:underline"
                >
                  {provider.name}
                </Link>
              </CardTitle>
              {tier && (
                <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${tier.color}`}>
                  {tier.name}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {provider.website_url && (
                <a
                  href={provider.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  <ExternalLink className="h-3 w-3" />
                  Website
                </a>
              )}
              {provider.recharge_url && (
                <a
                  href={provider.recharge_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  <Gift className="h-3 w-3" />
                  Recharge
                </a>
              )}
              {provider.recharge_url_2 && (
                <a
                  href={provider.recharge_url_2}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  <Gift className="h-3 w-3" />
                  Recharge 2
                </a>
              )}
            </div>
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
                  href={`/providers/${provider.id}/edit`}
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
        {provider.remarks && (
          <p className="mb-3 text-sm text-zinc-600 line-clamp-2 dark:text-zinc-400">
            {provider.remarks}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>Added {formatDate(provider.created_at)}</span>

          {provider.requires_daily_login && (
            <div
              className={`flex items-center gap-1 rounded-full px-2 py-1 ${
                rewardClaimedToday
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
              }`}
            >
              <Gift className="h-3 w-3" />
              {rewardClaimedToday ? 'Claimed' : 'Unclaimed'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
