const redis = require('../config/redis');

// Prevents a user from starting two concurrent game sessions.
// Uses SET NX (atomic) — safe against race conditions.
const acquireSessionLock = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    const key = `session:lock:${userId}`;

    // SET key 1 NX EX 1800 — only sets if key does not exist
    const result = await redis.set(key, '1', { nx: true, ex: 1800 });

    if (result === null) {
      return res.status(409).json({
        success: false,
        message: 'A game session is already in progress. Complete or abandon it first.',
      });
    }

    next();
  } catch (err) {
    // Redis failure — allow session start (degraded mode)
    console.error('Session lock check failed:', err.message);
    next();
  }
};

const releaseSessionLock = async (userId) => {
  try {
    await redis.del(`session:lock:${userId}`);
  } catch (err) {
    console.error('Session lock release failed:', err.message);
  }
};

module.exports = { acquireSessionLock, releaseSessionLock };
