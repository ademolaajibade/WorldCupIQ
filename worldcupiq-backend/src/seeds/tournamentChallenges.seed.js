const TournamentChallenge = require('../models/TournamentChallenge');

const challenges = [
  {
    slug: 'group-stage-legends',
    title: 'Group Stage Legends',
    description: 'Test your knowledge of unforgettable World Cup group stage moments across history.',
    badge: '⚡',
    questionFilter: { categories: ['history', 'stats'], difficulty: 'any', count: 10 },
  },
  {
    slug: 'golden-boot-hunt',
    title: 'Golden Boot Hunt',
    description: 'How well do you know the greatest goal-scorers in World Cup history?',
    badge: '👟',
    questionFilter: { categories: ['players', 'stats'], difficulty: 'medium', count: 10 },
  },
  {
    slug: 'stadium-showdown',
    title: 'Stadium Showdown',
    description: 'Prove you know the venues, host nations, and iconic stadiums of the World Cup.',
    badge: '🏟️',
    questionFilter: { categories: ['venues', 'culture'], difficulty: 'any', count: 10 },
  },
  {
    slug: 'wc-2026-ready',
    title: 'WC 2026 Ready',
    description: 'Everything you need to know about the 2026 FIFA World Cup — host nations, format, and more.',
    badge: '🌍',
    questionFilter: { categories: ['wc2026'], difficulty: 'any', count: 10 },
  },
  {
    slug: 'ultimate-trivia-gauntlet',
    title: 'Ultimate Trivia Gauntlet',
    description: 'The hardest World Cup questions from every category. Only the best will survive.',
    badge: '🏆',
    questionFilter: { categories: [], difficulty: 'hard', count: 10 },
  },
];

const seedTournamentChallenges = async () => {
  let created = 0;
  for (const c of challenges) {
    await TournamentChallenge.findOneAndUpdate({ slug: c.slug }, c, {
      upsert: true,
      new: true,
    });
    created++;
  }
  console.log(`Tournament challenges seeded: ${created}/${challenges.length}`);
};

module.exports = seedTournamentChallenges;
