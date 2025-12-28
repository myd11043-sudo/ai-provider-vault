'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addMember } from '@/actions/roles';

export const AddMemberForm = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await addMember(email.trim());

    setLoading(false);

    if (result.success) {
      setEmail('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || 'Failed to add member');
    }
  };

  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <form onSubmit={handleSubmit} className="flex items-end gap-4">
        <div className="flex-1">
          <Label htmlFor="email">Add Member by Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="member@example.com"
            className="mt-1"
          />
          <p className="mt-1 text-xs text-zinc-500">
            The user must already exist in Supabase. Create them in the Dashboard first.
          </p>
        </div>
        <Button type="submit" disabled={loading}>
          <UserPlus className="mr-2 h-4 w-4" />
          {loading ? 'Adding...' : 'Add Member'}
        </Button>
      </form>

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {success && (
        <p className="mt-2 text-sm text-green-600 dark:text-green-400">
          Member added successfully!
        </p>
      )}
    </div>
  );
};
