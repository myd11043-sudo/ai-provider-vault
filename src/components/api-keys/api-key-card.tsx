'use client';

import { useState } from 'react';
import { Eye, EyeOff, Copy, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { revealApiKey, deleteApiKey } from '@/actions/api-keys';
import { formatDate } from '@/lib/utils';
import type { ApiKey } from '@/types';

interface ApiKeyCardProps {
  apiKey: ApiKey;
  showProvider?: boolean;
  providerName?: string;
}

export const ApiKeyCard = ({ apiKey, showProvider, providerName }: ApiKeyCardProps) => {
  const [revealed, setRevealed] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleReveal = async () => {
    if (revealed) {
      setRevealed(false);
      setRevealedKey(null);
      return;
    }

    setLoading(true);
    const result = await revealApiKey(apiKey.id);
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

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    setDeleting(true);
    await deleteApiKey(apiKey.id);
    setDeleting(false);
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{apiKey.label}</span>
          {showProvider && providerName && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {providerName}
            </span>
          )}
        </div>
        <div className="mt-1 font-mono text-sm text-zinc-600 dark:text-zinc-400">
          {revealed && revealedKey ? revealedKey : apiKey.key_prefix || '********'}
        </div>
        <div className="mt-1 text-xs text-zinc-500">
          Added {formatDate(apiKey.created_at)}
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

        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={deleting}
          title="Delete"
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
