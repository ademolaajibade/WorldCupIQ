const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  uploadAvatar,
  getAchievements,
  getStats,
  getAnalytics,
  registerPushToken,
  removePushToken,
  getPublicProfile,
} = require('../controllers/usersController');
const { authenticate } = require('../middlewares/auth');
const { uploadAvatar: uploadAvatarMiddleware } = require('../middlewares/upload');
const { requirePremium } = require('../middlewares/subscription');

router.get('/me', authenticate, getProfile);
router.put('/me', authenticate, updateProfile);
router.post('/me/avatar', authenticate, uploadAvatarMiddleware, uploadAvatar);
router.get('/me/achievements', authenticate, getAchievements);
router.get('/me/stats', authenticate, getStats);
router.get('/me/analytics', authenticate, requirePremium, getAnalytics);
router.post('/push-token', authenticate, registerPushToken);
router.delete('/push-token', authenticate, removePushToken);
router.get('/:username', getPublicProfile);

module.exports = router;
