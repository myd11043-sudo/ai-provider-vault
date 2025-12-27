import { getProvidersRequiringDailyLogin } from '@/actions/providers';
import { RewardTracker } from '@/components/daily-rewards/reward-tracker';
import { isToday } from '@/lib/utils';

export default async function DailyRewardsPage() {
  const providers = await getProvidersRequiringDailyLogin();

  const unclaimedCount = providers.filter(
    (p) => !p.last_reward_claimed_at || !isToday(p.last_reward_claimed_at)
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Daily Rewards</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Track and claim daily login rewards from your providers
        </p>
      </div>

      {providers.length > 0 && (
        <div className="flex gap-4">
          <div className="rounded-lg bg-zinc-100 px-4 py-2 dark:bg-zinc-800">
            <span className="text-2xl font-bold">{providers.length}</span>
            <span className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">
              Total Providers
            </span>
          </div>
          <div
            className={`rounded-lg px-4 py-2 ${
              unclaimedCount > 0
                ? 'bg-amber-100 dark:bg-amber-900/30'
                : 'bg-green-100 dark:bg-green-900/30'
            }`}
          >
            <span className="text-2xl font-bold">{unclaimedCount}</span>
            <span className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">
              Unclaimed Today
            </span>
          </div>
        </div>
      )}

      <RewardTracker providers={providers} />
    </div>
  );
}
