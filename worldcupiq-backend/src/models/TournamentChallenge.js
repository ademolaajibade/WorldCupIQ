const mongoose = require('mongoose');

const tournamentChallengeSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    badge: { type: String, default: '🏆' },
    questionFilter: {
      categories: [{ type: String }],
      difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'any'], default: 'any' },
      count: { type: Number, default: 10 },
    },
    isActive: { type: Boolean, default: true },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    participantCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TournamentChallenge', tournamentChallengeSchema);
