const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    options: {
      A: { type: String, required: true, trim: true },
      B: { type: String, required: true, trim: true },
      C: { type: String, required: true, trim: true },
      D: { type: String, required: true, trim: true },
    },
    correctAnswer: {
      type: String,
      enum: ['A', 'B', 'C', 'D'],
      required: true,
      select: false,
    },
    explanation: { type: String, trim: true },
    category: {
      type: String,
      enum: ['history', 'stats', 'players', 'venues', 'rules', 'culture', 'wc2026'],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    points: { type: Number, default: 20 },
    tags: [{ type: String, trim: true }],
    year: { type: Number },
    pack: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionPack', default: null },
    isActive: { type: Boolean, default: true },
    timesAnswered: { type: Number, default: 0 },
    timesCorrect: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    source: {
      type: String,
      enum: ['manual', 'ai-generated', 'imported'],
      default: 'manual',
    },
  },
  { timestamps: true }
);

// Auto-set points based on difficulty before saving
questionSchema.pre('save', function (next) {
  const pointsMap = { easy: 10, medium: 20, hard: 30 };
  if (this.isModified('difficulty')) {
    this.points = pointsMap[this.difficulty];
  }
  next();
});

questionSchema.index({ category: 1, difficulty: 1, isActive: 1 });
questionSchema.index({ pack: 1 });
questionSchema.index({ tags: 1 });

module.exports = mongoose.model('Question', questionSchema);
