const express = require('express');
const router = express.Router();
const { getGlobal, getCountry, getFriends, getMyRank } = require('../controllers/leaderboardController');
const { authenticate } = require('../middlewares/auth');
const { requirePremium } = require('../middlewares/subscription');

router.get('/global', authenticate, getGlobal);
router.get('/country/:code', authenticate, requirePremium, getCountry);
router.get('/friends', authenticate, requirePremium, getFriends);
router.get('/me/rank', authenticate, getMyRank);

module.exports = router;
