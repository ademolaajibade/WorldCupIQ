const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const redis = require('../config/redis');

router.get('/', async (req, res) => {
  let redisStatus = 'disconnected';
  try {
    await redis.ping();
    redisStatus = 'connected';
  } catch (_) {}

  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  const status = dbStatus === 'connected' && redisStatus === 'connected' ? 'ok' : 'degraded';

  res.status(status === 'ok' ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    db: dbStatus,
    redis: redisStatus,
  });
});

module.exports = router;
