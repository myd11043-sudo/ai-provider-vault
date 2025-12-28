import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { getCurrentUserRole } from '@/actions/roles';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getCurrentUserRole();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <Sidebar role={role} />
      <div className="ml-64">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
