import { getUser } from '@/actions/auth';
import { AuthButton } from '@/components/auth/auth-button';

export const Header = async () => {
  const user = await getUser();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/80 px-6 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div>
        {/* Page title could go here */}
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {user.email}
          </span>
        )}
        <AuthButton isLoggedIn={!!user} />
      </div>
    </header>
  );
};
