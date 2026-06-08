const createQuestionFixture = async (overrides = {}) => {
  const Question = require('../../src/models/Question');
  const defaults = {
    text: 'Which country won the 2022 World Cup?',
    options: { A: 'France', B: 'Argentina', C: 'Brazil', D: 'Germany' },
    correctAnswer: 'B',
    explanation: 'Argentina defeated France on penalties.',
    category: 'history',
    difficulty: 'easy',
    source: 'manual',
  };
  return Question.create({ ...defaults, ...overrides });
};

module.exports = { createQuestionFixture };
