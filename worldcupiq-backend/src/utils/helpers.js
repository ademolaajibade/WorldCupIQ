/**
 * Returns today's date as a 'YYYY-MM-DD' string in UTC.
 */
const todayUTC = () => {
  const now = new Date();
  return now.toISOString().slice(0, 10);
};

/**
 * Returns yesterday's date as a 'YYYY-MM-DD' string in UTC.
 */
const yesterdayUTC = () => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
};

/**
 * Returns the date n days ago as a 'YYYY-MM-DD' string in UTC.
 */
const nDaysAgoUTC = (n) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};

/**
 * Returns tomorrow's date as a 'YYYY-MM-DD' string in UTC.
 */
const tomorrowUTC = () => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};

/**
 * Returns the number of seconds until next midnight UTC.
 * Used as the TTL for ai:quota:{userId} Redis keys.
 */
const midnightUTCTTL = () => {
  const now = new Date();
  const midnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );
  return Math.ceil((midnight - now) / 1000);
};

/**
 * Generates a short random referral code.
 */
const generateReferralCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

/**
 * Returns safe pagination values from query params.
 */
const paginateQuery = (page = 1, limit = 20, maxLimit = 100) => {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(maxLimit, Math.max(1, parseInt(limit, 10) || 20));
  return { skip: (p - 1) * l, limit: l, page: p };
};

/**
 * Picks `count` random elements from an array without repeats.
 */
const sampleArray = (arr, count) => {
  const copy = [...arr];
  const result = [];
  while (result.length < count && copy.length > 0) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
};

module.exports = {
  todayUTC,
  yesterdayUTC,
  nDaysAgoUTC,
  tomorrowUTC,
  midnightUTCTTL,
  generateReferralCode,
  paginateQuery,
  sampleArray,
};
