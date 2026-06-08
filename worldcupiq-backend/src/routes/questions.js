const express = require('express');
const router = express.Router();
const {
  listQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkImport,
} = require('../controllers/questionsController');
const { authenticate, requireAdmin } = require('../middlewares/auth');

router.use(authenticate, requireAdmin);

router.get('/', listQuestions);
router.post('/', createQuestion);
router.post('/bulk', bulkImport);
router.put('/:id', updateQuestion);
router.delete('/:id', deleteQuestion);

module.exports = router;
