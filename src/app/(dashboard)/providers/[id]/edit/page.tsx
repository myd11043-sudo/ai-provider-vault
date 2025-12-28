import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getProvider } from '@/actions/providers';
import { getTiers } from '@/actions/tiers';
import { isSuperAdmin } from '@/actions/roles';
import { ProviderForm } from '@/components/forms/provider-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EditProviderPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProviderPage({ params }: EditProviderPageProps) {
  const isAdmin = await isSuperAdmin();

  if (!isAdmin) {
    redirect('/providers');
  }

  const { id } = await params;
  const [provider, tiers] = await Promise.all([
    getProvider(id),
    getTiers(),
  ]);

  if (!provider) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/providers/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Provider</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Update {provider.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProviderForm provider={provider} tiers={tiers} />
        </CardContent>
      </Card>
    </div>
  );
}
