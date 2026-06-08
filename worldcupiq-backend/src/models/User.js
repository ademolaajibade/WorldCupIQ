const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, default: null },
    displayName: { type: String, required: true, trim: true },
    username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    avatarUrl: { type: String, default: null },
    googleId: { type: String, default: null },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    country: { type: String, uppercase: true, trim: true },
    favoriteTeam: { type: String, trim: true },

    stats: {
      totalScore: { type: Number, default: 0 },
      gamesPlayed: { type: Number, default: 0 },
      questionsAnswered: { type: Number, default: 0 },
      correctAnswers: { type: Number, default: 0 },
      currentStreak: { type: Number, default: 0 },
      longestStreak: { type: Number, default: 0 },
      streakShields: { type: Number, default: 0 },
      dailyChallengesCompleted: { type: Number, default: 0 },
      tournamentChallengesCompleted: { type: Number, default: 0 },
      lastChallengeDate: { type: String, default: null },
    },

    subscription: {
      plan: {
        type: String,
        enum: ['free', 'premium', 'tournament_pass'],
        default: 'free',
      },
      status: {
        type: String,
        enum: ['active', 'canceled', 'past_due', 'trialing'],
        default: 'active',
      },
      processor: { type: String, enum: ['paystack', 'flutterwave'], default: null },
      processorCustomerId: { type: String, default: null },
      processorSubscriptionId: { type: String, default: null },
      currentPeriodEnd: { type: Date, default: null },
      cancelAtPeriodEnd: { type: Boolean, default: false },
    },

    achievements: [
      {
        achievementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Achievement' },
        unlockedAt: { type: Date, default: Date.now },
      },
    ],

    pushTokens: [
      {
        token: { type: String, required: true },
        platform: { type: String, enum: ['ios', 'android', 'web'], required: true },
        active: { type: Boolean, default: true },
      },
    ],

    settings: {
      notifications: {
        daily: { type: Boolean, default: true },
        achievements: { type: Boolean, default: true },
      },
      language: { type: String, default: 'en' },
      theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
    },

    referral: {
      code: { type: String, default: null },
      referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      referralCount: { type: Number, default: 0 },
    },

    unlockedPacks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'QuestionPack' }],

    passwordResetToken: { type: String, default: null, select: false },
    passwordResetExpires: { type: Date, default: null, select: false },

    lastActiveAt: { type: Date, default: Date.now },
    isBanned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.index({ 'stats.totalScore': -1 });
userSchema.index({ googleId: 1 }, { sparse: true, unique: true });
userSchema.index({ 'referral.code': 1 }, { sparse: true, unique: true });

userSchema.methods.isPremium = function () {
  return (
    ['premium', 'tournament_pass'].includes(this.subscription.plan) &&
    this.subscription.status === 'active'
  );
};

module.exports = mongoose.model('User', userSchema);
