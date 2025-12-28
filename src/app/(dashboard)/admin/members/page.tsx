import { redirect } from 'next/navigation';
import { getMembers, isSuperAdmin, getCurrentUserRole } from '@/actions/roles';
import { MemberList } from '@/components/admin/member-list';
import { AddMemberForm } from '@/components/admin/add-member-form';
import { InitRoleButton } from '@/components/admin/init-role-button';

export default async function MembersPage() {
  const role = await getCurrentUserRole();

  // If no role, show init button
  if (role === 'none') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Initialize Your Account</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            You need to initialize your account as Super Admin to manage members.
          </p>
        </div>

        <InitRoleButton />
      </div>
    );
  }

  // Only super admin can access this page
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    redirect('/providers');
  }

  const members = await getMembers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Members</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Manage member accounts and their access to shared providers
        </p>
      </div>

      <AddMemberForm />

      <MemberList members={members} />
    </div>
  );
}
