const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    iconUrl: { type: String, default: null },
    category: {
      type: String,
      enum: ['streak', 'accuracy', 'social', 'collection', 'special'],
      required: true,
    },
    condition: {
      type: { type: String, required: true },
      threshold: { type: Number, required: true },
    },
    points: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Achievement', achievementSchema);
