const QuestionPack = require('../models/QuestionPack');
const GameSession = require('../models/GameSession');
const User = require('../models/User');
const { acquireSessionLock } = require('../middlewares/sessionLock');

// GET /api/v1/packs
const listPacks = async (req, res, next) => {
  try {
    const packs = await QuestionPack.find({ isActive: true })
      .select('-questions')
      .sort({ isFeatured: -1, createdAt: -1 });

    const unlockedIds = req.user
      ? req.user.unlockedPacks.map((id) => id.toString())
      : [];
    const isPremium = req.user?.isPremium() || false;

    const result = packs.map((p) => ({
      ...p.toObject(),
      isUnlocked:
        p.type === 'free' ||
        isPremium ||
        unlockedIds.includes(p._id.toString()),
    }));

    res.json({ success: true, packs: result });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/packs/:id
const getPack = async (req, res, next) => {
  try {
    const pack = await QuestionPack.findOne({
      _id: req.params.id,
      isActive: true,
    }).populate({ path: 'questions', select: '-correctAnswer' });

    if (!pack) return res.status(404).json({ success: false, message: 'Pack not found' });

    const isPremium = req.user.isPremium();
    const isUnlocked =
      pack.type === 'free' ||
      isPremium ||
      req.user.unlockedPacks.some((id) => id.toString() === pack._id.toString());

    if (!isUnlocked) {
      return res.status(403).json({
        success: false,
        message: 'Purchase or upgrade to Premium to access this pack',
        price: pack.price,
        priceNGN: pack.priceNGN,
      });
    }

    res.json({ success: true, pack });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/packs/:id/start
const startPackSession = async (req, res, next) => {
  try {
    const pack = await QuestionPack.findOne({ _id: req.params.id, isActive: true });
    if (!pack) return res.status(404).json({ success: false, message: 'Pack not found' });

    const isPremium = req.user.isPremium();
    const isUnlocked =
      pack.type === 'free' ||
      isPremium ||
      req.user.unlockedPacks.some((id) => id.toString() === pack._id.toString());

    if (!isUnlocked) {
      return res.status(403).json({ success: false, message: 'Pack not unlocked' });
    }

    const questions = pack.questions.map((qId) => ({
      questionId: qId,
      sentAt: new Date(),
    }));

    const session = await GameSession.create({
      userId: req.user._id,
      type: 'pack',
      packId: pack._id,
      questions,
    });

    res.status(201).json({ success: true, session });
  } catch (err) {
    next(err);
  }
};

module.exports = { listPacks, getPack, startPackSession };
