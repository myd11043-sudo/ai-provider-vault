import { redirect } from 'next/navigation';
import { isSuperAdmin, getSharingInfo } from '@/actions/roles';
import { SharingManager } from '@/components/admin/sharing-manager';

export default async function SharingPage() {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    redirect('/providers');
  }

  const sharingInfo = await getSharingInfo();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">API Key Sharing</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Control which API keys are visible to members
        </p>
      </div>

      <SharingManager
        providers={sharingInfo.providers}
        members={sharingInfo.members}
      />
    </div>
  );
}
