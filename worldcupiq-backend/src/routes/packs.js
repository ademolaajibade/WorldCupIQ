const express = require('express');
const router = express.Router();
const { listPacks, getPack, startPackSession } = require('../controllers/packsController');
const { authenticate, optionalAuth } = require('../middlewares/auth');
const { acquireSessionLock } = require('../middlewares/sessionLock');

router.get('/', optionalAuth, listPacks);
router.get('/:id', authenticate, getPack);
router.post('/:id/start', authenticate, acquireSessionLock, startPackSession);

module.exports = router;
