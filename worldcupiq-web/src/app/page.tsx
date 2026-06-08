import Link from 'next/link';
import { Trophy, Zap, BarChart3, Brain, Users, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: Trophy,
    title: 'Daily Challenges',
    description: 'A fresh set of World Cup questions every day. Keep your streak alive and climb the ranks.',
  },
  {
    icon: Brain,
    title: 'AI Coach',
    description: 'Chat with an AI that knows everything about the World Cup — history, stats, legends.',
  },
  {
    icon: BarChart3,
    title: 'Global Leaderboard',
    description: 'See how you stack up against players from every nation. Country-level rankings too.',
  },
  {
    icon: Zap,
    title: 'Quick Play',
    description: 'Short, fast-paced quiz sessions when you have a few minutes to spare.',
  },
  {
    icon: Star,
    title: 'Trivia Packs',
    description: 'Deep-dive packs on specific tournaments, eras, teams, and legends.',
  },
  {
    icon: Users,
    title: 'Challenge Friends',
    description: 'Compare your scores with friends and see who truly knows the beautiful game.',
  },
];

const stats = [
  { value: '1000+', label: 'Questions' },
  { value: '32', label: 'Countries' },
  { value: 'Since 1930', label: 'History covered' },
  { value: '100%', label: 'Free to start' },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold tracking-tight">WorldCupIQ</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get started free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden px-4 pb-24 pt-20 text-center">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
          </div>
          <Badge className="mb-4 bg-primary/20 text-primary hover:bg-primary/20">
            World Cup 2026 — USA · Canada · Mexico
          </Badge>
          <h1 className="mx-auto max-w-3xl text-5xl font-extrabold leading-tight tracking-tight md:text-6xl lg:text-7xl">
            How well do you{' '}
            <span className="text-primary">know the</span>{' '}
            <span className="text-accent">beautiful game?</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Test your World Cup knowledge with daily challenges, AI-powered coaching, and global
            leaderboards. Free to play.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" asChild className="px-8">
              <Link href="/register">Start playing free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </section>

        {/* Stats bar */}
        <section className="border-y border-border bg-card/50 py-10">
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 px-4 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-extrabold text-primary">{s.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="px-4 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold md:text-4xl">Everything a football fan needs</h2>
              <p className="mt-3 text-muted-foreground">
                Built for the World Cup 2026 — the biggest tournament in history.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <Card key={f.title} className="border-border bg-card/60 transition-colors hover:bg-card">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
                      <f.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="mb-2 font-semibold">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 pb-24">
          <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card/60 p-12 text-center">
            <Trophy className="mx-auto mb-4 h-12 w-12 text-accent" />
            <h2 className="text-3xl font-bold">Ready to prove your World Cup IQ?</h2>
            <p className="mt-3 text-muted-foreground">
              Join players worldwide and see if you have what it takes.
            </p>
            <Button size="lg" className="mt-8 px-10" asChild>
              <Link href="/register">Create free account</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-6 text-center text-sm text-muted-foreground">
        © 2026 WorldCupIQ. All rights reserved.
      </footer>
    </div>
  );
}
