const Achievement = require('../models/Achievement');

const achievements = [
  {
    slug: 'first_correct',
    title: 'First Blood',
    description: 'Answer your first question correctly',
    category: 'accuracy',
    condition: { type: 'first_correct', threshold: 1 },
    points: 10,
  },
  {
    slug: 'streak_3',
    title: 'Hat-Trick',
    description: 'Maintain a 3-day daily challenge streak',
    category: 'streak',
    condition: { type: 'streak_days', threshold: 3 },
    points: 30,
  },
  {
    slug: 'streak_7',
    title: 'One Week Wonder',
    description: 'Maintain a 7-day daily challenge streak',
    category: 'streak',
    condition: { type: 'streak_days', threshold: 7 },
    points: 70,
  },
  {
    slug: 'streak_30',
    title: 'Iron Commitment',
    description: 'Maintain a 30-day daily challenge streak',
    category: 'streak',
    condition: { type: 'streak_days', threshold: 30 },
    points: 300,
  },
  {
    slug: 'century_score',
    title: 'Century',
    description: 'Answer 100 questions correctly',
    category: 'accuracy',
    condition: { type: 'correct_count', threshold: 100 },
    points: 100,
  },
  {
    slug: 'speed_demon',
    title: 'Speed Demon',
    description: 'Complete 10 daily challenges',
    category: 'special',
    condition: { type: 'daily_challenges', threshold: 10 },
    points: 50,
  },
  {
    slug: 'perfectionist',
    title: 'Perfectionist',
    description: 'Get a perfect score on any daily challenge (all 5 correct)',
    category: 'accuracy',
    condition: { type: 'correct_count', threshold: 50 },
    points: 50,
  },
  {
    slug: 'pack_master',
    title: 'Pack Master',
    description: 'Complete 5 daily challenges',
    category: 'collection',
    condition: { type: 'daily_challenges', threshold: 5 },
    points: 25,
  },
  {
    slug: 'high_scorer',
    title: 'High Scorer',
    description: 'Earn 1,000 total points',
    category: 'special',
    condition: { type: 'total_score', threshold: 1000 },
    points: 100,
  },
  {
    slug: 'legend',
    title: 'Football Legend',
    description: 'Earn 10,000 total points',
    category: 'special',
    condition: { type: 'total_score', threshold: 10000 },
    points: 500,
  },
  {
    slug: 'tournament_pass_holder',
    title: 'Tournament Pass Holder',
    description: 'Activated the World Cup 2026 Tournament Pass',
    category: 'special',
    condition: { type: 'tournament_pass', threshold: 1 },
    points: 100,
    iconUrl: null,
  },
  {
    slug: 'tournament_trailblazer',
    title: 'Tournament Trailblazer',
    description: 'Complete your first exclusive tournament challenge',
    category: 'special',
    condition: { type: 'tournament_challenges', threshold: 1 },
    points: 75,
  },
  {
    slug: 'tournament_champion',
    title: 'Tournament Champion',
    description: 'Complete all 5 exclusive tournament challenges',
    category: 'special',
    condition: { type: 'tournament_challenges', threshold: 5 },
    points: 300,
  },
];

const seedAchievements = async () => {
  let created = 0;
  for (const a of achievements) {
    const result = await Achievement.findOneAndUpdate({ slug: a.slug }, a, {
      upsert: true,
      new: true,
    });
    if (result) created++;
  }
  console.log(`Achievements seeded: ${created}/${achievements.length}`);
};

module.exports = seedAchievements;
