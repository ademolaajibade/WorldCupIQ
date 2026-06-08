import { User, UserPlan } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformUser(u: any): User {
  const plan: UserPlan =
    u.subscription?.plan === 'tournament_pass' ? 'tournament' : u.subscription?.plan ?? 'free';
  return {
    _id: u._id,
    name: u.displayName ?? u.name ?? '',
    email: u.email,
    role: u.role ?? 'user',
    plan,
    country: u.country,
    avatar: u.avatarUrl ?? u.avatar,
    points: u.stats?.totalScore ?? u.points ?? 0,
    streak: u.stats?.currentStreak ?? u.streak ?? 0,
    longestStreak: u.stats?.longestStreak ?? u.longestStreak ?? 0,
    totalGames: u.stats?.gamesPlayed ?? u.totalGames ?? 0,
    questionsAnswered: u.stats?.questionsAnswered ?? u.questionsAnswered ?? 0,
    correctAnswers: u.stats?.correctAnswers ?? u.correctAnswers ?? 0,
    achievements: (u.achievements ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((a: any) => (typeof a === 'string' ? a : a.achievementId?.name ?? ''))
      .filter(Boolean),
    streakShields: u.stats?.streakShields ?? 0,
    tournamentChallengesCompleted: u.stats?.tournamentChallengesCompleted ?? 0,
    createdAt: u.createdAt ?? new Date().toISOString(),
  };
}
