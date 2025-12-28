'use client';

import { useState } from 'react';
import { Check, X, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { shareProvider, unshareProvider } from '@/actions/roles';

interface SharingManagerProps {
  providers: { id: string; name: string; sharedWith: string[] }[];
  members: { id: string; email: string }[];
}

export const SharingManager = ({ providers, members }: SharingManagerProps) => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleToggleShare = async (
    providerId: string,
    memberId: string,
    isShared: boolean
  ) => {
    const key = `${providerId}-${memberId}`;
    setLoading(key);

    if (isShared) {
      await unshareProvider(providerId, memberId);
    } else {
      await shareProvider(providerId, memberId);
    }

    setLoading(null);
  };

  if (members.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
        <p className="text-zinc-500 dark:text-zinc-400">
          No members to share with. Add members first in the Members page.
        </p>
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
        <p className="text-zinc-500 dark:text-zinc-400">
          No providers to share. Create providers first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
              <th className="p-3 text-left text-sm font-medium">Provider</th>
              {members.map((member) => (
                <th
                  key={member.id}
                  className="p-3 text-center text-sm font-medium"
                >
                  <span className="block max-w-[120px] truncate" title={member.email}>
                    {member.email}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {providers.map((provider) => (
              <tr
                key={provider.id}
                className="border-b border-zinc-200 last:border-0 dark:border-zinc-800"
              >
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-zinc-400" />
                    <span className="font-medium">{provider.name}</span>
                  </div>
                </td>
                {members.map((member) => {
                  const isShared = provider.sharedWith.includes(member.id);
                  const key = `${provider.id}-${member.id}`;
                  const isLoading = loading === key;

                  return (
                    <td key={member.id} className="p-3 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleToggleShare(provider.id, member.id, isShared)
                        }
                        disabled={isLoading}
                        className={
                          isShared
                            ? 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                            : 'text-zinc-400 hover:text-zinc-600'
                        }
                      >
                        {isLoading ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
                        ) : isShared ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-4 text-sm text-zinc-500">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-green-100 dark:bg-green-900/30">
            <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
          </div>
          <span>Shared (member can view)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-zinc-100 dark:bg-zinc-800">
            <X className="h-3 w-3 text-zinc-400" />
          </div>
          <span>Not shared</span>
        </div>
      </div>
    </div>
  );
};
