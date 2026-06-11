'use client';

import { useQuery } from '@tanstack/react-query';
import { Trophy, Medal, Globe, Users, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import type { LeaderboardEntry } from '@/types';

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-xl">🥇</span>;
  if (rank === 2) return <span className="text-xl">🥈</span>;
  if (rank === 3) return <span className="text-xl">🥉</span>;
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
      {rank}
    </span>
  );
}

function LeaderboardRow({ entry, isMe }: { entry: LeaderboardEntry; isMe: boolean }) {
  const initials = entry.displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl px-4 py-3 transition-colors',
        isMe ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/50'
      )}
    >
      <div className="flex w-8 items-center justify-center">
        <RankBadge rank={entry.rank} />
      </div>
      <Avatar className="h-9 w-9">
        <AvatarImage src={entry.avatarUrl ?? ''} />
        <AvatarFallback className="bg-primary/20 text-primary text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={cn('text-sm font-medium truncate', isMe && 'text-primary')}>
            {entry.displayName}
          </p>
          {isMe && <Badge className="bg-primary/20 text-primary text-[10px] px-1.5 py-0">You</Badge>}
        </div>
        {entry.username && (
          <p className="text-xs text-muted-foreground truncate">@{entry.username}</p>
        )}
      </div>
      {entry.country && (
        <span className="text-sm text-muted-foreground">{entry.country}</span>
      )}
      <div className="text-right">
        <p className="text-base font-extrabold text-primary">{(entry.totalScore ?? 0).toLocaleString()}</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">pts · {entry.accuracy ?? 0}% acc</p>
      </div>
    </div>
  );
}

function LeaderboardList({
  data,
  isLoading,
  myId,
}: {
  data: LeaderboardEntry[] | undefined;
  isLoading: boolean;
  myId?: string;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    );
  }
  if (!data?.length) {
    return (
      <div className="py-12 text-center text-muted-foreground">No entries yet.</div>
    );
  }
  return (
    <div className="space-y-1">
      {data.map((entry) => (
        <LeaderboardRow key={entry.userId} entry={entry} isMe={entry.userId === myId} />
      ))}
    </div>
  );
}

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const isPremium = user?.subscription?.plan !== 'free';

  const { data: rawGlobalData, isLoading: globalLoading } = useQuery({
    queryKey: ['leaderboard-global'],
    queryFn: () => api.get('/leaderboard/global').then((r) => r.data?.entries ?? r.data),
  });

  const globalData = rawGlobalData
    ? [...rawGlobalData]
        .sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0))
        .map((entry, i) => ({ ...entry, rank: i + 1 }))
    : undefined;

  const { data: countryData, isLoading: countryLoading } = useQuery({
    queryKey: ['leaderboard-country', user?.country],
    queryFn: () =>
      api.get(`/leaderboard/country/${user?.country}`).then((r) => r.data?.entries ?? r.data),
    enabled: isPremium && !!user?.country,
  });

  const { data: friendsData, isLoading: friendsLoading } = useQuery({
    queryKey: ['leaderboard-friends'],
    queryFn: () => api.get('/leaderboard/friends').then((r) => r.data?.entries ?? r.data),
    enabled: isPremium,
  });

  const { data: myRank } = useQuery({
    queryKey: ['my-rank'],
    queryFn: () => api.get('/leaderboard/me/rank').then((r) => r.data),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="mt-1 text-muted-foreground">See how you rank against the world</p>
      </div>

      {/* My rank card */}
      {myRank && (
        <Card className="mb-6 border-border bg-primary/10 border-primary/30">
          <CardContent className="flex items-center gap-4 p-5">
            <Trophy className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Your global rank</p>
              <p className="text-2xl font-extrabold">#{myRank.rank?.toLocaleString()}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-sm text-muted-foreground">Total score</p>
              <p className="text-2xl font-extrabold">{user?.stats?.totalScore?.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="global">
        <TabsList className="mb-6 w-full">
          <TabsTrigger value="global" className="flex-1 gap-1.5">
            <Globe className="h-4 w-4" />
            Global
          </TabsTrigger>
          <TabsTrigger value="country" className="flex-1 gap-1.5">
            <Medal className="h-4 w-4" />
            Country
            {!isPremium && <Lock className="h-3 w-3 ml-1 opacity-50" />}
          </TabsTrigger>
          <TabsTrigger value="friends" className="flex-1 gap-1.5">
            <Users className="h-4 w-4" />
            Friends
            {!isPremium && <Lock className="h-3 w-3 ml-1 opacity-50" />}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global">
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                Global Top 100
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LeaderboardList data={globalData} isLoading={globalLoading} myId={user?._id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="country">
          {!isPremium ? (
            <PremiumGate feature="country leaderboard" />
          ) : !user?.country ? (
            <Card className="border-border bg-card">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-3">
                  Add your country in your profile to see the country leaderboard.
                </p>
                <Button asChild variant="outline">
                  <Link href="/profile">Edit profile</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Medal className="h-4 w-4 text-accent" />
                  {user.country} Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LeaderboardList data={countryData} isLoading={countryLoading} myId={user?._id} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="friends">
          {!isPremium ? (
            <PremiumGate feature="friends leaderboard" />
          ) : (
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Friends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LeaderboardList data={friendsData} isLoading={friendsLoading} myId={user?._id} />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PremiumGate({ feature }: { feature: string }) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <Lock className="h-10 w-10 text-muted-foreground" />
        <div>
          <p className="font-semibold">Premium feature</p>
          <p className="text-sm text-muted-foreground mt-1">
            Upgrade to access the {feature} and compete at every level.
          </p>
        </div>
        <Button asChild>
          <Link href="/upgrade">Upgrade now</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
