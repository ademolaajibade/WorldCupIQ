const PLANS = {
  FREE: 'free',
  PREMIUM: 'premium',
  TOURNAMENT_PASS: 'tournament_pass',
};

const DIFFICULTY_POINTS = {
  easy: 10,
  medium: 20,
  hard: 30,
};

const CATEGORIES = [
  'history',
  'stats',
  'players',
  'venues',
  'rules',
  'culture',
  'wc2026',
];

const ACHIEVEMENT_SLUGS = {
  FIRST_CORRECT: 'first_correct',
  STREAK_3: 'streak_3',
  STREAK_7: 'streak_7',
  STREAK_30: 'streak_30',
  CENTURY_SCORE: 'century_score',
  PACK_MASTER: 'pack_master',
  SPEED_DEMON: 'speed_demon',
  PERFECTIONIST: 'perfectionist',
  SOCIAL_SHARER: 'social_sharer',
  EARLY_BIRD: 'early_bird',
};

// Paystack pricing (kobo — 1 NGN = 100 kobo)
const PAYSTACK_PRICES = {
  PREMIUM_MONTHLY: 350000,    // ₦3,500
  TOURNAMENT_PASS: 650000,    // ₦6,500
// ₦99,000
};

// Flutterwave pricing (USD cents — $1 = 100 cents)
const FLUTTERWAVE_PRICES = {
  PREMIUM_MONTHLY: 299,       // $2.99
  TOURNAMENT_PASS: 799,       // $7.99
      // $99.00
};

const ANTI_CHEAT_MIN_MS = 500;

const DAILY_QUESTION_COUNT = 10;
const PREMIUM_QUICK_QUESTION_COUNT = 10;
const FREE_QUICK_QUESTION_COUNT = 5;

const LEADERBOARD_FREE_LIMIT = 100;

module.exports = {
  PLANS,
  DIFFICULTY_POINTS,
  CATEGORIES,
  ACHIEVEMENT_SLUGS,
  PAYSTACK_PRICES,
  FLUTTERWAVE_PRICES,
  ANTI_CHEAT_MIN_MS,
  DAILY_QUESTION_COUNT,
  PREMIUM_QUICK_QUESTION_COUNT,
  FREE_QUICK_QUESTION_COUNT,
  LEADERBOARD_FREE_LIMIT,
};
