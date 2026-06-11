"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Trophy,
  Zap,
  Flame,
  Target,
  TrendingUp,
  PlayCircle,
  ChevronRight,
  Calendar,
  ShieldCheck,
  BarChart2,
  Sword,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";
import { format } from "date-fns";

function StatCard({
  icon: Icon,
  label,
  value,
  color = "primary",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color?: "primary" | "accent" | "muted";
}) {
  const colorMap = {
    primary: "text-primary bg-primary/15",
    accent: "text-accent bg-accent/15",
    muted: "text-muted-foreground bg-muted",
  };
  return (
    <Card className="border-border bg-card">
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colorMap[color]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { isLoading: statsLoading } = useQuery({
    queryKey: ["user-stats"],
    queryFn: () => api.get("/users/me/stats").then((r) => r.data),
  });

  const { data: achievementsData } = useQuery({
    queryKey: ["achievements"],
    queryFn: () => api.get("/users/me/achievements").then((r) => r.data),
  });

  const accuracy = user?.stats?.questionsAnswered
    ? Math.round(
        (user.stats.correctAnswers / user.stats.questionsAnswered) * 100,
      )
    : 0;

  const isPremium = user?.subscription?.plan !== "free";
  const shields = user?.stats?.streakShields ?? 0;

  const today = format(new Date(), "EEEE, MMMM d");
  const hasPlayedToday =
    user?.stats?.lastChallengeDate === format(new Date(), "yyyy-MM-dd");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{today}</p>
          <h1 className="text-2xl font-bold">
            Welcome back, {user?.displayName?.split(" ")[0]} 👋
          </h1>
        </div>
        {user?.subscription?.plan === "free" && (
          <Button
            asChild
            className="self-start bg-accent text-accent-foreground hover:bg-accent/90 sm:self-auto"
          >
            <Link href="/upgrade">
              <Zap className="mr-1.5 h-4 w-4" />
              Upgrade to Premium
            </Link>
          </Button>
        )}
      </div>

      {/* Daily Challenge CTA */}
      <Card
        className={`mb-8 overflow-hidden border-border ${hasPlayedToday ? "opacity-75" : "bg-gradient-to-r from-primary/20 to-primary/5"}`}
      >
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/20">
              <Calendar className="h-7 w-7 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Daily Challenge</h2>
                {hasPlayedToday && (
                  <Badge className="bg-primary/20 text-primary">
                    Completed
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {hasPlayedToday
                  ? "Great work! Come back tomorrow for a new challenge."
                  : "10 questions · Counts toward your streak"}
              </p>
            </div>
          </div>
          <Button asChild disabled={hasPlayedToday} className="shrink-0">
            <Link href="/daily">
              {hasPlayedToday ? "Completed today" : "Play now"}
              {!hasPlayedToday && <ChevronRight className="ml-1 h-4 w-4" />}
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          [...Array(isPremium ? 5 : 4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              icon={Trophy}
              label="Total Score"
              value={user?.stats?.totalScore?.toLocaleString() ?? 0}
              color="primary"
            />
            <StatCard
              icon={Flame}
              label="Current Streak"
              value={`${user?.stats?.currentStreak ?? 0} ${(user?.stats?.currentStreak ?? 0) <= 1 ? "day" : "days"}`}
              color="accent"
            />
            <StatCard
              icon={Target}
              label="Accuracy"
              value={`${accuracy}%`}
              color="primary"
            />
            <StatCard
              icon={TrendingUp}
              label="Questions Answered"
              value={user?.stats?.questionsAnswered?.toLocaleString() ?? 0}
              color="muted"
            />
            {isPremium && (
              <Card className="border-border bg-card sm:col-span-2 lg:col-span-1">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Streak Shields
                    </p>
                    <p className="text-2xl font-bold">{shields}</p>
                    <p className="text-xs text-muted-foreground">
                      {shields === 0
                        ? "None left"
                        : shields === 1
                          ? "1 miss protected"
                          : `${shields} misses protected`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Accuracy breakdown */}
        <Card className="border-border bg-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="text-muted-foreground">Accuracy</span>
                <span className="font-medium">{accuracy}%</span>
              </div>
              <Progress value={accuracy} className="h-2" />
            </div>
            <div>
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="text-muted-foreground">Best streak</span>
                <span className="font-medium">
                  {user?.stats?.longestStreak ?? 0}
                  {(user?.stats?.longestStreak ?? 0) <= 1 ? " day" : " days"}
                </span>
              </div>
              <Progress
                value={Math.min((user?.stats?.longestStreak ?? 0) * 5, 100)}
                className="h-2"
              />
            </div>
            <div>
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Daily challenges completed
                </span>
                <span className="font-medium">
                  {user?.stats?.dailyChallengesCompleted ?? 0}
                </span>
              </div>
              <Progress
                value={Math.min(
                  (user?.stats?.dailyChallengesCompleted ?? 0) * 2,
                  100,
                )}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              asChild
              variant="outline"
              className="w-full justify-start gap-3"
            >
              <Link href="/quick">
                <PlayCircle className="h-4 w-4 text-primary" />
                Quick Play
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full justify-start gap-3"
            >
              <Link href="/leaderboard">
                <TrendingUp className="h-4 w-4 text-primary" />
                Leaderboard
              </Link>
            </Button>
            {isPremium && (
              <Button
                asChild
                variant="outline"
                className="w-full justify-start gap-3"
              >
                <Link href="/analytics">
                  <BarChart2 className="h-4 w-4 text-primary" />
                  Analytics
                </Link>
              </Button>
            )}
            {user?.subscription?.plan === "tournament_pass" && (
              <Button
                asChild
                variant="outline"
                className="w-full justify-start gap-3"
              >
                <Link href="/tournament">
                  <Sword className="h-4 w-4 text-accent" />
                  Tournament Challenges
                </Link>
              </Button>
            )}
            <Button
              asChild
              variant="outline"
              className="w-full justify-start gap-3"
            >
              <Link href="/profile">
                <Trophy className="h-4 w-4 text-accent" />
                My Profile
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent achievements */}
      {achievementsData?.achievements?.some(
        (a: { unlocked: boolean }) => a.unlocked,
      ) && (
        <div className="mt-6">
          <h2 className="mb-4 text-base font-semibold">Recent achievements</h2>
          <div className="flex flex-wrap gap-3">
            {achievementsData.achievements
              .filter((a: { unlocked: boolean }) => a.unlocked)
              .slice(0, 6)
              .map(
                (a: {
                  _id: string;
                  iconUrl: string | null;
                  title: string;
                  description: string;
                  category: string;
                }) => (
                  <div
                    key={a._id}
                    className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
                  >
                    <span className="text-xl">
                      {{
                        streak: "🔥",
                        accuracy: "🎯",
                        social: "🤝",
                        collection: "📦",
                        special: "⭐",
                      }[a.category] ?? "🏆"}
                    </span>
                    <div>
                      <p className="text-xs font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.description}
                      </p>
                    </div>
                  </div>
                ),
              )}
          </div>
        </div>
      )}
    </div>
  );
}
