'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Zap, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TriviaGame from '@/components/trivia/TriviaGame';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
import type { Session } from '@/types';

const DIFFICULTIES = [
  { value: 'any', label: 'Any' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
] as const;

const CATEGORIES = [
  { value: 'any', label: 'Any' },
  { value: 'history', label: 'History' },
  { value: 'players', label: 'Players' },
  { value: 'stats', label: 'Stats' },
  { value: 'venues', label: 'Venues' },
  { value: 'rules', label: 'Rules' },
  { value: 'culture', label: 'Culture' },
  { value: 'wc2026', label: 'WC 2026' },
] as const;

type DifficultyValue = (typeof DIFFICULTIES)[number]['value'];
type CategoryValue = (typeof CATEGORIES)[number]['value'];

export default function QuickPlayPage() {
  const { user } = useAuthStore();
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [difficulty, setDifficulty] = useState<DifficultyValue>('any');
  const [category, setCategory] = useState<CategoryValue>('any');

  const isPremium = user?.subscription?.plan !== 'free';
  const questionCount = isPremium ? 10 : 5;

  const startMutation = useMutation({
    mutationFn: () => {
      const body: Record<string, string> = {};
      if (isPremium && difficulty !== 'any') body.difficulty = difficulty;
      if (isPremium && category !== 'any') body.category = category;
      return api.post('/trivia/quick/start', body);
    },
    onSuccess: (res) => {
      setActiveSession(res.data.session ?? res.data);
    },
  });

  function handleComplete() {
    setGamesPlayed((n) => n + 1);
    setActiveSession(null);
  }

  if (activeSession) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <Badge className="mb-2 bg-accent/20 text-accent">Quick Play</Badge>
          <h1 className="text-2xl font-bold">Quick Play</h1>
        </div>
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <TriviaGame session={activeSession} mode="quick" onComplete={handleComplete} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <Badge className="mb-2 bg-accent/20 text-accent">Quick Play</Badge>
        <h1 className="text-2xl font-bold">Quick Play</h1>
        <p className="mt-1 text-muted-foreground">
          {questionCount} random World Cup questions. Fast, fun, and always fresh.
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-8">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/15">
              <Zap className="h-10 w-10 text-accent" />
            </div>
          </div>

          <h2 className="mb-1 text-center text-xl font-bold">Ready for a quick challenge?</h2>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            {questionCount} questions · 20 seconds each
          </p>

          {/* Premium filters */}
          {isPremium ? (
            <div className="mb-6 space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Difficulty
                </p>
                <div className="flex flex-wrap gap-2">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setDifficulty(d.value)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-sm font-medium transition-all',
                        difficulty === d.value
                          ? 'border-primary bg-primary/15 text-primary'
                          : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Category
                </p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setCategory(c.value)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-sm font-medium transition-all',
                        category === c.value
                          ? 'border-accent bg-accent/15 text-accent'
                          : 'border-border bg-card text-muted-foreground hover:border-accent/50'
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              <Lock className="h-4 w-4 shrink-0" />
              <span>
                <span className="font-medium text-foreground">Premium:</span> choose difficulty &amp; category, play 10 questions per round.
              </span>
            </div>
          )}

          {gamesPlayed > 0 && (
            <p className="mb-4 text-center text-sm text-muted-foreground">
              Games played this session:{' '}
              <span className="font-bold text-foreground">{gamesPlayed}</span>
            </p>
          )}

          <Button
            size="lg"
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={() => startMutation.mutate()}
            disabled={startMutation.isPending}
          >
            {startMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Zap className="mr-2 h-4 w-4" />
            )}
            {gamesPlayed > 0 ? 'Play again' : 'Start quick play'}
          </Button>

          {startMutation.isError && (
            <p className="mt-3 text-center text-sm text-destructive">
              {(startMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                'Failed to start. Try again.'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
