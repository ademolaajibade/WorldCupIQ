const express = require('express');
const router = express.Router();
const { listUsers, updateRole, banUser, getPlatformStats } = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middlewares/auth');

router.use(authenticate, requireAdmin);

router.get('/users', listUsers);
router.put('/users/:id/role', updateRole);
router.put('/users/:id/ban', banUser);
router.get('/stats', getPlatformStats);

module.exports = router;
