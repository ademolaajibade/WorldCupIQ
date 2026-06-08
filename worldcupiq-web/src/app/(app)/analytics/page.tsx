'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart2,
  Target,
  Zap,
  Clock,
  TrendingUp,
  Lock,
  ChevronRight,
  Trophy,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';
import { format, parseISO } from 'date-fns';

const DIFFICULTY_ORDER = ['easy', 'medium', 'hard'];
const DIFFICULTY_COLOR: Record<string, string> = {
  easy: 'text-green-500',
  medium: 'text-yellow-500',
  hard: 'text-red-500',
};

function msToSeconds(ms: number) {
  return (ms / 1000).toFixed(1);
}

function AccuracyBar({
  label,
  accuracy,
  total,
  colorClass = 'bg-primary',
}: {
  label: string;
  accuracy: number;
  total: number;
  colorClass?: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="capitalize text-muted-foreground">{label}</span>
        <span className="font-medium">
          {accuracy}%{' '}
          <span className="text-xs text-muted-foreground/70">({total} answered)</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${colorClass}`}
          style={{ width: `${accuracy}%` }}
        />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const isPremium = user?.subscription?.plan !== 'free';

  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => api.get('/users/me/analytics').then((r) => r.data.analytics),
    enabled: isPremium,
  });

  if (!isPremium) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Lock className="h-10 w-10 text-muted-foreground" />
          </div>
        </div>
        <h1 className="mb-3 text-2xl font-bold">Performance Analytics</h1>
        <p className="mb-8 text-muted-foreground">
          Unlock detailed insights — accuracy by category, difficulty breakdown, session trends, and more — with a Premium subscription.
        </p>
        <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Link href="/upgrade">
            <Zap className="mr-2 h-4 w-4" />
            Upgrade to Premium
          </Link>
        </Button>
      </div>
    );
  }

  const summary = data?.summary;
  const accuracy = summary?.questionsAnswered
    ? Math.round((summary.correctAnswers / summary.questionsAnswered) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <Badge className="mb-2 bg-primary/20 text-primary">Analytics</Badge>
        <h1 className="text-2xl font-bold">Performance Analytics</h1>
        <p className="mt-1 text-muted-foreground">Your detailed WorldCupIQ stats.</p>
      </div>

      {/* Summary cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="border-border bg-card">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Overall Accuracy</p>
                  <p className="text-2xl font-bold">{accuracy}%</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15">
                  <BarChart2 className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Games Played</p>
                  <p className="text-2xl font-bold">{summary?.gamesPlayed ?? 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Best Streak</p>
                  <p className="text-2xl font-bold">{summary?.longestStreak ?? 0} days</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15">
                  <Clock className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg Answer Time</p>
                  <p className="text-2xl font-bold">
                    {data?.avgAnswerMs ? `${msToSeconds(data.avgAnswerMs)}s` : '—'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* By Category */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Accuracy by Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              [...Array(5)].map((_, i) => <Skeleton key={i} className="h-8" />)
            ) : data?.byCategory?.length ? (
              data.byCategory.map(
                (item: { category: string; accuracy: number; total: number }) => (
                  <AccuracyBar
                    key={item.category}
                    label={item.category}
                    accuracy={item.accuracy}
                    total={item.total}
                  />
                )
              )
            ) : (
              <p className="text-sm text-muted-foreground">Play more games to see category stats.</p>
            )}
          </CardContent>
        </Card>

        {/* By Difficulty */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Accuracy by Difficulty</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-8" />)
            ) : data?.byDifficulty?.length ? (
              [...data.byDifficulty].sort(
                (a: { difficulty: string }, b: { difficulty: string }) =>
                  DIFFICULTY_ORDER.indexOf(a.difficulty) - DIFFICULTY_ORDER.indexOf(b.difficulty)
              ).map((item: { difficulty: string; accuracy: number; total: number }) => (
                <AccuracyBar
                  key={item.difficulty}
                  label={item.difficulty}
                  accuracy={item.accuracy}
                  total={item.total}
                  colorClass={
                    item.difficulty === 'easy'
                      ? 'bg-green-500'
                      : item.difficulty === 'medium'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Play more games to see difficulty stats.</p>
            )}
          </CardContent>
        </Card>

        {/* 14-day trend */}
        <Card className="border-border bg-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Score Trend — Last 14 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-28" />
            ) : data?.dailyTrend?.length ? (
              <div className="flex items-end gap-1 h-28">
                {(() => {
                  const trend = data.dailyTrend as { date: string; score: number; sessions: number }[];
                  const maxScore = Math.max(...trend.map((t) => t.score), 1);
                  return trend.map((t) => (
                    <div key={t.date} className="flex flex-1 flex-col items-center gap-1 group relative">
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-card border border-border rounded px-2 py-1 text-xs whitespace-nowrap z-10 shadow">
                        {format(parseISO(t.date), 'MMM d')}: {t.score} pts
                      </div>
                      <div
                        className="w-full rounded-t bg-primary/70 hover:bg-primary transition-all"
                        style={{ height: `${Math.max((t.score / maxScore) * 100, 4)}%` }}
                      />
                      <span className="text-[9px] text-muted-foreground rotate-45 origin-bottom-left ml-1">
                        {format(parseISO(t.date), 'M/d')}
                      </span>
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Play daily challenges to build your trend data.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      {/* Recent sessions */}
      <div>
        <h2 className="mb-4 text-base font-semibold">Recent Sessions</h2>
        {isLoading ? (
          <Skeleton className="h-40" />
        ) : data?.recentSessions?.length ? (
          <div className="space-y-3">
            {data.recentSessions.map(
              (
                s: {
                  type: string;
                  score: number;
                  correct: number;
                  total: number;
                  completedAt: string;
                  timeSpentMs: number;
                },
                i: number
              ) => (
                <Card key={i} className="border-border bg-card">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="secondary"
                        className={
                          s.type === 'daily'
                            ? 'bg-primary/20 text-primary'
                            : s.type === 'challenge'
                            ? 'bg-accent/20 text-accent'
                            : 'bg-muted text-muted-foreground'
                        }
                      >
                        {s.type === 'daily'
                          ? 'Daily'
                          : s.type === 'challenge'
                          ? 'Tournament'
                          : 'Quick'}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">
                          {s.correct}/{s.total} correct · {s.score} pts
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(s.completedAt), 'MMM d, h:mm a')}
                          {s.timeSpentMs
                            ? ` · ${Math.round(s.timeSpentMs / 1000)}s`
                            : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Progress
                        value={Math.round((s.correct / s.total) * 100)}
                        className="h-1.5 w-20"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        {Math.round((s.correct / s.total) * 100)}%
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No completed sessions yet.</p>
        )}
      </div>
    </div>
  );
}
