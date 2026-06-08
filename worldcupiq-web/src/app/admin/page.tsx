'use client';

import { useQuery } from '@tanstack/react-query';
import { Users, Trophy, HelpCircle, DollarSign, TrendingUp, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import type { PlatformStats } from '@/types';

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'primary',
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: 'primary' | 'accent' | 'muted';
}) {
  const colorMap = {
    primary: 'text-primary bg-primary/15',
    accent: 'text-accent bg-accent/15',
    muted: 'text-muted-foreground bg-muted',
  };
  return (
    <Card className="border-border bg-card">
      <CardContent className="flex items-start gap-4 p-5">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminOverviewPage() {
  const { data, isLoading } = useQuery<PlatformStats>({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data),
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Platform Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">Real-time metrics</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={Users}
            label="Total Users"
            value={data?.totalUsers?.toLocaleString() ?? '—'}
            color="primary"
          />
          <StatCard
            icon={TrendingUp}
            label="Premium Users"
            value={data?.premiumUsers?.toLocaleString() ?? '—'}
            sub={data ? `${Math.round((data.premiumUsers / data.totalUsers) * 100)}% conversion` : undefined}
            color="accent"
          />
          <StatCard
            icon={Activity}
            label="Total Sessions"
            value={data?.totalSessions?.toLocaleString() ?? '—'}
            color="muted"
          />
          <StatCard
            icon={HelpCircle}
            label="Questions in DB"
            value={data?.totalQuestions?.toLocaleString() ?? '—'}
            color="primary"
          />
          <StatCard
            icon={DollarSign}
            label="Revenue this month"
            value={data ? `$${(data.revenueThisMonth / 100).toFixed(2)}` : '—'}
            color="accent"
          />
          <StatCard
            icon={Trophy}
            label="Avg. questions / user"
            value={data && data.totalUsers > 0 ? Math.round(data.totalSessions / data.totalUsers) : '—'}
            color="muted"
          />
        </div>
      )}
    </div>
  );
}
