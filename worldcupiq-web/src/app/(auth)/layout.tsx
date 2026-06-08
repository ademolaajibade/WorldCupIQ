import { Trophy } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <Trophy className="h-7 w-7 text-primary" />
        <span className="text-xl font-bold tracking-tight">WorldCupIQ</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
