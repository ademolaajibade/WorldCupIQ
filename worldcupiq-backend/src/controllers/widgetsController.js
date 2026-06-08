const crypto = require('crypto');
const { nanoid } = require('nanoid');
const EmbedWidget = require('../models/EmbedWidget');
const { createWidgetSchema } = require('../utils/validators');
const { paginateQuery } = require('../utils/helpers');

const hashKey = (rawKey) =>
  crypto.createHash('sha256').update(rawKey).digest('hex');

// POST /api/v1/widgets
const createWidget = async (req, res, next) => {
  try {
    const data = createWidgetSchema.parse(req.body);
    const rawKey = nanoid(40);
    const apiKeyHash = hashKey(rawKey);
    const apiKeyPrefix = rawKey.slice(0, 8);

    const widget = await EmbedWidget.create({
      ownerId: req.user._id,
      name: data.name,
      siteName: data.siteName,
      siteUrl: data.siteUrl,
      plan: data.plan || 'starter',
      apiKeyHash,
      apiKeyPrefix,
      allowedOrigins: data.allowedOrigins || [],
      config: data.config || {},
    });

    // Return raw key ONCE — never retrievable again
    res.status(201).json({
      success: true,
      widget: { ...widget.toObject(), apiKeyHash: undefined },
      apiKey: rawKey, // Show this once to the owner
      message: 'Store this API key securely — it will not be shown again.',
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/widgets
const listWidgets = async (req, res, next) => {
  try {
    const widgets = await EmbedWidget.find({
      ownerId: req.user._id,
      isActive: true,
    }).select('-apiKeyHash');
    res.json({ success: true, widgets });
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/widgets/:id
const updateWidget = async (req, res, next) => {
  try {
    const widget = await EmbedWidget.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user._id },
      { $set: req.body },
      { new: true, runValidators: true }
    ).select('-apiKeyHash');

    if (!widget) return res.status(404).json({ success: false, message: 'Widget not found' });
    res.json({ success: true, widget });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/widgets/:id
const deleteWidget = async (req, res, next) => {
  try {
    const widget = await EmbedWidget.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!widget) return res.status(404).json({ success: false, message: 'Widget not found' });
    res.json({ success: true, message: 'Widget deactivated' });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/widgets/:id/analytics
const getAnalytics = async (req, res, next) => {
  try {
    const widget = await EmbedWidget.findOne({
      _id: req.params.id,
      ownerId: req.user._id,
    }).select('analytics name plan billing');
    if (!widget) return res.status(404).json({ success: false, message: 'Widget not found' });
    res.json({ success: true, analytics: widget.analytics, widget });
  } catch (err) {
    next(err);
  }
};

// Middleware: authenticate widget requests via X-Widget-Key header
const widgetApiKeyAuth = async (req, res, next) => {
  try {
    const rawKey = req.headers['x-widget-key'];
    if (!rawKey) {
      return res.status(401).json({ success: false, message: 'Widget API key required' });
    }

    const keyHash = hashKey(rawKey);
    const widget = await EmbedWidget.findOne({ apiKeyHash: keyHash, isActive: true });

    if (!widget) {
      return res.status(401).json({ success: false, message: 'Invalid widget API key' });
    }

    req._widget = widget;
    next();
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/widgets/embed/session
const createEmbedSession = async (req, res, next) => {
  try {
    const widget = req._widget;
    const categories = widget.config.questionCategories?.length
      ? widget.config.questionCategories
      : undefined;

    const Question = require('../models/Question');
    const matchFilter = { isActive: true };
    if (categories) matchFilter.category = { $in: categories };

    const questions = await Question.aggregate([
      { $match: matchFilter },
      { $sample: { size: widget.config.questionsPerSession || 5 } },
      { $project: { correctAnswer: 0 } },
    ]);

    EmbedWidget.findByIdAndUpdate(widget._id, {
      $inc: { 'analytics.totalSessions': 1 },
      $set: { 'analytics.lastActivityAt': new Date() },
    }).catch(() => {});

    res.json({ success: true, questions, widgetId: widget._id });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createWidget,
  listWidgets,
  updateWidget,
  deleteWidget,
  getAnalytics,
  widgetApiKeyAuth,
  createEmbedSession,
};
