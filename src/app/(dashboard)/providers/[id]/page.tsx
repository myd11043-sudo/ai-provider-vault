import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, ExternalLink, Gift, Key, Plus, MessageSquare } from 'lucide-react';
import { getProvider } from '@/actions/providers';
import { getApiKeysForProvider } from '@/actions/api-keys';
import { getTier } from '@/actions/tiers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiKeyList } from '@/components/api-keys/api-key-list';
import { formatDateTime, isToday } from '@/lib/utils';
import { ClaimRewardButton } from '@/components/daily-rewards/claim-reward-button';

interface ProviderPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProviderPage({ params }: ProviderPageProps) {
  const { id } = await params;
  const provider = await getProvider(id);

  if (!provider) {
    notFound();
  }

  const [apiKeys, tier] = await Promise.all([
    getApiKeysForProvider(id),
    provider.tier_id ? getTier(provider.tier_id) : null,
  ]);

  const rewardClaimedToday = provider.last_reward_claimed_at
    ? isToday(provider.last_reward_claimed_at)
    : false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/providers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{provider.name}</h1>
            {tier && (
              <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${tier.color}`}>
                {tier.label}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-1">
            {provider.website_url && (
              <a
                href={provider.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                <ExternalLink className="h-3 w-3" />
                Website
              </a>
            )}
            {provider.main_thread_url && (
              <a
                href={provider.main_thread_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-400"
              >
                <MessageSquare className="h-3 w-3" />
                Thread
              </a>
            )}
            {provider.recharge_url && (
              <a
                href={provider.recharge_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400"
              >
                <ExternalLink className="h-3 w-3" />
                Recharge
              </a>
            )}
            {provider.recharge_url_2 && (
              <a
                href={provider.recharge_url_2}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400"
              >
                <ExternalLink className="h-3 w-3" />
                Recharge 2
              </a>
            )}
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/providers/${id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      {/* Provider Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {tier && (
              <div>
                <span className="font-medium text-zinc-500 dark:text-zinc-400">
                  Tier
                </span>
                <p className="mt-1">{tier.description || tier.label}</p>
              </div>
            )}
            {provider.remarks && (
              <div>
                <span className="font-medium text-zinc-500 dark:text-zinc-400">
                  Remarks
                </span>
                <p className="mt-1">{provider.remarks}</p>
              </div>
            )}
            <div>
              <span className="font-medium text-zinc-500 dark:text-zinc-400">
                Created
              </span>
              <p className="mt-1">{formatDateTime(provider.created_at)}</p>
            </div>
            <div>
              <span className="font-medium text-zinc-500 dark:text-zinc-400">
                Last Updated
              </span>
              <p className="mt-1">{formatDateTime(provider.updated_at)}</p>
            </div>
          </CardContent>
        </Card>

        {provider.requires_daily_login && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Gift className="h-4 w-4" />
                Daily Reward
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm">
                <span className="font-medium text-zinc-500 dark:text-zinc-400">
                  Last Claimed
                </span>
                <p className="mt-1">
                  {provider.last_reward_claimed_at
                    ? formatDateTime(provider.last_reward_claimed_at)
                    : 'Never'}
                </p>
              </div>
              <div
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm ${
                  rewardClaimedToday
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                }`}
              >
                {rewardClaimedToday ? 'Claimed today' : 'Not claimed today'}
              </div>
              {!rewardClaimedToday && (
                <div>
                  <ClaimRewardButton providerId={provider.id} />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* API Keys Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="h-4 w-4" />
            API Keys
          </CardTitle>
          <Button size="sm" asChild>
            <Link href={`/providers/${id}?addKey=true`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Key
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <ApiKeyList apiKeys={apiKeys} providerId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
