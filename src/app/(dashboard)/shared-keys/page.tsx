import { redirect } from 'next/navigation';
import { isMember, getSharedKeysForMember } from '@/actions/roles';
import { SharedKeysList } from '@/components/shared-keys/shared-keys-list';

export default async function SharedKeysPage() {
  const memberCheck = await isMember();
  if (!memberCheck) {
    redirect('/providers');
  }

  const sharedKeys = await getSharedKeysForMember();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Shared API Keys</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          API keys shared with you by the admin
        </p>
      </div>

      <SharedKeysList sharedKeys={sharedKeys} />
    </div>
  );
}
