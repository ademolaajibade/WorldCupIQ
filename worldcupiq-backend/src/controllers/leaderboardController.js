const {
  getGlobalLeaderboard,
  getCountryLeaderboard,
  getFriendsLeaderboard,
  getUserRank,
} = require('../services/leaderboard');
const { LEADERBOARD_FREE_LIMIT } = require('../utils/constants');
const { paginateQuery } = require('../utils/helpers');

// GET /api/v1/leaderboard/global
const getGlobal = async (req, res, next) => {
  try {
    const isPremium = req.user.isPremium();
    const { page, limit, skip } = paginateQuery(req.query.page, req.query.limit, 100);

    const effectiveOffset = isPremium ? skip : 0;
    const effectiveLimit = isPremium ? limit : LEADERBOARD_FREE_LIMIT;

    const [entries, myRank] = await Promise.all([
      getGlobalLeaderboard(effectiveOffset, effectiveLimit),
      getUserRank(req.user._id),
    ]);

    res.json({
      success: true,
      entries,
      myRank,
      isPremium,
      page: isPremium ? page : 1,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/leaderboard/country/:code  (premium only)
const getCountry = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginateQuery(req.query.page, req.query.limit);
    const entries = await getCountryLeaderboard(req.params.code, skip, limit);
    const myRank = await getUserRank(req.user._id);
    res.json({ success: true, entries, myRank, country: req.params.code.toUpperCase() });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/leaderboard/friends  (premium only)
const getFriends = async (req, res, next) => {
  try {
    // Friends list: users who referred by this user + referred this user
    // Simple implementation: pass explicitly listed friend IDs from query
    // Full social graph is a future feature
    const friendIds = req.query.ids ? req.query.ids.split(',') : [];
    const entries = await getFriendsLeaderboard([req.user._id, ...friendIds]);
    res.json({ success: true, entries });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/leaderboard/me/rank  (all users)
const getMyRank = async (req, res, next) => {
  try {
    const rank = await getUserRank(req.user._id);
    res.json({ success: true, rank, userId: req.user._id, score: req.user.stats.totalScore });
  } catch (err) {
    next(err);
  }
};

module.exports = { getGlobal, getCountry, getFriends, getMyRank };
