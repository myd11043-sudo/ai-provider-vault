import { getAllApiKeys } from '@/actions/api-keys';
import { AllApiKeysList } from '@/components/api-keys/all-api-keys-list';

export default async function ApiKeysPage() {
  const apiKeys = await getAllApiKeys();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">All API Keys</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          View and manage all your stored API keys across providers
        </p>
      </div>

      <AllApiKeysList apiKeys={apiKeys} />
    </div>
  );
}
