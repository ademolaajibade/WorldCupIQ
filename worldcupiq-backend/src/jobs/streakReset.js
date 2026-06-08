const cron = require('node-cron');
const User = require('../models/User');
const { yesterdayUTC } = require('../utils/helpers');
const { notifyUser } = require('../services/notification');
const { sendStreakBreakEmail } = require('../services/email');

const resetBrokenStreaks = async () => {
  const yesterday = yesterdayUTC();

  // Find users who have a streak but didn't play yesterday (or earlier)
  const staleUsers = await User.find({
    'stats.currentStreak': { $gt: 0 },
    'stats.lastChallengeDate': { $lt: yesterday },
  }).select('_id email displayName stats.currentStreak settings');

  if (staleUsers.length === 0) return;

  console.log(`Resetting streaks for ${staleUsers.length} users`);

  await User.updateMany(
    { _id: { $in: staleUsers.map((u) => u._id) } },
    { $set: { 'stats.currentStreak': 0 } }
  );

  // Notify each user — fire and forget
  for (const user of staleUsers) {
    const streak = user.stats.currentStreak;

    if (user.settings?.notifications?.daily !== false) {
      notifyUser(user._id, '😢 Streak Broken!', `Your ${streak}-day streak ended. Play today to start a new one!`).catch(() => {});
    }

    sendStreakBreakEmail(user.email, user.displayName, streak).catch(() => {});
  }
};

const initStreakResetJob = () => {
  // Runs at 00:05 UTC — 5 minutes after midnight to let any late plays settle
  cron.schedule('5 0 * * *', resetBrokenStreaks, { timezone: 'UTC' });
  console.log('Streak reset cron job scheduled (00:05 UTC)');
};

module.exports = { initStreakResetJob, resetBrokenStreaks };
