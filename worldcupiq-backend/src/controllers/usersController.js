const mongoose = require('mongoose');
const User = require('../models/User');
const Achievement = require('../models/Achievement');
const UserAnswer = require('../models/UserAnswer');
const GameSession = require('../models/GameSession');
const { getUserRank } = require('../services/leaderboard');
const { updateProfileSchema, pushTokenSchema } = require('../utils/validators');

// GET /api/v1/users/me
const getProfile = async (req, res, next) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/users/me
const updateProfile = async (req, res, next) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const updates = {};

    if (data.displayName !== undefined) updates.displayName = data.displayName;
    if (data.favoriteTeam !== undefined) updates.favoriteTeam = data.favoriteTeam;
    if (data.settings) {
      if (data.settings.notifications?.daily !== undefined)
        updates['settings.notifications.daily'] = data.settings.notifications.daily;
      if (data.settings.notifications?.achievements !== undefined)
        updates['settings.notifications.achievements'] = data.settings.notifications.achievements;
      if (data.settings.language !== undefined)
        updates['settings.language'] = data.settings.language;
      if (data.settings.theme !== undefined)
        updates['settings.theme'] = data.settings.theme;
    }

    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/users/me/avatar
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatarUrl: req.file.path },
      { new: true }
    );
    res.json({ success: true, avatarUrl: user.avatarUrl });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/users/me/achievements
const getAchievements = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('achievements.achievementId');
    const allAchievements = await Achievement.find({ isActive: true });

    const unlockedMap = new Map(
      user.achievements.map((a) => [
        a.achievementId?._id?.toString(),
        a.unlockedAt,
      ])
    );

    const result = allAchievements.map((a) => ({
      ...a.toObject(),
      unlocked: unlockedMap.has(a._id.toString()),
      unlockedAt: unlockedMap.get(a._id.toString()) || null,
    }));

    res.json({ success: true, achievements: result });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/users/me/stats
const getStats = async (req, res, next) => {
  try {
    const rank = await getUserRank(req.user._id);
    res.json({
      success: true,
      stats: req.user.stats,
      subscription: req.user.subscription,
      globalRank: rank,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/users/push-token
const registerPushToken = async (req, res, next) => {
  try {
    const { token, platform } = pushTokenSchema.parse(req.body);

    await User.findByIdAndUpdate(
      req.user._id,
      {
        $pull: { pushTokens: { token } }, // remove existing entry for this token
      }
    );
    await User.findByIdAndUpdate(req.user._id, {
      $push: { pushTokens: { token, platform, active: true } },
    });

    res.json({ success: true, message: 'Push token registered' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/users/push-token
const removePushToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { pushTokens: { token } },
    });
    res.json({ success: true, message: 'Push token removed' });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/users/:username
const getPublicProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select(
      'displayName username avatarUrl country stats.totalScore stats.currentStreak stats.longestStreak subscription.plan createdAt'
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/users/me/analytics  (premium only)
const getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [byCategory, byDifficulty, dailyTrend, avgTimeResult, recentSessions] =
      await Promise.all([
        // Accuracy grouped by question category
        UserAnswer.aggregate([
          { $match: { userId: new mongoose.Types.ObjectId(userId) } },
          {
            $lookup: {
              from: 'questions',
              localField: 'questionId',
              foreignField: '_id',
              as: 'q',
            },
          },
          { $unwind: '$q' },
          {
            $group: {
              _id: '$q.category',
              total: { $sum: 1 },
              correct: { $sum: { $cond: ['$isCorrect', 1, 0] } },
            },
          },
          {
            $project: {
              _id: 0,
              category: '$_id',
              total: 1,
              correct: 1,
              accuracy: {
                $round: [{ $multiply: [{ $divide: ['$correct', '$total'] }, 100] }, 1],
              },
            },
          },
          { $sort: { total: -1 } },
        ]),

        // Accuracy grouped by difficulty
        UserAnswer.aggregate([
          { $match: { userId: new mongoose.Types.ObjectId(userId) } },
          {
            $lookup: {
              from: 'questions',
              localField: 'questionId',
              foreignField: '_id',
              as: 'q',
            },
          },
          { $unwind: '$q' },
          {
            $group: {
              _id: '$q.difficulty',
              total: { $sum: 1 },
              correct: { $sum: { $cond: ['$isCorrect', 1, 0] } },
            },
          },
          {
            $project: {
              _id: 0,
              difficulty: '$_id',
              total: 1,
              correct: 1,
              accuracy: {
                $round: [{ $multiply: [{ $divide: ['$correct', '$total'] }, 100] }, 1],
              },
            },
          },
        ]),

        // Last 14 days score trend
        GameSession.aggregate([
          {
            $match: {
              userId: new mongoose.Types.ObjectId(userId),
              status: 'completed',
              completedAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$completedAt' },
              },
              score: { $sum: '$totalScore' },
              sessions: { $sum: 1 },
              correct: { $sum: '$correctCount' },
            },
          },
          { $sort: { _id: 1 } },
          {
            $project: {
              _id: 0,
              date: '$_id',
              score: 1,
              sessions: 1,
              correct: 1,
            },
          },
        ]),

        // Average answer time
        UserAnswer.aggregate([
          { $match: { userId: new mongoose.Types.ObjectId(userId), timeSpentMs: { $gt: 0 } } },
          { $group: { _id: null, avgMs: { $avg: '$timeSpentMs' } } },
        ]),

        // Recent 5 completed sessions
        GameSession.find({ userId, status: 'completed' })
          .sort({ completedAt: -1 })
          .limit(5)
          .select('type totalScore correctCount questions completedAt timeSpentMs'),
      ]);

    const avgAnswerMs = avgTimeResult[0]?.avgMs ?? null;

    res.json({
      success: true,
      analytics: {
        byCategory,
        byDifficulty,
        dailyTrend,
        avgAnswerMs: avgAnswerMs ? Math.round(avgAnswerMs) : null,
        recentSessions: recentSessions.map((s) => ({
          type: s.type,
          score: s.totalScore,
          correct: s.correctCount,
          total: s.questions.length,
          completedAt: s.completedAt,
          timeSpentMs: s.timeSpentMs,
        })),
        summary: {
          totalScore: req.user.stats.totalScore,
          gamesPlayed: req.user.stats.gamesPlayed,
          questionsAnswered: req.user.stats.questionsAnswered,
          correctAnswers: req.user.stats.correctAnswers,
          currentStreak: req.user.stats.currentStreak,
          longestStreak: req.user.stats.longestStreak,
          dailyChallengesCompleted: req.user.stats.dailyChallengesCompleted,
          tournamentChallengesCompleted: req.user.stats.tournamentChallengesCompleted ?? 0,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
  getAchievements,
  getStats,
  getAnalytics,
  registerPushToken,
  removePushToken,
  getPublicProfile,
};
