'use client';

import { useActionState } from 'react';
import { useEffect, useState } from 'react';
import { storeApiKey } from '@/actions/api-keys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { ActionResult } from '@/types';

interface ApiKeyFormProps {
  providerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const initialState: ActionResult<string> = { success: false };

export const ApiKeyForm = ({ providerId, open, onOpenChange }: ApiKeyFormProps) => {
  const [state, formAction, pending] = useActionState(storeApiKey, initialState);
  const [key, setKey] = useState('');

  useEffect(() => {
    if (state.success) {
      setKey('');
      onOpenChange(false);
    }
  }, [state.success, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add API Key</DialogTitle>
          <DialogDescription>
            Store a new API key securely in the vault.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="providerId" value={providerId} />

          {state.error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {state.error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="label">Label *</Label>
            <Input
              id="label"
              name="label"
              placeholder="e.g., Chat Completions, Production"
              defaultValue="Chat Completions"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key *</Label>
            <Input
              id="apiKey"
              name="apiKey"
              type="password"
              placeholder="Enter your API key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              required
            />
            <p className="text-xs text-zinc-500">
              Your key will be encrypted and stored securely.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Storing...' : 'Store Key'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
