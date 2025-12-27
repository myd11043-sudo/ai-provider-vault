'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { createTier, updateTier } from '@/actions/tiers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ActionResult } from '@/types';
import type { Tier } from '@/types/supabase';
import { DEFAULT_TIER_COLORS } from '@/types/supabase';

interface TierFormProps {
  tier?: Tier;
}

const initialState: ActionResult<Tier> = { success: false };

export const TierForm = ({ tier }: TierFormProps) => {
  const router = useRouter();
  const action = tier ? updateTier : createTier;
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success) {
      router.push('/tiers');
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-6">
      {tier && <input type="hidden" name="id" value={tier.id} />}

      {state.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {state.error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            name="name"
            placeholder="e.g., S, A, B"
            defaultValue={tier?.name}
            required
          />
          <p className="text-xs text-zinc-500">Short identifier (e.g., S, A, B)</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="label">Label *</Label>
          <Input
            id="label"
            name="label"
            placeholder="e.g., S Tier, A Tier"
            defaultValue={tier?.label}
            required
          />
          <p className="text-xs text-zinc-500">Display name (e.g., S Tier)</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Describe what this tier represents..."
          defaultValue={tier?.description || ''}
          rows={3}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="color">Color</Label>
          <select
            id="color"
            name="color"
            defaultValue={tier?.color || 'bg-zinc-500 text-white'}
            className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300"
          >
            {DEFAULT_TIER_COLORS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sortOrder">Sort Order</Label>
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            min="0"
            placeholder="0"
            defaultValue={tier?.sort_order ?? 0}
          />
          <p className="text-xs text-zinc-500">Lower numbers appear first</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving...' : tier ? 'Update Tier' : 'Create Tier'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
