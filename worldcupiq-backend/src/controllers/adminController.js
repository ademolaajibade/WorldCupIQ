const User = require('../models/User');
const GameSession = require('../models/GameSession');
const Transaction = require('../models/Transaction');
const { paginateQuery } = require('../utils/helpers');

// GET /api/v1/admin/users
const listUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginateQuery(req.query.page, req.query.limit);
    const filter = {};
    if (req.query.search) {
      filter.$or = [
        { email: { $regex: req.query.search, $options: 'i' } },
        { displayName: { $regex: req.query.search, $options: 'i' } },
        { username: { $regex: req.query.search, $options: 'i' } },
      ];
    }
    if (req.query.plan) filter['subscription.plan'] = req.query.plan;

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-passwordHash'),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, users, total, page });
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/admin/users/:id/role
const updateRole = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot change your own role' });
    }

    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select(
      'email displayName role'
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/admin/users/:id/ban
const banUser = async (req, res, next) => {
  try {
    const { banned } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: !!banned },
      { new: true }
    ).select('email displayName isBanned');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/admin/stats
const getPlatformStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const [
      totalUsers,
      premiumUsers,
      sessionsToday,
      totalRevenue,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ 'subscription.plan': { $ne: 'free' }, 'subscription.status': 'active' }),
      GameSession.countDocuments({ createdAt: { $gte: today }, status: 'completed' }),
      Transaction.aggregate([
        { $match: { status: 'succeeded' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        premiumUsers,
        sessionsToday,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { listUsers, updateRole, banUser, getPlatformStats };
