import { KeyRound } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-4">
      <div className="mb-8 flex items-center gap-2">
        <KeyRound className="h-8 w-8" />
        <span className="text-2xl font-bold">Provider Vault</span>
      </div>
      {children}
    </div>
  );
}
