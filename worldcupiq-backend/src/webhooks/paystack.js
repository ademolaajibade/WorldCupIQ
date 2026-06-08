const crypto = require('crypto');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const { sendPaymentConfirmationEmail } = require('../services/email');
const { notifyUser } = require('../services/notification');
const { checkAndUnlockAchievements } = require('../services/achievementChecker');

const verifySignature = (rawBody, signature) => {
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  return hash === signature;
};

const handleChargeSuccess = async (data) => {
  const { reference, amount, metadata, customer } = data;
  const { userId, plan, isOneTime } = metadata || {};

  if (!userId) return;

  // Idempotency — skip if already processed
  const existing = await Transaction.findOne({ processorRef: reference });
  if (existing) return;

  const user = await User.findById(userId);
  if (!user) return;

  await Transaction.create({
    userId,
    type: isOneTime ? 'tournament_pass' : 'subscription',
    processor: 'paystack',
    processorRef: reference,
    amount,
    currency: 'NGN',
    status: 'succeeded',
    metadata: { plan, isOneTime: !!isOneTime },
  });

  if (isOneTime) {
    await User.findByIdAndUpdate(userId, {
      $set: {
        'subscription.plan': 'tournament_pass',
        'subscription.status': 'active',
        'subscription.processor': 'paystack',
      },
      $max: { 'stats.streakShields': 3 },
    });

    await Subscription.findOneAndUpdate(
      { userId },
      {
        userId,
        processor: 'paystack',
        plan: 'tournament_pass',
        status: 'active',
        currency: 'NGN',
        amount,
        processorCustomerId: customer?.customer_code || null,
        processorSubscriptionId: null,
        currentPeriodEnd: null,
      },
      { upsert: true, new: true }
    );

    sendPaymentConfirmationEmail(user.email, user.displayName, 'Tournament Pass', amount, 'NGN').catch(() => {});
    notifyUser(userId, '🏆 You\'re Premium!', 'Tournament Pass activated. Enjoy unlimited access!').catch(() => {});
    checkAndUnlockAchievements(userId).catch(() => {});
  }
};

const handleSubscriptionCreate = async (data) => {
  const { subscription_code, customer, plan, next_payment_date, amount } = data;
  const userId = data.metadata?.userId;
  if (!userId) return;

  await User.findByIdAndUpdate(userId, {
    $set: {
      'subscription.plan': 'premium',
      'subscription.status': 'active',
      'subscription.processor': 'paystack',
      'subscription.processorSubscriptionId': subscription_code,
      'subscription.processorCustomerId': customer?.customer_code,
      'subscription.currentPeriodEnd': new Date(next_payment_date),
    },
    $max: { 'stats.streakShields': 3 },
  });

  await Subscription.findOneAndUpdate(
    { userId },
    {
      userId,
      processor: 'paystack',
      plan: 'premium',
      status: 'active',
      currency: 'NGN',
      amount,
      processorSubscriptionId: subscription_code,
      processorCustomerId: customer?.customer_code,
      currentPeriodEnd: new Date(next_payment_date),
    },
    { upsert: true, new: true }
  );

  const user = await User.findById(userId);
  if (user) {
    sendPaymentConfirmationEmail(user.email, user.displayName, 'Premium Monthly', amount, 'NGN').catch(() => {});
    notifyUser(userId, '🌟 Premium Activated!', 'You now have unlimited access to all features.').catch(() => {});
  }
};

const handleSubscriptionDisable = async (data) => {
  const { subscription_code, customer } = data;

  const sub = await Subscription.findOneAndUpdate(
    { processorSubscriptionId: subscription_code },
    { status: 'canceled' },
    { new: true }
  );

  if (sub) {
    await User.findByIdAndUpdate(sub.userId, {
      'subscription.plan': 'free',
      'subscription.status': 'active',
      'subscription.processorSubscriptionId': null,
    });
    notifyUser(sub.userId, 'Subscription Ended', 'Your premium subscription has been cancelled.').catch(() => {});
  }
};

const handleInvoicePaymentFailed = async (data) => {
  const { subscription } = data;
  if (!subscription?.subscription_code) return;

  await Subscription.findOneAndUpdate(
    { processorSubscriptionId: subscription.subscription_code },
    { status: 'past_due' }
  );
};

// Express handler — mounted with express.raw() before express.json()
const paystackWebhookHandler = async (req, res) => {
  const signature = req.headers['x-paystack-signature'];

  if (!verifySignature(req.body, signature)) {
    return res.status(400).json({ message: 'Invalid signature' });
  }

  // Acknowledge immediately — process async
  res.status(200).json({ received: true });

  let payload;
  try {
    payload = JSON.parse(req.body.toString());
  } catch {
    return;
  }

  const { event, data } = payload;

  try {
    switch (event) {
      case 'charge.success':
        await handleChargeSuccess(data);
        break;
      case 'subscription.create':
        await handleSubscriptionCreate(data);
        break;
      case 'subscription.disable':
        await handleSubscriptionDisable(data);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(data);
        break;
      default:
        // Unhandled event — ignore
        break;
    }
  } catch (err) {
    console.error(`Paystack webhook error (${event}):`, err.message);
  }
};

module.exports = paystackWebhookHandler;
