const mongoose = require('mongoose');

const userAnswerSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GameSession',
      required: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    selectedAnswer: { type: String, enum: ['A', 'B', 'C', 'D', '__timeout__'], required: true },
    isCorrect: { type: Boolean, required: true },
    timeSpentMs: { type: Number, required: true },
    pointsEarned: { type: Number, default: 0 },
    answeredAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

userAnswerSchema.index({ sessionId: 1 });
userAnswerSchema.index({ userId: 1, questionId: 1 });

module.exports = mongoose.model('UserAnswer', userAnswerSchema);
