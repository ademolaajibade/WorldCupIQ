const express = require('express');
const router = express.Router();
const {
  createWidget,
  listWidgets,
  updateWidget,
  deleteWidget,
  getAnalytics,
  widgetApiKeyAuth,
  createEmbedSession,
} = require('../controllers/widgetsController');
const { authenticate } = require('../middlewares/auth');

// Owner-facing routes
router.post('/', authenticate, createWidget);
router.get('/', authenticate, listWidgets);
router.put('/:id', authenticate, updateWidget);
router.delete('/:id', authenticate, deleteWidget);
router.get('/:id/analytics', authenticate, getAnalytics);

// Public embed routes (authenticated via X-Widget-Key header)
router.post('/embed/session', widgetApiKeyAuth, createEmbedSession);

module.exports = router;
