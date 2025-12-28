'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { KeyRound, Server, Key, Gift, Layers, Users, Share2 } from 'lucide-react';
import type { Role } from '@/types';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    href: '/providers',
    label: 'Providers',
    icon: Server,
  },
  {
    href: '/tiers',
    label: 'Tiers',
    icon: Layers,
    adminOnly: true,
  },
  {
    href: '/api-keys',
    label: 'API Keys',
    icon: Key,
  },
  {
    href: '/daily-rewards',
    label: 'Daily Rewards',
    icon: Gift,
  },
];

const adminNavItems: NavItem[] = [
  {
    href: '/admin/members',
    label: 'Members',
    icon: Users,
    adminOnly: true,
  },
  {
    href: '/admin/sharing',
    label: 'Sharing',
    icon: Share2,
    adminOnly: true,
  },
];

interface SidebarProps {
  role: Role;
}

export const Sidebar = ({ role }: SidebarProps) => {
  const pathname = usePathname();
  const isSuperAdmin = role === 'super_admin';

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-zinc-200 px-6 dark:border-zinc-800">
          <KeyRound className="h-6 w-6" />
          <span className="text-lg font-bold">Provider Vault</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems
            .filter((item) => !item.adminOnly || isSuperAdmin)
            .map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}

          {/* Admin Section */}
          {isSuperAdmin && (
            <>
              <div className="my-4 border-t border-zinc-200 dark:border-zinc-800" />
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Admin
              </div>
              {adminNavItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                        : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* Role Badge */}
        <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
          <div className={cn(
            'rounded-lg px-3 py-2 text-center text-xs font-medium',
            isSuperAdmin
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
              : role === 'member'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
          )}>
            {isSuperAdmin ? 'Super Admin' : role === 'member' ? 'Member' : 'No Role'}
          </div>
        </div>
      </div>
    </aside>
  );
};
