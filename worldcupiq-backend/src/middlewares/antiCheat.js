const { ANTI_CHEAT_MIN_MS } = require('../utils/constants');

// Validates answer submission timing.
// Client supplies timeSpentMs; server also checks against sentAt timestamp stored
// on the GameSession question entry. Server timestamp is authoritative.
const antiCheat = (req, res, next) => {
  const { timeSpentMs } = req.body;

  if (typeof timeSpentMs !== 'number' || timeSpentMs < ANTI_CHEAT_MIN_MS) {
    return res.status(400).json({
      success: false,
      message: `Answer submitted too quickly. Minimum ${ANTI_CHEAT_MIN_MS}ms required.`,
    });
  }

  next();
};

module.exports = { antiCheat };
