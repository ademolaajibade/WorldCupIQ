const Question = require('../models/Question');
const { paginateQuery } = require('../utils/helpers');
const { bulkQuestionsSchema } = require('../utils/validators');

// GET /api/v1/questions
const listQuestions = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginateQuery(req.query.page, req.query.limit);
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;
    if (req.query.active !== undefined) filter.isActive = req.query.active === 'true';

    const [questions, total] = await Promise.all([
      Question.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Question.countDocuments(filter),
    ]);

    res.json({ success: true, questions, total, page });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/questions
const createQuestion = async (req, res, next) => {
  try {
    const question = await Question.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, question });
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/questions/:id
const updateQuestion = async (req, res, next) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    res.json({ success: true, question });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/questions/:id
const deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    res.json({ success: true, message: 'Question deactivated' });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/questions/bulk
const bulkImport = async (req, res, next) => {
  try {
    const questions = bulkQuestionsSchema.parse(req.body);
    const docs = questions.map((q) => ({ ...q, createdBy: req.user._id, source: 'imported' }));
    const inserted = await Question.insertMany(docs, { ordered: false });
    res.status(201).json({ success: true, count: inserted.length });
  } catch (err) {
    next(err);
  }
};

module.exports = { listQuestions, createQuestion, updateQuestion, deleteQuestion, bulkImport };
