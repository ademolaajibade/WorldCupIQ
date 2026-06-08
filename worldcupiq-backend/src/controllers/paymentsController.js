const paystack = require('../config/paystack');
const flw = require('../config/flutterwave');
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const { PAYSTACK_PRICES, FLUTTERWAVE_PRICES } = require('../utils/constants');
const { paginateQuery } = require('../utils/helpers');

const getProcessor = (user) => (user.country === 'NG' ? 'paystack' : 'flutterwave');

// POST /api/v1/payments/initialize
const initializePayment = async (req, res, next) => {
  try {
    const { plan } = req.body; // 'premium' | 'tournament_pass'
    if (!['premium', 'tournament_pass'].includes(plan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan' });
    }

    const user = req.user;
    const processor = getProcessor(user);
    const isOneTime = plan === 'tournament_pass';

    if (processor === 'paystack') {
      const amount = isOneTime ? PAYSTACK_PRICES.TOURNAMENT_PASS : PAYSTACK_PRICES.PREMIUM_MONTHLY;

      const paystackParams = {
        email: user.email,
        amount,
        metadata: {
          userId: user._id.toString(),
          plan,
          isOneTime,
        },
        callback_url: `${process.env.FRONTEND_URL}/payments/verify`,
      };

      // Only attach plan code for recurring premium subscription
      if (!isOneTime) {
        paystackParams.plan = process.env.PAYSTACK_PREMIUM_PLAN_CODE;
      }

      const response = await paystack.transaction.initialize(paystackParams);
      return res.json({
        success: true,
        processor: 'paystack',
        redirectUrl: response.data.authorization_url,
        reference: response.data.reference,
      });
    }

    // Flutterwave
    const amount = isOneTime ? FLUTTERWAVE_PRICES.TOURNAMENT_PASS / 100 : FLUTTERWAVE_PRICES.PREMIUM_MONTHLY / 100;

    const flwParams = {
      tx_ref: `wciq_${user._id}_${Date.now()}`,
      amount,
      currency: 'USD',
      redirect_url: `${process.env.FRONTEND_URL}/payments/verify`,
      customer: { email: user.email, name: user.displayName },
      customizations: { title: 'WorldCupIQ', logo: '' },
      meta: { userId: user._id.toString(), plan, isOneTime },
    };

    if (!isOneTime) {
      flwParams.payment_plan = process.env.FLUTTERWAVE_PREMIUM_PLAN_ID;
    }

    const response = await flw.Charge.card(flwParams).catch(() => null);
    // Flutterwave standard payment link
    const paymentLink = await flw.Misc.create_payment_link(flwParams);

    return res.json({
      success: true,
      processor: 'flutterwave',
      redirectUrl: paymentLink.data?.link,
      reference: flwParams.tx_ref,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/payments/verify/:ref
const verifyPayment = async (req, res, next) => {
  try {
    const { ref } = req.params;
    const existing = await Transaction.findOne({ processorRef: ref });

    if (existing && existing.status === 'succeeded') {
      return res.json({ success: true, status: 'succeeded', transaction: existing });
    }

    const processor = getProcessor(req.user);

    if (processor === 'paystack') {
      const result = await paystack.transaction.verify(ref);
      const data = result.data;
      if (data.status === 'success') {
        return res.json({ success: true, status: 'succeeded', amount: data.amount, currency: 'NGN' });
      }
      return res.json({ success: false, status: data.status });
    }

    // Flutterwave
    const result = await flw.Transaction.verify({ id: ref });
    if (result.data?.status === 'successful') {
      return res.json({ success: true, status: 'succeeded', amount: result.data.amount, currency: result.data.currency });
    }
    return res.json({ success: false, status: result.data?.status || 'pending' });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/payments/subscription
const getSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({ userId: req.user._id });
    res.json({
      success: true,
      subscription: subscription || null,
      currentPlan: req.user.subscription,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/payments/cancel
const cancelSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({ userId: req.user._id, status: 'active' });
    if (!subscription || !subscription.processorSubscriptionId) {
      return res.status(404).json({ success: false, message: 'No active subscription found' });
    }

    if (subscription.processor === 'paystack') {
      await paystack.subscription.disable({
        code: subscription.processorSubscriptionId,
        token: subscription.processorCustomerId,
      });
    } else {
      await flw.Subscription.cancel({ id: subscription.processorSubscriptionId });
    }

    subscription.cancelAtPeriodEnd = true;
    await subscription.save();

    res.json({ success: true, message: 'Subscription will cancel at end of current period.' });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/payments/history
const getHistory = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginateQuery(req.query.page, req.query.limit);
    const [transactions, total] = await Promise.all([
      Transaction.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments({ userId: req.user._id }),
    ]);
    res.json({ success: true, transactions, total, page });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  initializePayment,
  verifyPayment,
  getSubscription,
  cancelSubscription,
  getHistory,
};
