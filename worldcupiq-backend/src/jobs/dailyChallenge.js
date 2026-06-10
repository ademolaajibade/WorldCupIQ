const cron = require('node-cron');
const axios = require('axios');
const Question = require('../models/Question');
const DailyChallenge = require('../models/DailyChallenge');
const redis = require('../config/redis');
const { tomorrowUTC, sampleArray } = require('../utils/helpers');

const DIFFICULTY_DISTRIBUTION = [
  { difficulty: 'easy', count: 3 },
  { difficulty: 'medium', count: 4 },
  { difficulty: 'hard', count: 3 },
];

const selectQuestionsForDay = async () => {
  // Get question IDs used in the last 7 days
  const recentChallenges = await DailyChallenge.find()
    .sort({ date: -1 })
    .limit(7)
    .select('questions');

  const recentIds = new Set(
    recentChallenges.flatMap((c) => c.questions.map((id) => id.toString()))
  );

  const selected = [];

  for (const { difficulty, count } of DIFFICULTY_DISTRIBUTION) {
    const pool = await Question.find({
      isActive: true,
      difficulty,
      _id: { $nin: [...recentIds] },
    }).select('_id'); 

    const picks = sampleArray(pool, count);
    if (picks.length < count) {
      // Fallback: allow reuse if pool is too small
      const fallback = await Question.find({ isActive: true, difficulty }).select('_id');
      selected.push(...sampleArray(fallback, count));
    } else {
      selected.push(...picks);
    }
  }

  return selected.map((q) => q._id);
};

const fetchMatchOfTheDay = async (dateStr) => {
  try {
    const response = await axios.get('https://api-football-v1.p.rapidapi.com/v3/fixtures', {
      params: { date: dateStr, league: 1 }, // FIFA World Cup league ID
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
      },
      timeout: 5000,
    });

    const fixtures = response.data?.response || [];
    if (fixtures.length === 0) return null;

    const fixture = fixtures[0];
    return {
      homeTeam: fixture.teams?.home?.name,
      awayTeam: fixture.teams?.away?.name,
      venue: fixture.fixture?.venue?.name,
      kickoffTime: new Date(fixture.fixture?.date),
      apiFootballMatchId: fixture.fixture?.id?.toString(),
    };
  } catch (err) {
    console.warn('matchOfTheDay fetch failed:', err.message);
    return null;
  }
};

const generateDailyChallenge = async (targetDate) => {
  const date = targetDate || tomorrowUTC();

  const existing = await DailyChallenge.findOne({ date });
  if (existing) {
    console.log(`Daily challenge for ${date} already exists`);
    return existing;
  }

  const questionIds = await selectQuestionsForDay();
  const matchOfTheDay = await fetchMatchOfTheDay(date);

  const challenge = await DailyChallenge.create({
    date,
    questions: questionIds,
    matchOfTheDay,
  });

  // Pre-warm Redis cache (25h TTL, no correctAnswer)
  const populated = await DailyChallenge.findById(challenge._id).populate({
    path: 'questions',
    select: '-correctAnswer',
  });
  await redis.set(
    `daily:questions:${date}`,
    JSON.stringify(populated.toObject()),
    { ex: 25 * 3600 }
  );

  console.log(`Daily challenge created for ${date} with ${questionIds.length} questions`);
  return challenge;
};

// Called on server startup — creates today's challenge if missing
const ensureTodayChallenge = async () => {
  try {
    const { todayUTC } = require('../utils/helpers');
    const today = todayUTC();
    const existing = await DailyChallenge.findOne({ date: today });
    if (!existing) {
      console.log(`No challenge for today (${today}) — generating now...`);
      await generateDailyChallenge(today);
    }
  } catch (err) {
    console.error('ensureTodayChallenge failed:', err.message);
  }
};

const initDailyChallengeJob = () => {
  // Runs at 23:00 UTC every day to create tomorrow's challenge
  cron.schedule('0 23 * * *', () => generateDailyChallenge(), { timezone: 'UTC' });
  console.log('Daily challenge cron job scheduled (23:00 UTC)');
};

module.exports = { initDailyChallengeJob, generateDailyChallenge, ensureTodayChallenge };
