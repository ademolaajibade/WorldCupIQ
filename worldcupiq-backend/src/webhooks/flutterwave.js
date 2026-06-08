const crypto = require('crypto');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const { sendPaymentConfirmationEmail } = require('../services/email');
const { notifyUser } = require('../services/notification');
const { checkAndUnlockAchievements } = require('../services/achievementChecker');

// Flutterwave uses a simple hash comparison (not HMAC)
const verifySignature = (header) => {
  return header === process.env.FLUTTERWAVE_WEBHOOK_SECRET;
};

const handleChargeCompleted = async (data) => {
  const { tx_ref, amount, currency, status, meta } = data;
  if (status !== 'successful') return;

  const { userId, plan, isOneTime } = meta || {};
  if (!userId) return;

  // Idempotency
  const existing = await Transaction.findOne({ processorRef: tx_ref });
  if (existing) return;

  const amountInCents = Math.round(amount * 100);

  await Transaction.create({
    userId,
    type: isOneTime ? 'tournament_pass' : 'subscription',
    processor: 'flutterwave',
    processorRef: tx_ref,
    amount: amountInCents,
    currency: currency || 'USD',
    status: 'succeeded',
    metadata: { plan, isOneTime: !!isOneTime },
  });

  if (isOneTime) {
    await User.findByIdAndUpdate(userId, {
      $set: {
        'subscription.plan': 'tournament_pass',
        'subscription.status': 'active',
        'subscription.processor': 'flutterwave',
      },
      $max: { 'stats.streakShields': 3 },
    });

    await Subscription.findOneAndUpdate(
      { userId },
      {
        userId,
        processor: 'flutterwave',
        plan: 'tournament_pass',
        status: 'active',
        currency,
        amount: amountInCents,
        processorSubscriptionId: null,
        currentPeriodEnd: null,
      },
      { upsert: true, new: true }
    );

    const user = await User.findById(userId);
    if (user) {
      sendPaymentConfirmationEmail(user.email, user.displayName, 'Tournament Pass', amountInCents, currency).catch(() => {});
      notifyUser(userId, '🏆 You\'re Premium!', 'Tournament Pass activated!').catch(() => {});
      checkAndUnlockAchievements(userId).catch(() => {});
    }
  }
};

const handleChargeFailed = async (data) => {
  const { tx_ref } = data;
  await Transaction.findOneAndUpdate(
    { processorRef: tx_ref, status: 'pending' },
    { status: 'failed' }
  );
};

const handleSubscriptionActivated = async (data) => {
  const { id: subscriptionId, customer, plan, next_charge_at, amount } = data;
  const userId = data.meta?.userId;
  if (!userId) return;

  const currency = plan?.currency || 'USD';
  const amountInCents = Math.round((amount || 0) * 100);

  await User.findByIdAndUpdate(userId, {
    $set: {
      'subscription.plan': 'premium',
      'subscription.status': 'active',
      'subscription.processor': 'flutterwave',
      'subscription.processorSubscriptionId': subscriptionId?.toString(),
      'subscription.currentPeriodEnd': next_charge_at ? new Date(next_charge_at) : null,
    },
    $max: { 'stats.streakShields': 3 },
  });

  await Subscription.findOneAndUpdate(
    { userId },
    {
      userId,
      processor: 'flutterwave',
      plan: 'premium',
      status: 'active',
      currency,
      amount: amountInCents,
      processorSubscriptionId: subscriptionId?.toString(),
      processorCustomerId: customer?.id?.toString(),
      currentPeriodEnd: next_charge_at ? new Date(next_charge_at) : null,
    },
    { upsert: true, new: true }
  );

  const user = await User.findById(userId);
  if (user) {
    sendPaymentConfirmationEmail(user.email, user.displayName, 'Premium Monthly', amountInCents, currency).catch(() => {});
    notifyUser(userId, '🌟 Premium Activated!', 'Enjoy unlimited access to all features!').catch(() => {});
  }
};

const handleSubscriptionCancelled = async (data) => {
  const { id: subscriptionId } = data;

  const sub = await Subscription.findOneAndUpdate(
    { processorSubscriptionId: subscriptionId?.toString() },
    { status: 'canceled' },
    { new: true }
  );

  if (sub) {
    await User.findByIdAndUpdate(sub.userId, {
      'subscription.plan': 'free',
      'subscription.status': 'active',
      'subscription.processorSubscriptionId': null,
    });
    notifyUser(sub.userId, 'Subscription Ended', 'Your premium access has been cancelled.').catch(() => {});
  }
};

const handleSubscriptionRenewed = async (data) => {
  const { id: subscriptionId, next_charge_at, amount } = data;

  const sub = await Subscription.findOneAndUpdate(
    { processorSubscriptionId: subscriptionId?.toString() },
    {
      status: 'active',
      currentPeriodEnd: next_charge_at ? new Date(next_charge_at) : undefined,
    },
    { new: true }
  );

  if (sub) {
    const amountInCents = Math.round((amount || 0) * 100);
    await Transaction.create({
      userId: sub.userId,
      type: 'subscription',
      processor: 'flutterwave',
      processorRef: `renewal_${subscriptionId}_${Date.now()}`,
      amount: amountInCents,
      currency: sub.currency,
      status: 'succeeded',
      metadata: { plan: sub.plan },
    });
  }
};

// Express handler — mounted with express.raw() before express.json()
const flutterwaveWebhookHandler = async (req, res) => {
  const signature = req.headers['verif-hash'];

  if (!verifySignature(signature)) {
    return res.status(400).json({ message: 'Invalid signature' });
  }

  res.status(200).json({ received: true });

  let payload;
  try {
    payload = JSON.parse(req.body.toString());
  } catch {
    return;
  }

  const event = payload.event;
  const data = payload.data;

  try {
    switch (event) {
      case 'charge.completed':
        await handleChargeCompleted(data);
        break;
      case 'charge.failed':
        await handleChargeFailed(data);
        break;
      case 'subscription.activated':
        await handleSubscriptionActivated(data);
        break;
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(data);
        break;
      case 'subscription.renewed':
        await handleSubscriptionRenewed(data);
        break;
      case 'transfer.completed':
        // Future: handle refund tracking
        break;
      default:
        break;
    }
  } catch (err) {
    console.error(`Flutterwave webhook error (${event}):`, err.message);
  }
};

module.exports = flutterwaveWebhookHandler;
