const mongoose = require('mongoose');

const dailyChallengeSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, unique: true }, // 'YYYY-MM-DD' UTC
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    bonus: {
      type: { type: String, enum: ['speed', 'streak', 'perfect'], default: null },
      multiplier: { type: Number, default: 1 },
      description: { type: String, default: null },
    },
    matchOfTheDay: {
      homeTeam: { type: String, default: null },
      awayTeam: { type: String, default: null },
      venue: { type: String, default: null },
      kickoffTime: { type: Date, default: null },
      apiFootballMatchId: { type: String, default: null },
    },
    participantCount: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DailyChallenge', dailyChallengeSchema);
