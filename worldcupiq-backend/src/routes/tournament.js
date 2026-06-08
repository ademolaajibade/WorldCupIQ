const express = require('express');
const router = express.Router();
const { listChallenges, startChallenge } = require('../controllers/tournamentController');
const { authenticate } = require('../middlewares/auth');
const { requireTournamentPass } = require('../middlewares/subscription');

router.get('/challenges', authenticate, requireTournamentPass, listChallenges);
router.post('/challenges/:id/start', authenticate, requireTournamentPass, startChallenge);

module.exports = router;
