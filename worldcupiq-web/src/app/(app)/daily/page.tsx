'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Calendar, Loader2, Lock, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import TriviaGame from '@/components/trivia/TriviaGame';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { format } from 'date-fns';
import type { Session } from '@/types';

export default function DailyChallengePage() {
  const { user } = useAuthStore();
  const [activeSession, setActiveSession] = useState<Session | null>(null);

  const { data: dailyData, isLoading } = useQuery({
    queryKey: ['daily-challenge'],
    queryFn: () => api.get('/trivia/daily').then((r) => r.data),
  });

  const startMutation = useMutation({
    mutationFn: () => api.post('/trivia/daily/start'),
    onSuccess: (res) => setActiveSession(res.data.session ?? res.data),
    onError: () => {},
  });

  const today = format(new Date(), 'EEEE, MMMM d');
  const hasPlayed = user?.stats?.lastChallengeDate === format(new Date(), 'yyyy-MM-dd');

  if (activeSession) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <Badge className="mb-2 bg-primary/20 text-primary">Daily Challenge</Badge>
          <h1 className="text-2xl font-bold">{today}</h1>
        </div>
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <TriviaGame session={activeSession} mode="daily" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <Badge className="mb-2 bg-primary/20 text-primary">Daily Challenge</Badge>
        <h1 className="text-2xl font-bold">{today}</h1>
        <p className="mt-1 text-muted-foreground">
          10 questions every day — easy, medium &amp; hard. Complete it to keep your streak alive.
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 rounded-xl" />
      ) : (
        <Card className="border-border bg-card">
          <CardContent className="p-8 text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/15">
                <Calendar className="h-10 w-10 text-primary" />
              </div>
            </div>

            <h2 className="mb-1 text-xl font-bold">
              {hasPlayed ? "You've completed today's challenge!" : "Today's challenge is ready"}
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              {hasPlayed
                ? 'Come back tomorrow for a new set of questions.'
                : `${dailyData?.challenge?.questions?.length ?? 10} questions · Easy → Medium → Hard · No time limit`}
            </p>

            {!hasPlayed && (
              <div className="mb-6 flex items-center justify-center gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{user?.stats?.currentStreak ?? 0}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 justify-center">
                    <Flame className="h-3 w-3" /> Current streak
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{user?.stats?.longestStreak ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Best streak</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{user?.stats?.dailyChallengesCompleted ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Total completed</p>
                </div>
              </div>
            )}

            {hasPlayed ? (
              <Badge className="bg-primary/20 text-primary px-4 py-1.5 text-sm">
                ✓ Completed today
              </Badge>
            ) : (
              <Button
                size="lg"
                className="px-8"
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isPending}
              >
                {startMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Start challenge
              </Button>
            )}

            {startMutation.isError && (
              <p className="mt-3 text-sm text-destructive">
                {(startMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to start. Try again.'}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Streak callout for free users */}
      {user?.subscription?.plan === 'free' && !hasPlayed && (
        <Card className="mt-4 border-border bg-card/60">
          <CardContent className="flex items-center gap-3 p-4">
            <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Upgrade to Premium for unlimited trivia packs, country leaderboards, and more.
            </p>
            <Button asChild size="sm" variant="outline" className="shrink-0">
              <a href="/upgrade">Upgrade</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
