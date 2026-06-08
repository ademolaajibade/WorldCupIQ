'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Trophy, Menu, LogOut, User, Settings, Shield, Zap, BarChart2, Sword, Pencil, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const BASE_NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/daily', label: 'Daily Challenge' },
  { href: '/leaderboard', label: 'Leaderboard' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, setUser } = useAuthStore();
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);

  async function handleSaveName() {
    const trimmed = newName.trim();
    if (!trimmed || trimmed.length < 2) return;
    setSavingName(true);
    try {
      const res = await api.put('/users/me', { displayName: trimmed });
      setUser(res.data.user ?? res.data);
      toast.success('Name updated');
      setEditNameOpen(false);
    } catch {
      toast.error('Failed to update name');
    } finally {
      setSavingName(false);
    }
  }

  const isPremium = user?.subscription?.plan !== 'free';
  const isTournamentPass = user?.subscription?.plan === 'tournament_pass';

  const navLinks = [
    ...BASE_NAV_LINKS,
    ...(isPremium ? [{ href: '/analytics', label: 'Analytics' }] : []),
    ...(isTournamentPass ? [{ href: '/tournament', label: 'Tournament' }] : []),
  ];

  async function handleLogout() {
    try {
      await api.post('/auth/logout');
    } catch {}
    logout();
    router.push('/login');
    toast.success('Logged out');
  }

  const initials = user?.displayName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold tracking-tight">WorldCupIQ</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-primary',
                pathname.startsWith(l.href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground'
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user?.subscription?.plan === 'free' && (
            <Button
              size="sm"
              className="hidden md:flex bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => router.push('/upgrade')}
            >
              <Zap className="mr-1 h-3.5 w-3.5" />
              Upgrade
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none">
              <span>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatarUrl ?? ''} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {initials ?? 'U'}
                  </AvatarFallback>
                </Avatar>
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user?.displayName}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-xs capitalize',
                      user?.subscription?.plan !== 'free' && 'bg-primary/20 text-primary'
                    )}
                  >
                    {user?.subscription?.plan?.replace('_', ' ') ?? 'free'}
                  </Badge>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setNewName(user?.displayName ?? '');
                  setEditNameOpen(true);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" /> Edit name
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/profile')}>
                <User className="mr-2 h-4 w-4" /> Profile
              </DropdownMenuItem>
              {isPremium && (
                <DropdownMenuItem onClick={() => router.push('/analytics')}>
                  <BarChart2 className="mr-2 h-4 w-4" /> Analytics
                </DropdownMenuItem>
              )}
              {isTournamentPass && (
                <DropdownMenuItem onClick={() => router.push('/tournament')}>
                  <Sword className="mr-2 h-4 w-4" /> Tournament
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <Settings className="mr-2 h-4 w-4" /> Settings
              </DropdownMenuItem>
              {user?.role === 'admin' && (
                <DropdownMenuItem onClick={() => router.push('/admin')}>
                  <Shield className="mr-2 h-4 w-4" /> Admin
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Sheet>
            <SheetTrigger className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted">
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="mt-4 flex flex-col gap-1">
                {navLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={cn(
                      'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      pathname.startsWith(l.href)
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {l.label}
                  </Link>
                ))}
                {user?.subscription?.plan === 'free' && (
                  <Link
                    href="/upgrade"
                    className="mt-2 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
                  >
                    Upgrade to Premium
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>

    <Dialog open={editNameOpen} onOpenChange={setEditNameOpen}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Edit display name</DialogTitle>
        </DialogHeader>
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Your name"
          onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
          autoFocus
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditNameOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveName} disabled={savingName || newName.trim().length < 2}>
            {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  );
}
