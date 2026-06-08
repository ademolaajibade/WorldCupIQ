const express = require('express');
const router = express.Router();
const {
  initializePayment,
  verifyPayment,
  getSubscription,
  cancelSubscription,
  getHistory,
} = require('../controllers/paymentsController');
const { authenticate } = require('../middlewares/auth');

router.post('/initialize', authenticate, initializePayment);
router.get('/verify/:ref', authenticate, verifyPayment);
router.get('/subscription', authenticate, getSubscription);
router.post('/cancel', authenticate, cancelSubscription);
router.get('/history', authenticate, getHistory);

module.exports = router;
