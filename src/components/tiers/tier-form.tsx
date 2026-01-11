'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createTier, updateTier } from '@/actions/tiers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ActionResult } from '@/types';
import type { Tier } from '@/types/supabase';

interface TierFormProps {
  tier?: Tier;
}

const initialState: ActionResult<Tier> = { success: false };

export const TierForm = ({ tier }: TierFormProps) => {
  const router = useRouter();
  const action = tier ? updateTier : createTier;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [bgColor, setBgColor] = useState(tier?.color || '#71717a');
  const [textColor, setTextColor] = useState(tier?.text_color || '#ffffff');

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

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="color">Background Color</Label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              id="color"
              name="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border border-zinc-200 bg-transparent p-1 dark:border-zinc-800"
            />
            <Input
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="flex-1 font-mono text-sm"
              placeholder="#71717a"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="textColor">Text Color</Label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              id="textColor"
              name="textColor"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border border-zinc-200 bg-transparent p-1 dark:border-zinc-800"
            />
            <Input
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="flex-1 font-mono text-sm"
              placeholder="#ffffff"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Preview</Label>
          <div
            className="flex h-10 w-full items-center justify-center rounded-md text-sm font-bold"
            style={{ backgroundColor: bgColor, color: textColor }}
          >
            {tier?.name || 'S'}
          </div>
        </div>
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
          className="w-32"
        />
        <p className="text-xs text-zinc-500">Lower numbers appear first</p>
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
