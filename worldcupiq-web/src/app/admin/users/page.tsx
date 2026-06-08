'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Shield, ShieldOff, Ban, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AdminUser {
  _id: string;
  displayName: string;
  email: string;
  username?: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
  country?: string;
  isBanned?: boolean;
  subscription: { plan: string };
  stats: { totalScore: number; questionsAnswered: number };
  createdAt: string;
}

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [pendingAction, setPendingAction] = useState<{ type: 'ban' | 'role'; user: AdminUser } | null>(null);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: () =>
      api.get('/admin/users', { params: { page, limit, search: search || undefined } }).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const banMutation = useMutation({
    mutationFn: ({ id, ban }: { id: string; ban: boolean }) =>
      api.put(`/admin/users/${id}/ban`, { banned: ban }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User updated');
      setPendingAction(null);
    },
    onError: () => toast.error('Action failed'),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.put(`/admin/users/${id}/role`, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Role updated');
      setPendingAction(null);
    },
    onError: () => toast.error('Action failed'),
  });

  const users: AdminUser[] = data?.users ?? [];
  const total: number = data?.total ?? 0;
  const pages = Math.ceil(total / limit);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground">{total.toLocaleString()} total users</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search email or name…"
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <Card className="border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? [...Array(8)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(5)].map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : users.map((u) => {
                  const initials = u.displayName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                  return (
                    <TableRow key={u._id} className={cn(u.isBanned && 'opacity-50')}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={u.avatarUrl ?? ''} />
                            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium leading-tight">{u.displayName}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                          {u.role === 'admin' && (
                            <Badge className="bg-primary/20 text-primary text-[10px] px-1.5">Admin</Badge>
                          )}
                          {u.isBanned && (
                            <Badge variant="destructive" className="text-[10px] px-1.5">Banned</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize text-xs">
                          {u.subscription?.plan?.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {u.stats?.totalScore?.toLocaleString() ?? 0}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(u.createdAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPendingAction({ type: 'role', user: u })}
                            title={u.role === 'admin' ? 'Remove admin' : 'Make admin'}
                          >
                            {u.role === 'admin' ? (
                              <ShieldOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Shield className="h-4 w-4 text-primary" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPendingAction({ type: 'ban', user: u })}
                            title={u.isBanned ? 'Unban user' : 'Ban user'}
                          >
                            <Ban className={cn('h-4 w-4', u.isBanned ? 'text-primary' : 'text-destructive')} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <span className="text-xs text-muted-foreground">
              Page {page} of {pages}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Confirm dialog */}
      <Dialog open={!!pendingAction} onOpenChange={() => setPendingAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingAction?.type === 'ban'
                ? pendingAction.user.isBanned
                  ? 'Unban user'
                  : 'Ban user'
                : pendingAction?.user.role === 'admin'
                  ? 'Remove admin role'
                  : 'Make admin'}
            </DialogTitle>
            <DialogDescription>
              {pendingAction?.type === 'ban'
                ? `Are you sure you want to ${pendingAction.user.isBanned ? 'unban' : 'ban'} ${pendingAction.user.displayName}?`
                : `Change role for ${pendingAction?.user.displayName}?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingAction(null)}>
              Cancel
            </Button>
            <Button
              variant={pendingAction?.type === 'ban' && !pendingAction.user.isBanned ? 'destructive' : 'default'}
              onClick={() => {
                if (!pendingAction) return;
                if (pendingAction.type === 'ban') {
                  banMutation.mutate({ id: pendingAction.user._id, ban: !pendingAction.user.isBanned });
                } else {
                  roleMutation.mutate({
                    id: pendingAction.user._id,
                    role: pendingAction.user.role === 'admin' ? 'user' : 'admin',
                  });
                }
              }}
              disabled={banMutation.isPending || roleMutation.isPending}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
