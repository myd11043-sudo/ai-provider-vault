import { getTiers } from '@/actions/tiers';
import { ProviderForm } from '@/components/forms/provider-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function NewProviderPage() {
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
