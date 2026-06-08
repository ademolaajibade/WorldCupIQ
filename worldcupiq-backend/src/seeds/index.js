require('dotenv').config();
const mongoose = require('mongoose');

const seedQuestions = require('./questions.seed');
const seedAchievements = require('./achievements.seed');
const seedAdmin = require('./admin.seed');
const seedDailyChallenges = require('./dailyChallenge.seed');
const seedTournamentChallenges = require('./tournamentChallenges.seed');

const run = async () => {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 10000,
  });
  console.log('Connected. Running seeds...\n');

  await seedQuestions();
  await seedAchievements();
  await seedAdmin();
  await seedTournamentChallenges();

  if (process.env.NODE_ENV !== 'production') {
    await seedDailyChallenges();
  }

  console.log('\nAll seeds completed.');
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
