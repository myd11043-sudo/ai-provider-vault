'use client';

import { useState } from 'react';
import { Eye, EyeOff, Copy, Check, ExternalLink, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { revealApiKey } from '@/actions/api-keys';
import { cn } from '@/lib/utils';
import type { SharedKeyWithProvider } from '@/types';

interface SharedKeysListProps {
  sharedKeys: SharedKeyWithProvider[];
}

export const SharedKeysList = ({ sharedKeys }: SharedKeysListProps) => {
  if (sharedKeys.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
        <Key className="mx-auto h-12 w-12 text-zinc-400" />
        <p className="mt-4 text-zinc-500 dark:text-zinc-400">
          No API keys have been shared with you yet.
        </p>
      </div>
    );
  }

  // Group keys by provider
  const keysByProvider = sharedKeys.reduce((acc, key) => {
    const providerId = key.provider_id;
    if (!acc[providerId]) {
      acc[providerId] = {
        provider_name: key.provider_name,
        website_url: key.website_url,
        provider_remarks: key.provider_remarks,
        tier_name: key.tier_name,
        tier_label: key.tier_label,
        tier_color: key.tier_color,
        tier_sort_order: key.tier_sort_order,
        keys: [],
      };
    }
    acc[providerId].keys.push(key);
    return acc;
  }, {} as Record<string, {
    provider_name: string;
    website_url: string | null;
    provider_remarks: string | null;
    tier_name: string | null;
    tier_label: string | null;
    tier_color: string | null;
    tier_sort_order: number | null;
    keys: SharedKeyWithProvider[];
  }>);

  // Sort providers by tier_sort_order
  const sortedProviders = Object.entries(keysByProvider).sort((a, b) => {
    const orderA = a[1].tier_sort_order ?? 999;
    const orderB = b[1].tier_sort_order ?? 999;
    return orderA - orderB;
  });

  return (
    <div className="space-y-6">
      {sortedProviders.map(([providerId, provider]) => (
        <div
          key={providerId}
          className="rounded-lg border border-zinc-200 dark:border-zinc-800"
        >
          {/* Provider Header */}
          <div className="border-b border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">{provider.provider_name}</h2>
                {provider.tier_label && (
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      provider.tier_color || 'bg-zinc-500 text-white'
                    )}
                  >
                    {provider.tier_label}
                  </span>
                )}
              </div>
              {provider.website_url && (
                <a
                  href={provider.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  <span className="max-w-[200px] truncate">{provider.website_url}</span>
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </a>
              )}
            </div>
            {provider.provider_remarks && (
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {provider.provider_remarks}
              </p>
            )}
          </div>

          {/* API Keys */}
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {provider.keys.map((key) => (
              <SharedKeyCard key={key.api_key_id} sharedKey={key} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

interface SharedKeyCardProps {
  sharedKey: SharedKeyWithProvider;
}

const SharedKeyCard = ({ sharedKey }: SharedKeyCardProps) => {
  const [revealed, setRevealed] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleReveal = async () => {
    if (revealed) {
      setRevealed(false);
      setRevealedKey(null);
      return;
    }

    setLoading(true);
    const result = await revealApiKey(sharedKey.api_key_id);
    setLoading(false);

    if (result.success && result.data) {
      setRevealedKey(result.data);
      setRevealed(true);

      // Auto-hide after 30 seconds
      setTimeout(() => {
        setRevealed(false);
        setRevealedKey(null);
      }, 30000);
    }
  };

  const handleCopy = async () => {
    if (!revealedKey) return;

    await navigator.clipboard.writeText(revealedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between p-4">
      <div className="min-w-0 flex-1">
        <div className="font-medium">{sharedKey.api_key_label}</div>
        <div className="mt-1 font-mono text-sm text-zinc-600 dark:text-zinc-400">
          {revealed && revealedKey ? revealedKey : sharedKey.key_prefix || '********'}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleReveal}
          disabled={loading}
          title={revealed ? 'Hide' : 'Reveal'}
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
          ) : revealed ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>

        {revealed && revealedKey && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
