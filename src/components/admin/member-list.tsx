'use client';

import { useState } from 'react';
import { Trash2, Crown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { removeMember, type MemberWithEmail } from '@/actions/roles';
import { formatDate } from '@/lib/utils';

interface MemberListProps {
  members: MemberWithEmail[];
}

export const MemberList = ({ members }: MemberListProps) => {
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (id: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    setRemovingId(id);
    await removeMember(id);
    setRemovingId(null);
  };

  if (members.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
        <p className="text-zinc-500 dark:text-zinc-400">
          No members yet. Add your first member above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Current Members</h2>
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
        {members.map((member, index) => (
          <div
            key={member.id}
            className={`flex items-center justify-between p-4 ${
              index !== members.length - 1
                ? 'border-b border-zinc-200 dark:border-zinc-800'
                : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  member.role === 'super_admin'
                    ? 'bg-purple-100 dark:bg-purple-900/30'
                    : 'bg-blue-100 dark:bg-blue-900/30'
                }`}
              >
                {member.role === 'super_admin' ? (
                  <Crown className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                ) : (
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{member.email}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      member.role === 'super_admin'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}
                  >
                    {member.role === 'super_admin' ? 'Super Admin' : 'Member'}
                  </span>
                </div>
                <span className="text-xs text-zinc-500">
                  Added {formatDate(member.created_at)}
                </span>
              </div>
            </div>

            {member.role !== 'super_admin' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(member.id)}
                disabled={removingId === member.id}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
