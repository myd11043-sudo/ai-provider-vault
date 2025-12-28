import { redirect } from 'next/navigation';
import { getTiers } from '@/actions/tiers';
import { isSuperAdmin } from '@/actions/roles';
import { ProviderForm } from '@/components/forms/provider-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function NewProviderPage() {
  const isAdmin = await isSuperAdmin();

  if (!isAdmin) {
    redirect('/providers');
  }

  const tiers = await getTiers();

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Add New Provider</CardTitle>
        </CardHeader>
        <CardContent>
          <ProviderForm tiers={tiers} />
        </CardContent>
      </Card>
    </div>
  );
}
