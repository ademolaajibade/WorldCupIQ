export type UserRole = 'user' | 'admin';
export type UserPlan = 'free' | 'premium' | 'tournament';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  plan: UserPlan;
  country?: string;
  avatar?: string;
  points: number;
  streak: number;
  longestStreak: number;
  totalGames: number;
  questionsAnswered: number;
  correctAnswers: number;
  achievements: string[];
  streakShields: number;
  tournamentChallengesCompleted: number;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Question {
  _id: string;
  text: string;
  options: string[];
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
}

export interface AnswerResult {
  questionId: string;
  correct: boolean;
  correctAnswer: string;
  pointsEarned: number;
  explanation?: string;
}

export interface GameSession {
  sessionId: string;
  questions: Question[];
  type: 'daily' | 'quick' | 'challenge';
}

export interface TournamentChallenge {
  _id: string;
  slug: string;
  title: string;
  description: string;
  badge: string;
  participantCount: number;
  completed: boolean;
  bestScore: number | null;
}

export interface AnalyticsData {
  byCategory: { category: string; total: number; correct: number; accuracy: number }[];
  byDifficulty: { difficulty: string; total: number; correct: number; accuracy: number }[];
  dailyTrend: { date: string; score: number; sessions: number }[];
  avgAnswerMs: number | null;
  recentSessions: {
    type: string;
    score: number;
    correct: number;
    total: number;
    completedAt: string;
    timeSpentMs: number | null;
  }[];
  summary: {
    totalScore: number;
    gamesPlayed: number;
    questionsAnswered: number;
    correctAnswers: number;
    currentStreak: number;
    longestStreak: number;
    dailyChallengesCompleted: number;
    tournamentChallengesCompleted: number;
  };
}

export interface Achievement {
  _id: string;
  title: string;
  description: string;
  slug: string;
  category: string;
  points: number;
  iconUrl?: string;
  isActive: boolean;
}

export interface GameResults {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  pointsEarned: number;
  results: AnswerResult[];
  newAchievements?: Achievement[];
  streakUpdated?: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  user: {
    _id: string;
    name: string;
    avatar?: string;
    country?: string;
  };
  points: number;
  streak: number;
}

export interface PricingPlan {
  id: 'premium' | 'tournament';
  name: string;
  priceNGN: number;
  priceUSD: number;
  features: string[];
  isRecurring: boolean;
}

export interface AdminStats {
  totalUsers: number;
  activeToday: number;
  totalQuestions: number;
  totalGamesPlayed: number;
  premiumUsers: number;
  revenue: { NGN: number; USD: number };
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  plan: UserPlan;
  country?: string;
  isBanned: boolean;
  points: number;
  createdAt: string;
}

export interface AdminQuestion {
  _id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  isActive: boolean;
}

export interface ApiError {
  message: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
