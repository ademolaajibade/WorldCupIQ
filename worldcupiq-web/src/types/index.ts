export interface User {
  _id: string;
  email: string;
  displayName: string;
  username?: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
  country?: string;
  favoriteTeam?: string;
  stats: {
    totalScore: number;
    gamesPlayed: number;
    questionsAnswered: number;
    correctAnswers: number;
    currentStreak: number;
    longestStreak: number;
    streakShields: number;
    dailyChallengesCompleted: number;
    lastChallengeDate: string | null;
  };
  subscription: {
    plan: 'free' | 'premium' | 'tournament_pass';
    status: 'active' | 'canceled' | 'past_due' | 'trialing';
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  };
}

export interface Question {
  _id: string;
  text: string;
  options: string[];
  correctIndex: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  year?: number;
  tags?: string[];
}

export interface Pack {
  _id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  isPremium: boolean;
  imageUrl?: string;
}

export interface Session {
  _id: string;
  packId?: string;
  type: 'daily' | 'quick' | 'pack';
  questions: Question[];
  currentIndex: number;
  score: number;
  completed: boolean;
  startedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  username?: string;
  avatarUrl?: string;
  country?: string;
  totalScore: number;
  questionsAnswered: number;
  accuracy: number;
}

export interface Achievement {
  _id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface PaymentInitResponse {
  paymentUrl: string;
  reference: string;
  processor: 'paystack' | 'flutterwave';
}

export interface PlatformStats {
  totalUsers: number;
  premiumUsers: number;
  totalSessions: number;
  totalQuestions: number;
  revenueThisMonth: number;
}
