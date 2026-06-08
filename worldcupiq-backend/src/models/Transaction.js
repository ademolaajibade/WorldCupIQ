const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['subscription', 'pack_purchase', 'tournament_pass', 'widget_subscription'],
      required: true,
    },
    processor: { type: String, enum: ['paystack', 'flutterwave'], required: true },
    processorRef: { type: String, default: null }, // payment reference from processor
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed', 'refunded'],
      default: 'pending',
    },
    metadata: {
      packId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionPack', default: null },
      plan: { type: String, default: null },
      widgetId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmbedWidget', default: null },
      isOneTime: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    // Transactions are never mutated — createdAt is the canonical record time
  }
);

transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ processorRef: 1 }, { sparse: true, unique: true });

module.exports = mongoose.model('Transaction', transactionSchema);
