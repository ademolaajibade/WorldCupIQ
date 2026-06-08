const mongoose = require('mongoose');

const embedWidgetSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    siteName: { type: String, trim: true },
    siteUrl: { type: String, trim: true },
    plan: { type: String, enum: ['starter', 'pro'], default: 'starter' },

    // SHA-256 hash of the raw API key — never store or return the raw key after creation
    apiKeyHash: { type: String, required: true, select: false },
    // First 8 chars of raw key for owner identification (safe to display)
    apiKeyPrefix: { type: String, required: true },

    allowedOrigins: [{ type: String, trim: true }],

    config: {
      theme: {
        primaryColor: { type: String, default: '#003087' },
        backgroundColor: { type: String, default: '#ffffff' },
        textColor: { type: String, default: '#1a1a1a' },
      },
      questionCategories: [{ type: String }],
      questionsPerSession: { type: Number, default: 5 },
      showLeaderboard: { type: Boolean, default: true },
      language: { type: String, default: 'en' },
      welcomeMessage: { type: String, default: null },
      logoUrl: { type: String, default: null },
    },

    analytics: {
      totalSessions: { type: Number, default: 0 },
      totalAnswers: { type: Number, default: 0 },
      uniqueUsers: { type: Number, default: 0 },
      monthlyQueries: { type: Number, default: 0 },
      lastActivityAt: { type: Date, default: null },
    },

    billing: {
      processor: { type: String, enum: ['paystack', 'flutterwave'], default: null },
      processorSubscriptionId: { type: String, default: null },
      amount: { type: Number, default: 0 },
      currency: { type: String, default: null },
      currentPeriodEnd: { type: Date, default: null },
      status: {
        type: String,
        enum: ['active', 'canceled', 'past_due'],
        default: 'active',
      },
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

embedWidgetSchema.index({ ownerId: 1 });
embedWidgetSchema.index({ apiKeyHash: 1 });

module.exports = mongoose.model('EmbedWidget', embedWidgetSchema);
