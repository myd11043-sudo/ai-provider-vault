'use client';

import { useState, Fragment } from 'react';
import { Check, X, Key, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { shareApiKey, unshareApiKey } from '@/actions/roles';
import type { ApiKeyWithProvider } from '@/actions/roles';

interface SharingManagerProps {
  providers: {
    id: string;
    name: string;
    apiKeys: ApiKeyWithProvider[];
  }[];
  members: { id: string; email: string }[];
}

export const SharingManager = ({ providers, members }: SharingManagerProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(
    new Set(providers.map(p => p.id))
  );

  const toggleProvider = (providerId: string) => {
    setExpandedProviders(prev => {
      const next = new Set(prev);
      if (next.has(providerId)) {
        next.delete(providerId);
      } else {
        next.add(providerId);
      }
      return next;
    });
  };

  const handleToggleShare = async (
    apiKeyId: string,
    memberId: string,
    isShared: boolean
  ) => {
    const key = `${apiKeyId}-${memberId}`;
    setLoading(key);

    if (isShared) {
      await unshareApiKey(apiKeyId, memberId);
    } else {
      await shareApiKey(apiKeyId, memberId);
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
          No providers with API keys to share. Create providers and add API keys first.
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
              <th className="p-3 text-left text-sm font-medium">Provider / API Key</th>
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
              <Fragment key={provider.id}>
                {/* Provider row (collapsible header) */}
                <tr className="border-b border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <td colSpan={members.length + 1} className="p-0">
                    <button
                      onClick={() => toggleProvider(provider.id)}
                      className="flex w-full items-center gap-2 p-3 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      {expandedProviders.has(provider.id) ? (
                        <ChevronDown className="h-4 w-4 text-zinc-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-zinc-400" />
                      )}
                      <span className="font-semibold">{provider.name}</span>
                      <span className="text-xs text-zinc-500">
                        ({provider.apiKeys.length} key{provider.apiKeys.length !== 1 ? 's' : ''})
                      </span>
                    </button>
                  </td>
                </tr>
                {/* API key rows */}
                {expandedProviders.has(provider.id) &&
                  provider.apiKeys.map((apiKey) => (
                    <tr
                      key={apiKey.id}
                      className="border-b border-zinc-200 last:border-0 dark:border-zinc-800"
                    >
                      <td className="p-3 pl-10">
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4 text-zinc-400" />
                          <span className="font-medium">{apiKey.label}</span>
                          {apiKey.key_prefix && (
                            <span className="text-xs text-zinc-500">
                              ({apiKey.key_prefix}...)
                            </span>
                          )}
                        </div>
                      </td>
                      {members.map((member) => {
                        const isShared = apiKey.sharedWith.includes(member.id);
                        const key = `${apiKey.id}-${member.id}`;
                        const isLoading = loading === key;

                        return (
                          <td key={member.id} className="p-3 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleToggleShare(apiKey.id, member.id, isShared)
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
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-4 text-sm text-zinc-500">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-green-100 dark:bg-green-900/30">
            <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
          </div>
          <span>Shared (member can view & copy)</span>
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
