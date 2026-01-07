import Link from 'next/link';
import { ExternalLink, Gift, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClaimRewardButton } from './claim-reward-button';
import { formatDateTime, isToday, daysSince } from '@/lib/utils';
import type { ProviderWithTier } from '@/actions/providers';

interface RewardItemProps {
  provider: ProviderWithTier;
}

export const RewardItem = ({ provider }: RewardItemProps) => {
  const claimedToday = provider.last_reward_claimed_at
    ? isToday(provider.last_reward_claimed_at)
    : false;

  const daysMissed = provider.last_reward_claimed_at
    ? daysSince(provider.last_reward_claimed_at)
    : null;

  return (
    <Card className={claimedToday ? 'border-green-200 dark:border-green-800' : ''}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              claimedToday
                ? 'bg-green-100 dark:bg-green-900/30'
                : 'bg-amber-100 dark:bg-amber-900/30'
            }`}
          >
            {claimedToday ? (
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            )}
          </div>
          <div>
            <CardTitle className="text-base">
              <div className="flex items-center gap-2">
                <Link
                  href={`/providers/${provider.id}`}
                  className="hover:underline"
                >
                  {provider.name}
                </Link>
                {provider.tier && (
                  <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${provider.tier.color}`}>
                    {provider.tier.name}
                  </span>
                )}
              </div>
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {provider.website_url && (
                <a
                  href={provider.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  <ExternalLink className="h-3 w-3" />
                  {new URL(provider.website_url).hostname.replace(/^www\./, '')}
                </a>
              )}
              {provider.recharge_url && (
                <a
                  href={provider.recharge_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  <Gift className="h-3 w-3" />
                  Recharge
                </a>
              )}
              {provider.recharge_url_2 && (
                <a
                  href={provider.recharge_url_2}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  <Gift className="h-3 w-3" />
                  Recharge 2
                </a>
              )}
            </div>
          </div>
        </div>

        {!claimedToday && <ClaimRewardButton providerId={provider.id} />}
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <div className="text-zinc-500 dark:text-zinc-400">
            {provider.last_reward_claimed_at ? (
              <>Last claimed: {formatDateTime(provider.last_reward_claimed_at)}</>
            ) : (
              <>Never claimed</>
            )}
          </div>

          {claimedToday ? (
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <Gift className="h-4 w-4" />
              Claimed today
            </span>
          ) : daysMissed !== null && daysMissed > 1 ? (
            <span className="text-amber-600 dark:text-amber-400">
              {daysMissed} days since last claim
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};
