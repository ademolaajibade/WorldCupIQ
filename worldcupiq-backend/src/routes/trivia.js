const express = require('express');
const router = express.Router();
const {
  getDailyChallenge,
  startDailySession,
  getDailyStatus,
  submitAnswer,
  finishSession,
  completeSession,
  startQuickPlay,
  getHistory,
} = require('../controllers/triviaController');
const { authenticate } = require('../middlewares/auth');
const { acquireSessionLock } = require('../middlewares/sessionLock');

router.get('/daily', authenticate, getDailyChallenge);
// No session lock for daily start — the controller already handles in-progress resumption
router.post('/daily/start', authenticate, startDailySession);
router.get('/daily/status', authenticate, getDailyStatus);

// Support both GET (web) and POST (mobile) for quick play
router.get('/quick/start', authenticate, startQuickPlay);
router.post('/quick/start', authenticate, startQuickPlay);

// Answer submission — timeSpentMs is now computed server-side
router.post('/answer', authenticate, submitAnswer);

// Session completion: POST /finish (mobile) and POST /session/:id/complete (web)
router.post('/finish', authenticate, finishSession);
router.post('/session/:id/complete', authenticate, completeSession);

router.get('/history', authenticate, getHistory);

module.exports = router;
