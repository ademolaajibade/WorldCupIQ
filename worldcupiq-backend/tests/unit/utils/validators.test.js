const { registerSchema, answerSubmitSchema } = require('../../../src/utils/validators');

describe('validators', () => {
  describe('registerSchema', () => {
    const valid = {
      email: 'user@test.com',
      password: 'Password1!',
      displayName: 'Test User',
      country: 'NG',
    };

    test('accepts valid registration data', () => {
      expect(() => registerSchema.parse(valid)).not.toThrow();
    });

    test('rejects password without uppercase', () => {
      expect(() => registerSchema.parse({ ...valid, password: 'password1!' })).toThrow();
    });

    test('rejects password without number', () => {
      expect(() => registerSchema.parse({ ...valid, password: 'Password!' })).toThrow();
    });

    test('rejects password without special character', () => {
      expect(() => registerSchema.parse({ ...valid, password: 'Password1' })).toThrow();
    });

    test('rejects password shorter than 8 chars', () => {
      expect(() => registerSchema.parse({ ...valid, password: 'P1!' })).toThrow();
    });

    test('rejects invalid email', () => {
      expect(() => registerSchema.parse({ ...valid, email: 'notanemail' })).toThrow();
    });

    test('rejects country code longer than 2 chars', () => {
      expect(() => registerSchema.parse({ ...valid, country: 'NGA' })).toThrow();
    });
  });

  describe('answerSubmitSchema', () => {
    test('accepts valid answer', () => {
      expect(() =>
        answerSubmitSchema.parse({
          questionId: 'abc123',
          selectedAnswer: 'A',
          timeSpentMs: 1500,
        })
      ).not.toThrow();
    });

    test('rejects invalid answer option', () => {
      expect(() =>
        answerSubmitSchema.parse({
          questionId: 'abc123',
          selectedAnswer: 'E',
          timeSpentMs: 1500,
        })
      ).toThrow();
    });

    test('rejects negative timeSpentMs', () => {
      expect(() =>
        answerSubmitSchema.parse({
          questionId: 'abc123',
          selectedAnswer: 'A',
          timeSpentMs: -100,
        })
      ).toThrow();
    });
  });
});
