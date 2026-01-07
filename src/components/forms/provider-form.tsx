'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { createProvider, updateProvider } from '@/actions/providers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import type { ActionResult, Provider, Tier } from '@/types';

interface ProviderFormProps {
  provider?: Provider;
  tiers: Tier[];
}

const initialState: ActionResult<Provider> = { success: false };

export const ProviderForm = ({ provider, tiers }: ProviderFormProps) => {
  const router = useRouter();
  const action = provider ? updateProvider : createProvider;
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success && state.data) {
      router.push(`/providers/${state.data.id}`);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-6">
      {provider && <input type="hidden" name="id" value={provider.id} />}

      {state.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {state.error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Provider Name *</Label>
          <Input
            id="name"
            name="name"
            placeholder="e.g., OpenAI, Anthropic, Google AI"
            defaultValue={provider?.name}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tierId">Tier</Label>
          <select
            id="tierId"
            name="tierId"
            defaultValue={provider?.tier_id || ''}
            className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300"
          >
            <option value="">No tier</option>
            {tiers.map((tier) => (
              <option key={tier.id} value={tier.id}>
                {tier.label} {tier.description ? `- ${tier.description}` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="websiteUrl">Website URL</Label>
        <Input
          id="websiteUrl"
          name="websiteUrl"
          type="url"
          placeholder="https://example.com"
          defaultValue={provider?.website_url || ''}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mainThreadUrl">Main Thread URL</Label>
        <Input
          id="mainThreadUrl"
          name="mainThreadUrl"
          type="url"
          placeholder="https://example.com/thread"
          defaultValue={provider?.main_thread_url || ''}
        />
        <p className="text-xs text-zinc-500">
          Link to announcements, FAQs, or Q&A thread.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="rechargeUrl">Recharge URL</Label>
          <Input
            id="rechargeUrl"
            name="rechargeUrl"
            type="url"
            placeholder="https://example.com/recharge"
            defaultValue={provider?.recharge_url || ''}
          />
          <p className="text-xs text-zinc-500">
            URL to recharge/top-up credits.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rechargeUrl2">Recharge URL 2</Label>
          <Input
            id="rechargeUrl2"
            name="rechargeUrl2"
            type="url"
            placeholder="https://example.com/recharge-alt"
            defaultValue={provider?.recharge_url_2 || ''}
          />
          <p className="text-xs text-zinc-500">
            Alternative recharge station.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="remarks">Remarks</Label>
        <Textarea
          id="remarks"
          name="remarks"
          placeholder="Any notes about this provider..."
          defaultValue={provider?.remarks || ''}
          rows={4}
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="requiresDailyLogin"
          name="requiresDailyLogin"
          defaultChecked={provider?.requires_daily_login}
        />
        <Label htmlFor="requiresDailyLogin" className="cursor-pointer">
          Requires daily login for rewards
        </Label>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="isActive"
          name="isActive"
          defaultChecked={provider?.is_active ?? true}
        />
        <Label htmlFor="isActive" className="cursor-pointer">
          Active
        </Label>
        <span className="text-xs text-zinc-500">
          (Uncheck if provider is on hiatus or shut down)
        </span>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving...' : provider ? 'Update Provider' : 'Create Provider'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
