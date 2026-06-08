const Question = require('../models/Question');
const DailyChallenge = require('../models/DailyChallenge');
const redis = require('../config/redis');
const { todayUTC, sampleArray } = require('../utils/helpers');

// Creates DailyChallenge docs for today + next 6 days (development only)
const seedDailyChallenges = async () => {
  const allQuestions = await Question.find({ isActive: true }).select('_id difficulty');
  if (allQuestions.length < 10) {
    console.warn('Not enough questions to seed daily challenges. Run questions seed first.');
    return;
  }

  let created = 0;
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() + i);
    const dateStr = date.toISOString().slice(0, 10);

    const exists = await DailyChallenge.findOne({ date: dateStr });
    if (exists) continue;

    const easy = allQuestions.filter((q) => q.difficulty === 'easy');
    const medium = allQuestions.filter((q) => q.difficulty === 'medium');
    const hard = allQuestions.filter((q) => q.difficulty === 'hard');

    const selected = [
      ...sampleArray(easy.length >= 3 ? easy : allQuestions, 3),
      ...sampleArray(medium.length >= 4 ? medium : allQuestions, 4),
      ...sampleArray(hard.length >= 3 ? hard : allQuestions, 3),
    ];

    const challenge = await DailyChallenge.create({
      date: dateStr,
      questions: selected.map((q) => q._id),
    });

    // Cache today's challenge
    if (i === 0) {
      const populated = await DailyChallenge.findById(challenge._id).populate({
        path: 'questions',
        select: '-correctAnswer',
      });
      await redis.set(
        `daily:questions:${dateStr}`,
        JSON.stringify(populated.toObject()),
        { ex: 25 * 3600 }
      ).catch(() => {});
    }

    created++;
  }

  console.log(`Daily challenges seeded: ${created} created`);
};

module.exports = seedDailyChallenges;
