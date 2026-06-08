'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Sword, CheckCircle, Lock, Zap, Loader2, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import TriviaGame from '@/components/trivia/TriviaGame';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Session } from '@/types';

interface TournamentChallenge {
  _id: string;
  slug: string;
  title: string;
  description: string;
  badge: string;
  participantCount: number;
  completed: boolean;
  bestScore: number | null;
}

export default function TournamentPage() {
  const { user } = useAuthStore();
  const isTournamentPass = user?.subscription?.plan === 'tournament_pass';

  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<TournamentChallenge | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tournament-challenges'],
    queryFn: () =>
      api.get('/tournament/challenges').then((r) => r.data.challenges as TournamentChallenge[]),
    enabled: isTournamentPass,
  });

  const startMutation = useMutation({
    mutationFn: (id: string) =>
      api.post(`/tournament/challenges/${id}/start`).then((r) => r.data),
    onSuccess: (res, id) => {
      const challenge = data?.find((c) => c._id === id) ?? null;
      setActiveChallenge(challenge);
      setActiveSession(res);
      setStartingId(null);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'Failed to start challenge');
      setStartingId(null);
    },
  });

  function handleStart(challenge: TournamentChallenge) {
    if (challenge.completed) return;
    setStartingId(challenge._id);
    startMutation.mutate(challenge._id);
  }

  function handleComplete() {
    setActiveSession(null);
    setActiveChallenge(null);
    refetch();
  }

  if (!isTournamentPass) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/15">
            <Sword className="h-10 w-10 text-accent" />
          </div>
        </div>
        <h1 className="mb-3 text-2xl font-bold">Tournament Challenges</h1>
        <p className="mb-4 text-muted-foreground">
          Exclusive challenges available only to Tournament Pass holders. One-time payment, full 2026 tournament access.
        </p>
        <div className="mb-8 rounded-xl border border-border bg-card p-6 text-left space-y-2">
          {[
            'Everything in Premium',
            'One-time payment — no subscription',
            '5 exclusive tournament-only challenges',
            'Special badge & achievement on completion',
          ].map((f) => (
            <div key={f} className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 shrink-0 text-accent" />
              {f}
            </div>
          ))}
        </div>
        <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Link href="/upgrade">
            <Zap className="mr-2 h-4 w-4" />
            Get Tournament Pass
          </Link>
        </Button>
      </div>
    );
  }

  if (activeSession && activeChallenge) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <Badge className="mb-2 bg-accent/20 text-accent">
            {activeChallenge.badge} Tournament Challenge
          </Badge>
          <h1 className="text-2xl font-bold">{activeChallenge.title}</h1>
        </div>
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <TriviaGame session={activeSession} mode="quick" onComplete={handleComplete} />
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedCount = data?.filter((c) => c.completed).length ?? 0;
  const totalCount = data?.length ?? 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <Badge className="mb-2 bg-accent/20 text-accent">Tournament Pass</Badge>
        <h1 className="text-2xl font-bold">Tournament Challenges</h1>
        <p className="mt-1 text-muted-foreground">
          Exclusive challenges for the 2026 World Cup. Complete them all to earn the Tournament Champion badge.
        </p>
      </div>

      {/* Progress */}
      {!isLoading && totalCount > 0 && (
        <Card className="mb-8 border-border bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-accent" />
                <span className="font-medium">Your Progress</span>
              </div>
              <Badge
                className={cn(
                  completedCount === totalCount
                    ? 'bg-accent/20 text-accent'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {completedCount}/{totalCount} Complete
              </Badge>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
            {completedCount === totalCount && (
              <p className="mt-3 text-center text-sm font-medium text-accent">
                All challenges complete! Check your achievements for the Tournament Champion badge.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Separator className="mb-6" />

      {/* Challenge list */}
      <div className="space-y-4">
        {isLoading ? (
          [...Array(5)].map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)
        ) : data?.length ? (
          data.map((challenge) => (
            <Card
              key={challenge._id}
              className={cn(
                'border-border bg-card transition-all',
                challenge.completed && 'opacity-80'
              )}
            >
              <CardHeader className="pb-2 pt-5 px-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{challenge.badge}</span>
                    <div>
                      <CardTitle className="text-base">{challenge.title}</CardTitle>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {challenge.participantCount.toLocaleString()} players
                        {challenge.bestScore !== null &&
                          ` · Best: ${challenge.bestScore} pts`}
                      </p>
                    </div>
                  </div>
                  {challenge.completed && (
                    <Badge className="bg-accent/20 text-accent shrink-0">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Done
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <p className="mb-4 text-sm text-muted-foreground">{challenge.description}</p>
                <Button
                  onClick={() => handleStart(challenge)}
                  disabled={challenge.completed || startingId === challenge._id}
                  className={cn(
                    'w-full',
                    challenge.completed
                      ? 'bg-muted text-muted-foreground cursor-default'
                      : 'bg-accent text-accent-foreground hover:bg-accent/90'
                  )}
                >
                  {startingId === challenge._id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : challenge.completed ? (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  ) : (
                    <Sword className="mr-2 h-4 w-4" />
                  )}
                  {challenge.completed ? 'Completed' : 'Start Challenge'}
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-center text-muted-foreground py-12">
            No challenges available right now. Check back soon!
          </p>
        )}
      </div>
    </div>
  );
}
