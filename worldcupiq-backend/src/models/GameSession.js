const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['daily', 'pack', 'quick', 'challenge'],
      required: true,
    },
    packId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionPack', default: null },
    dailyChallengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DailyChallenge',
      default: null,
    },
    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TournamentChallenge',
      default: null,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'abandoned'],
      default: 'in_progress',
    },
    // sentAt stored per question for server-side anti-cheat validation
    questions: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        sentAt: { type: Date, default: Date.now },
      },
    ],
    currentQuestionIndex: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    bonusScore: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    timeSpentMs: { type: Number, default: null },
  },
  { timestamps: true }
);

gameSessionSchema.index({ userId: 1, type: 1, status: 1 });
gameSessionSchema.index({ userId: 1, dailyChallengeId: 1 });

module.exports = mongoose.model('GameSession', gameSessionSchema);
