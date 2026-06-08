const { Redis } = require('@upstash/redis');

let redis;

try {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  console.log('Redis client initialised');
} catch (err) {
  console.error('Redis init failed:', err.message);
  // App continues — Redis failures degrade gracefully where possible
}

module.exports = redis;
