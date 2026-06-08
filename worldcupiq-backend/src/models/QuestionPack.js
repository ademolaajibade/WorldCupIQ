const mongoose = require('mongoose');

const questionPackSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    coverImageUrl: { type: String, default: null },
    type: {
      type: String,
      enum: ['free', 'premium', 'sponsored'],
      default: 'free',
    },
    price: { type: Number, default: 0 },       // USD cents
    priceNGN: { type: Number, default: 0 },    // Nigerian kobo
    sponsor: {
      name: { type: String, default: null },
      logoUrl: { type: String, default: null },
    },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    questionCount: { type: Number, default: 0 },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'mixed'],
      default: 'mixed',
    },
    category: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    purchaseCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

questionPackSchema.index({ type: 1, isActive: 1 });
questionPackSchema.index({ isFeatured: -1 });

module.exports = mongoose.model('QuestionPack', questionPackSchema);
