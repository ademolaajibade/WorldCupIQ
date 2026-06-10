require('dotenv').config();
const app = require('./app');
const connectDB = require('./src/config/db');
const { initDailyChallengeJob, ensureTodayChallenge } = require('./src/jobs/dailyChallenge');
const { initStreakResetJob } = require('./src/jobs/streakReset');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`WorldCupIQ backend ready on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });

  // Start cron jobs (skip in test environment)
  if (process.env.NODE_ENV !== 'test') {
    initDailyChallengeJob();
    initStreakResetJob();
    ensureTodayChallenge();
  }
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
