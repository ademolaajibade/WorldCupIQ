const redis = require('../config/redis');
const User = require('../models/User');

const GLOBAL_KEY = 'leaderboard:global';
const countryKey = (code) => `leaderboard:country:${code.toUpperCase()}`;

const addOrUpdateScore = async (userId, totalScore, country) => {
  const id = userId.toString();
  await redis.zadd(GLOBAL_KEY, { score: totalScore, member: id });
  if (country) {
    await redis.zadd(countryKey(country), { score: totalScore, member: id });
  }
};

const getUserRank = async (userId) => {
  const rank = await redis.zrevrank(GLOBAL_KEY, userId.toString());
  return rank !== null ? rank + 1 : null; // 1-indexed
};

// Returns top-100 players by querying all users from MongoDB, sorted by totalScore desc
const getGlobalLeaderboard = async (offset = 0, limit = 100) => {
  const users = await User.find({})
    .select('displayName username avatarUrl country stats.totalScore stats.correctAnswers stats.questionsAnswered')
    .sort({ 'stats.totalScore': -1 })
    .limit(100)
    .lean();

  return users.map((u, i) => {
    const answered = u.stats?.questionsAnswered || 0;
    const correct = u.stats?.correctAnswers || 0;
    const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
    return {
      rank: i + 1,
      userId: u._id.toString(),
      displayName: u.displayName || 'Unknown',
      username: u.username || null,
      avatarUrl: u.avatarUrl || null,
      country: u.country || null,
      totalScore: u.stats?.totalScore ?? 0,
      accuracy,
    };
  });
};

const getCountryLeaderboard = async (countryCode, offset = 0, limit = 50) => {
  return _fetchAndEnrich(countryKey(countryCode), offset, limit);
};

// Builds a transient friends board from individual scores
const getFriendsLeaderboard = async (friendIds) => {
  if (!friendIds || friendIds.length === 0) return [];
  const ids = friendIds.map((id) => id.toString());

  // Fetch each user's score from global ZSET
  const pipeline = ids.map((id) => redis.zscore(GLOBAL_KEY, id));
  const scores = await Promise.all(pipeline);

  const entries = ids
    .map((id, i) => ({ userId: id, score: parseFloat(scores[i] ?? 0) }))
    .sort((a, b) => b.score - a.score)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  return _enrichEntries(entries);
};

const syncLeaderboardScore = async (userId, country) => {
  const user = await User.findById(userId).select('stats.totalScore country');
  if (!user) return;
  await addOrUpdateScore(userId, user.stats.totalScore, country || user.country);
};

// Helpers

async function _fetchAndEnrich(key, offset, limit) {
  const raw = await redis.zrange(key, offset, offset + limit - 1, {
    rev: true,
    withScores: true,
  });

  if (!raw || raw.length === 0) return [];

  // @upstash/redis returns [{member, score}, ...] when withScores: true
  const entries = raw.map((item, i) => ({
    userId: item.member,
    score: item.score,
    rank: offset + i + 1,
  }));

  return _enrichEntries(entries);
}

async function _enrichEntries(entries) {
  const ids = entries.map((e) => e.userId);
  const users = await User.find({ _id: { $in: ids } }).select(
    'displayName username avatarUrl country stats.totalScore stats.correctAnswers stats.questionsAnswered'
  );

  const userMap = {};
  users.forEach((u) => {
    userMap[u._id.toString()] = u;
  });

  return entries.map((e) => {
    const u = userMap[e.userId] || {};
    const answered = u.stats?.questionsAnswered || 0;
    const correct = u.stats?.correctAnswers || 0;
    const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
    return {
      rank: e.rank,
      userId: e.userId,
      displayName: u.displayName || 'Unknown',
      username: u.username || null,
      avatarUrl: u.avatarUrl || null,
      country: u.country || null,
      totalScore: u.stats?.totalScore ?? e.score ?? 0,
      accuracy,
    };
  });
}

module.exports = {
  addOrUpdateScore,
  getUserRank,
  getGlobalLeaderboard,
  getCountryLeaderboard,
  getFriendsLeaderboard,
  syncLeaderboardScore,
};
