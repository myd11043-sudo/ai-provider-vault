'use client';

import { logout } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { LogOut, LogIn } from 'lucide-react';
import Link from 'next/link';

interface AuthButtonProps {
  isLoggedIn: boolean;
}

export const AuthButton = ({ isLoggedIn }: AuthButtonProps) => {
  if (isLoggedIn) {
    return (
      <form action={logout}>
        <Button variant="ghost" size="sm" type="submit">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </form>
    );
  }

  return (
    <Button variant="ghost" size="sm" asChild>
      <Link href="/login">
        <LogIn className="mr-2 h-4 w-4" />
        Sign in
      </Link>
    </Button>
  );
};
