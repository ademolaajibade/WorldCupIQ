const Achievement = require('../models/Achievement');
const User = require('../models/User');
const { notifyUser } = require('./notification');

/**
 * Checks all active achievements against the user's current stats.
 * Unlocks any newly qualifying achievements and sends push notifications.
 * Returns an array of newly unlocked achievement objects.
 */
const checkAndUnlockAchievements = async (userId) => {
  const [user, achievements] = await Promise.all([
    User.findById(userId).populate('achievements.achievementId'),
    Achievement.find({ isActive: true }),
  ]);

  if (!user) return [];

  const alreadyUnlocked = new Set(
    user.achievements.map((a) => a.achievementId?._id?.toString() || a.achievementId?.toString())
  );

  const newlyUnlocked = [];

  for (const achievement of achievements) {
    if (alreadyUnlocked.has(achievement._id.toString())) continue;

    if (_qualifies(user, achievement)) {
      newlyUnlocked.push(achievement);
    }
  }

  if (newlyUnlocked.length > 0) {
    const unlockDocs = newlyUnlocked.map((a) => ({
      achievementId: a._id,
      unlockedAt: new Date(),
    }));

    await User.findByIdAndUpdate(userId, {
      $push: { achievements: { $each: unlockDocs } },
      $inc: { 'stats.totalScore': newlyUnlocked.reduce((s, a) => s + a.points, 0) },
    });

    // Push notification for each unlocked achievement
    for (const a of newlyUnlocked) {
      await notifyUser(userId, '🏅 Achievement Unlocked!', a.title, {
        type: 'achievement',
        slug: a.slug,
      }).catch(() => {}); // non-critical
    }
  }

  return newlyUnlocked;
};

function _qualifies(user, achievement) {
  const { type, threshold } = achievement.condition;
  const stats = user.stats;

  switch (type) {
    case 'first_correct':
      return stats.correctAnswers >= 1;
    case 'streak_days':
      return stats.currentStreak >= threshold;
    case 'correct_count':
      return stats.correctAnswers >= threshold;
    case 'daily_challenges':
      return stats.dailyChallengesCompleted >= threshold;
    case 'total_score':
      return stats.totalScore >= threshold;
    case 'tournament_pass':
      return (
        user.subscription?.plan === 'tournament_pass' &&
        user.subscription?.status === 'active'
      );
    case 'tournament_challenges':
      return (stats.tournamentChallengesCompleted ?? 0) >= threshold;
    default:
      return false;
  }
}

module.exports = { checkAndUnlockAchievements };
