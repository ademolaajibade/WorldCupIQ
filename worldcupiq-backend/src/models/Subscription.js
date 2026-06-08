const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    processor: { type: String, enum: ['paystack', 'flutterwave'], required: true },
    processorCustomerId: { type: String, default: null },
    processorSubscriptionId: { type: String, default: null }, // null for tournament_pass
    plan: {
      type: String,
      enum: ['premium', 'tournament_pass'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'canceled', 'past_due', 'trialing'],
      default: 'active',
    },
    currency: { type: String, enum: ['NGN', 'USD'], required: true },
    amount: { type: Number, required: true }, // kobo or cents
    currentPeriodStart: { type: Date, default: null },
    currentPeriodEnd: { type: Date, default: null }, // null for tournament_pass
    cancelAtPeriodEnd: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subscription', subscriptionSchema);
